import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const Scanner = ({ onScan, onClose, t }) => {
    useEffect(() => {
        const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
        scanner.render((text) => {
            onScan(text);
            scanner.clear();
            onClose();
        }, () => { });

        return () => {
            scanner.clear().catch(err => console.error("Failed to clear scanner", err));
        };
    }, [onScan, onClose]);

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.9)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--s-8)' }}>
            <button onClick={onClose} className="icon-btn" style={{ position: 'absolute', top: 'var(--s-6)', right: 'var(--s-6)', width: '44px', height: '44px', borderRadius: '50%' }}>
                <X size={24} />
            </button>
            <div id="reader" style={{ width: '100%', maxWidth: '360px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '4px solid white', boxShadow: '0 0 40px rgba(0,0,0,0.5)' }}></div>
            <p style={{ color: 'white', marginTop: 'var(--s-6)', fontWeight: 700, fontSize: '1.1rem' }}>{t('scan_qr')}</p>
        </div>
    );
};

export default Scanner;
