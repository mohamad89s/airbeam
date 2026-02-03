import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

const PasswordInput = ({ value, onChange, placeholder, onKeyDown, autoFocus, t }) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div style={{ position: 'relative', width: '100%' }}>
            <div style={{
                position: 'absolute',
                left: document.documentElement.dir === 'rtl' ? 'auto' : 'var(--s-3)',
                right: document.documentElement.dir === 'rtl' ? 'var(--s-3)' : 'auto',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                pointerEvents: 'none'
            }}>
                <Lock size={16} />
            </div>
            <input
                type={showPassword ? 'text' : 'password'}
                value={value}
                onChange={onChange}
                onKeyDown={onKeyDown}
                placeholder={placeholder || (t ? t('enter_password') : 'Enter password')}
                autoFocus={autoFocus}
                style={{
                    width: '100%',
                    padding: 'var(--s-3)',
                    paddingInlineStart: 'calc(var(--s-3) * 2 + 16px)',
                    paddingInlineEnd: 'calc(var(--s-3) * 2 + 24px)',
                    borderRadius: 'var(--radius-md)',
                    border: '1.5px solid var(--border-light)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem',
                    fontFamily: 'var(--font-en)',
                    transition: 'border-color 0.2s ease',
                    outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-light)'}
            />
            <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="icon-btn-small"
                style={{
                    position: 'absolute',
                    right: document.documentElement.dir === 'rtl' ? 'auto' : 'var(--s-2)',
                    left: document.documentElement.dir === 'rtl' ? 'var(--s-2)' : 'auto',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    padding: '4px',
                    background: 'transparent',
                    border: 'none'
                }}
                title={showPassword ? (t ? t('hide_password') : 'Hide') : (t ? t('show_password') : 'Show')}
            >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
        </div>
    );
};

export default PasswordInput;
