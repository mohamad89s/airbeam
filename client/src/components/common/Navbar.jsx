import { Zap, Wifi, Clock, Moon, Sun } from 'lucide-react';

const Navbar = ({ onLogoClick, onHistoryClick, theme, toggleTheme }) => {
    return (
        <header>
            <div className="logo" onClick={onLogoClick} style={{ cursor: 'pointer' }}>
                <Zap size={24} fill="currentColor" />
                <span>AirBeam</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)', marginLeft: 'auto' }}>
                <button
                    className="icon-btn theme-toggle"
                    onClick={toggleTheme}
                    title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                    style={{ padding: '8px', color: theme === 'dark' ? 'var(--warning)' : 'inherit' }}
                >
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
                <button className="icon-btn" onClick={onHistoryClick} title="History" style={{ padding: '8px' }}>
                    <Clock size={20} />
                </button>
                <div className="success-badge">
                    <Wifi size={14} /> P2P Ready
                </div>
            </div>
        </header>
    );
};

export default Navbar;
