import multer from 'multer';
import path from 'path';
import os from 'os';

// Use disk storage — we need the local file for OCR before Cloudinary upload
export const upload = multer({
    storage: multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, os.tmpdir()),
        filename: (_req, file, cb) => {
            const ext = path.extname(file.originalname) || (file.mimetype === 'application/pdf' ? '.pdf' : '.jpg');
            cb(null, `receipt_${Date.now()}${ext}`);
        },
    }),
    limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
    fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'image/heic', 'image/heif'];
        if (!allowed.includes(file.mimetype)) {
            return cb(new Error('Only JPG, PNG, WEBP, HEIC, or PDF files are allowed'));
        }
        cb(null, true);
    },
});
