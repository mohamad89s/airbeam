import React from 'react';
import { Zap, Wifi } from 'lucide-react';

const Navbar = ({ onLogoClick }) => {
    return (
        <header>
            <div className="logo" onClick={onLogoClick} style={{ cursor: 'pointer' }}>
                <Zap size={24} fill="currentColor" />
                <span>AirBeam</span>
            </div>
            <div className="success-badge">
                <Wifi size={14} /> P2P Ready
            </div>
        </header>
    );
};

export default Navbar;
