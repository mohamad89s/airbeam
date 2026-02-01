import React from 'react';
import { Send, Download } from 'lucide-react';

const Home = ({ onModeSelect, t }) => {
    return (
        <div className="home-content" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-8)', paddingTop: 'var(--s-8)', alignItems: 'center' }}>
            <div style={{ textAlign: 'center', maxWidth: '600px' }}>
                <h1 className="hero-title" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: 'var(--s-4)', color: 'var(--text-main)', letterSpacing: '-0.04em', lineHeight: 1.1, fontWeight: 800 }}>
                    {t('hero_title')}
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: 'clamp(1rem, 1.2vw, 1.25rem)', fontWeight: 500, lineHeight: 1.6 }}>
                    {t('hero_subtitle')}
                </p>
            </div>
            <div className="home-grid">
                <div className="mode-card" onClick={() => onModeSelect('sender')}>
                    <div className="icon-wrap"><Send size={32} strokeWidth={2.5} /></div>
                    <span style={{ fontWeight: 700 }}>{t('send')}</span>
                </div>
                <div className="mode-card" onClick={() => onModeSelect('receiver')}>
                    <div className="icon-wrap"><Download size={32} strokeWidth={2.5} /></div>
                    <span style={{ fontWeight: 700 }}>{t('receive')}</span>
                </div>
            </div>
        </div>
    );
};

export default Home;
