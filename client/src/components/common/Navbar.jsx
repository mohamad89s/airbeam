import { Zap, Wifi, Clock, Moon, Sun } from 'lucide-react';

const Navbar = ({ onLogoClick, onHistoryClick, theme, toggleTheme, language, toggleLanguage, t }) => {
    return (
        <header>
            <div className="logo" onClick={onLogoClick} style={{ cursor: 'pointer' }}>
                <Zap size={24} fill="currentColor" />
                <span>{t('app_name')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)', marginLeft: 'auto' }}>
                <button
                    className="icon-btn theme-toggle"
                    onClick={toggleTheme}
                    title={theme === 'light' ? t('dark_mode') : t('light_mode')}
                    style={{ padding: '8px', color: theme === 'dark' ? 'var(--text-main)' : 'inherit' }}
                >
                    <div className="theme-icon-wrapper" key={theme}>
                        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    </div>
                </button>
                <button
                    className="icon-btn"
                    onClick={toggleLanguage}
                    title={t('language')}
                    style={{ fontWeight: 800, fontSize: '0.9rem', padding: '8px' }}
                >
                    {language === 'en' ? 'FA' : 'EN'}
                </button>
                <button className="icon-btn" onClick={onHistoryClick} title={t('history')} style={{ padding: '8px' }}>
                    <Clock size={20} />
                </button>
                <div className="success-badge desktop-only">
                    <Wifi size={14} /> {t('p2p_ready')}
                </div>
            </div>
        </header>
    );
};

export default Navbar;
