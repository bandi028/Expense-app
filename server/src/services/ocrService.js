import Tesseract from 'tesseract.js';
import fs from 'fs';
import { createCanvas } from 'canvas';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import Groq from 'groq-sdk';

// ─── Groq client (lazy — only if API key is set) ─────────────────────────────
let _groq = null;
const getGroq = () => {
    if (_groq) return _groq;
    const key = process.env.GROQ_API_KEY;
    if (!key) return null;
    _groq = new Groq({ apiKey: key });
    return _groq;
};

// ─── Category keywords (regex fallback) ──────────────────────────────────────
const CATEGORY_KEYWORDS = {
    food: ['restaurant', 'cafe', 'pizza', 'burger', 'biryani', 'swiggy', 'zomato', 'kfc', 'mcdonalds', 'subway', 'hotel', 'dhaba', 'bakery', 'burrito', 'taco', 'paneer', 'dining', 'mandi', 'taco bell', 'o bell'],
    groceries: ['grocery', 'supermarket', 'bigbasket', 'blinkit', 'dmart', 'reliance fresh', 'more', 'nilgiris'],
    transport: ['uber', 'ola', 'rapido', 'metro', 'railway', 'irctc', 'bus', 'fuel', 'petrol', 'diesel', 'parking', 'toll', 'cab', 'taxi'],
    shopping: ['amazon', 'flipkart', 'myntra', 'mall', 'store', 'shop', 'fashion', 'clothing', 'electronics', 'nykaa', 'meesho'],
    health: ['pharmacy', 'hospital', 'clinic', 'doctor', 'medicine', 'lab', 'diagnostic', 'medplus', 'apollo', 'netmeds'],
    entertainment: ['netflix', 'spotify', 'cinema', 'movie', 'theatre', 'concert', 'bookmyshow', 'prime', 'hotstar'],
    utilities: ['electricity', 'water', 'gas', 'internet', 'broadband', 'airtel', 'jio', 'vi', 'bsnl', 'wifi', 'recharge'],
    education: ['school', 'college', 'university', 'course', 'udemy', 'coursera', 'books', 'stationery'],
};

export const suggestCategoryFromText = (text) => {
    const lower = text.toLowerCase();
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (keywords.some((kw) => lower.includes(kw))) return category;
    }
    return 'other';
};

// ─── Groq-powered AI parsing ──────────────────────────────────────────────────
const parseWithGroq = async (rawText) => {
    const groq = getGroq();
    if (!groq) return null;

    try {
        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            response_format: { type: 'json_object' },
            messages: [
                {
                    role: 'system',
                    content: `You are a receipt/invoice parser. Extract structured data from receipt text and return ONLY a JSON object with these exact fields:
{
  "title": "merchant or restaurant name (string, max 60 chars)",
  "amount": <final total amount as a number — after discounts, after tax, e.g. 241.5>,
  "date": "invoice/bill date in YYYY-MM-DD format, or null if not found",
  "category": "one of: food, groceries, transport, shopping, health, entertainment, utilities, education, other"
}

Rules:
- amount must be the FINAL amount paid (Grand Total / Total Invoice Value / net payable)
- date must be the invoice date, not a time
- category based on merchant type (restaurants/food delivery = food, cab/fuel = transport, etc.)
- Return ONLY the JSON, nothing else`,
                },
                {
                    role: 'user',
                    content: `Parse this receipt:\n\n${rawText.slice(0, 4000)}`,
                },
            ],
            temperature: 0.1,
            max_tokens: 200,
        });

        const text = completion.choices[0]?.message?.content?.trim();
        const parsed = JSON.parse(text);
        console.log('🤖 Groq AI parsed:', parsed);
        return parsed;
    } catch (err) {
        console.warn('⚠️  Groq parsing failed:', err.message);
        return null;
    }
};

// ─── Regex fallback parser ────────────────────────────────────────────────────
const parseWithRegex = (fullText) => {
    const text = fullText
        .replace(/\bT\s+otal\b/gi, 'Total')
        .replace(/\bSub\s+T\s+otal\b/gi, 'SubTotal')
        .replace(/\bG\s+rand\b/gi, 'Grand');

    let amount = null;

    const explicitINR = text.match(/\bAmount\s+(?:of\s+)?INR\s+([\d,]+(?:\.\d{1,2})?)/i)
        || text.match(/INR\s+([\d,]+(?:\.\d{1,2})?)\s+settled/i);
    if (explicitINR) {
        const val = parseFloat(explicitINR[1].replace(/,/g, ''));
        if (!isNaN(val) && val > 0) amount = val;
    }

    if (!amount) {
        const totalLines = [...text.matchAll(/^.*(?:grand\s+total|total\s+invoice\s+value|total\s+amount|net\s+amount|total\s+value).*$/gim)];
        for (const m of totalLines) {
            const nums = [...m[0].matchAll(/(\d[\d,.]*)/g)];
            if (nums.length) {
                const val = parseFloat(nums[nums.length - 1][1].replace(/,/g, ''));
                if (!isNaN(val) && val > 0) { amount = val; break; }
            }
        }
    }

    if (!amount) {
        const currencyNums = [...text.matchAll(/(?:₹|Rs\.?)\s*([\d,]+(?:\.\d{1,2})?)/gi)];
        if (currencyNums.length) {
            const vals = currencyNums.map((m) => parseFloat(m[1].replace(/,/g, ''))).filter((v) => !isNaN(v) && v > 0);
            if (vals.length) amount = Math.max(...vals);
        }
    }

    if (!amount) {
        const intTotal = text.match(/\bTotal\s*[:=]?\s*(\d{2,6}(?:\.\d{1,2})?)\b/i);
        if (intTotal) {
            const val = parseFloat(intTotal[1]);
            if (!isNaN(val) && val > 0) amount = val;
        }
    }

    let date = null;
    const isoDate = text.match(/\b(20\d{2})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])\b/);
    if (isoDate) date = `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}`;
    if (!date) {
        const dmy = text.match(/\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](20\d{2})\b/);
        if (dmy) date = `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
    }

    const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 3 && !/^\d/.test(l));
    return { title: lines[0]?.substring(0, 60) || null, amount, date, category: suggestCategoryFromText(text) };
};

// ─── PDF text extraction ──────────────────────────────────────────────────────
const extractPdfText = async (pdfPath) => {
    const data = new Uint8Array(fs.readFileSync(pdfPath));
    const pdfDoc = await pdfjsLib.getDocument({ data }).promise;
    const page = await pdfDoc.getPage(1);

    const textContent = await page.getTextContent();
    const nativeText = textContent.items.map((item) => item.str).join(' ');

    if (nativeText.trim().length > 50) {
        console.log('🔍 OCR: Digital PDF — native text extraction');
        return { text: nativeText, method: 'native' };
    }

    console.log('🔍 OCR: Scanned PDF — Tesseract fallback');
    const scale = 2.5;
    const viewport = page.getViewport({ scale });
    const canvas = createCanvas(viewport.width, viewport.height);
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    const imgPath = pdfPath.replace(/\.pdf$/i, '_ocr.png');
    fs.writeFileSync(imgPath, canvas.toBuffer('image/png'));
    return { imgPath, method: 'tesseract' };
};

// ─── Main entry point ─────────────────────────────────────────────────────────
export const extractFromReceipt = async (localFilePath) => {
    const tmpFiles = [];
    try {
        const isPdf = localFilePath.toLowerCase().endsWith('.pdf');
        let rawText = '';

        if (isPdf) {
            const pdfResult = await extractPdfText(localFilePath);
            if (pdfResult.method === 'native') {
                rawText = pdfResult.text;
            } else {
                tmpFiles.push(pdfResult.imgPath);
                const { data: { text } } = await Tesseract.recognize(pdfResult.imgPath, 'eng', { logger: () => { } });
                rawText = text;
            }
        } else {
            console.log('🔍 OCR: Tesseract scanning image...');
            const { data: { text } } = await Tesseract.recognize(localFilePath, 'eng', { logger: () => { } });
            rawText = text;
        }

        console.log('🔍 OCR text (first 300):\n' + rawText.slice(0, 300));

        // Try Groq AI first, fall back to regex
        let parsed = null;
        if (process.env.GROQ_API_KEY) {
            console.log('🤖 Sending to Groq AI...');
            parsed = await parseWithGroq(rawText);
        }
        if (!parsed) {
            console.log('📐 Using regex fallback parser');
            parsed = parseWithRegex(rawText);
        }

        return {
            title: parsed.title || null,
            amount: typeof parsed.amount === 'number' ? parsed.amount : parseFloat(parsed.amount) || null,
            date: parsed.date || null,
            category: parsed.category || 'other',
            description: rawText.slice(0, 200).replace(/\n/g, ' ').trim(),
            rawText,
            ocrAvailable: true,
        };
    } catch (err) {
        console.error('OCR error:', err.message);
        throw Object.assign(new Error('Failed to process receipt'), { status: 422 });
    } finally {
        for (const f of tmpFiles) {
            if (f && fs.existsSync(f)) fs.unlinkSync(f);
        }
    }
};
