import React from 'react';
import { Send, Download } from 'lucide-react';

const Home = ({ onModeSelect }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-8)', paddingTop: 'var(--s-8)' }}>
            <div style={{ textAlign: 'center' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: 'var(--s-2)', color: 'var(--text-main)', letterSpacing: '-0.03em' }}>
                    Beam files <br /> instantly.
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Private local peer-to-peer sharing.</p>
            </div>
            <div className="home-grid">
                <div className="mode-card" onClick={() => onModeSelect('sender')}>
                    <div className="icon-wrap"><Send size={32} strokeWidth={2.5} /></div>
                    <span style={{ fontWeight: 700 }}>Send</span>
                </div>
                <div className="mode-card" onClick={() => onModeSelect('receiver')}>
                    <div className="icon-wrap"><Download size={32} strokeWidth={2.5} /></div>
                    <span style={{ fontWeight: 700 }}>Receive</span>
                </div>
            </div>
        </div>
    );
};

export default Home;
