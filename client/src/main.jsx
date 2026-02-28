import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import { store } from './store/index.js';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <Provider store={store}>
            <App />
            <Toaster
                position="bottom-right"
                toastOptions={{
                    style: {
                        background: '#1e293b',
                        color: '#e2e8f0',
                        border: '1px solid #334155',
                        borderRadius: '10px',
                        fontFamily: 'Inter, sans-serif',
                    },
                    success: { iconTheme: { primary: '#10b981', secondary: '#1e293b' } },
                    error: { iconTheme: { primary: '#ef4444', secondary: '#1e293b' } },
                }}
            />
        </Provider>
    </React.StrictMode>
);
