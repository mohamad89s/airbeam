import React from 'react';

import { Wifi } from 'lucide-react';

const Footer = ({ t }) => {
    return (
        <footer>
            <div className={`success-badge mobile-only`} style={{ fontSize: '0.6rem', padding: '2px 6px' }}>
                <Wifi size={10} /> {t('p2p_ready')}
            </div>
            <span>P2P Direct</span>
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--border-subtle)' }}></div>
            <span>No Server Lag</span>
            <div className="desktop-only" style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--border-subtle)' }}></div>
            <span className="desktop-only">Private</span>
        </footer>
    );
};

export default Footer;
