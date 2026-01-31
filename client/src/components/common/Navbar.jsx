import { Zap, Wifi, Clock } from 'lucide-react';

const Navbar = ({ onLogoClick, onHistoryClick }) => {
    return (
        <header>
            <div className="logo" onClick={onLogoClick} style={{ cursor: 'pointer' }}>
                <Zap size={24} fill="currentColor" />
                <span>AirBeam</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)', marginLeft: 'auto' }}>
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
