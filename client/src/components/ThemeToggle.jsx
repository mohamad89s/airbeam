import React from 'react';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = ({ theme, toggleTheme }) => {
    return (
        <button
            onClick={toggleTheme}
            className="icon-btn theme-toggle"
            aria-label="Toggle theme"
            style={{
                position: 'relative',
                width: '40px',
                height: '40px',
                overflow: 'hidden'
            }}
        >
            <div style={{
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: theme === 'light' ? 'translateY(0)' : 'translateY(-100%)'
            }}>
                <Sun size={20} />
            </div>
            <div style={{
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: theme === 'light' ? 'translateY(100%)' : 'translateY(0)'
            }}>
                <Moon size={20} />
            </div>
        </button>
    );
};

export default ThemeToggle;
