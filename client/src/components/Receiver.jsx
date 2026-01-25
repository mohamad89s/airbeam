import React from 'react';
import { ArrowLeft, ArrowRight, Camera, ShieldCheck, Copy } from 'lucide-react';

const Receiver = ({
    goHome,
    receivedText,
    status,
    roomId,
    setRoomId,
    startScanner,
    joinRoom,
    handleCopy
}) => {
    return (
        <div className="card">
            <div className="card-header">
                <button onClick={goHome} className="icon-btn" style={{ padding: '6px' }}>
                    <ArrowLeft size={20} />
                </button>
                <h2 className="card-title">Receive</h2>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--s-4)' }}>
                {!receivedText && !status.includes('Connected') && !status.includes('Receiving') ? (
                    <div className="connection-section" style={{ flex: 1, justifyContent: 'center' }}>
                        <button className="icon-btn" onClick={startScanner} style={{ marginBottom: 'var(--s-4)', width: '56px', height: '56px', borderRadius: '50%' }}>
                            <Camera size={28} />
                        </button>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 'var(--s-2)' }}>Enter 6-digit code</p>
                        <div className="room-display">
                            <input
                                value={roomId}
                                onChange={(e) => setRoomId(e.target.value.replace(/\D/g, '').substring(0, 6))}
                                placeholder="000000"
                            />
                        </div>
                        <button
                            className="btn-primary"
                            onClick={joinRoom}
                            style={{ marginTop: 'var(--s-2)' }}
                        >
                            Connect <ArrowRight size={20} />
                        </button>
                    </div>
                ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--s-4)', justifyContent: 'center' }}>
                        {receivedText ? (
                            <div className="connection-section" style={{ textAlign: 'left', alignItems: 'flex-start' }}>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-main)', wordBreak: 'break-all', lineHeight: 1.6 }}>{receivedText}</p>
                                <button className="btn-secondary" onClick={() => handleCopy(receivedText)} style={{ marginTop: 'var(--s-2)', width: 'auto' }}>
                                    <Copy size={14} /> Copy to Clipboard
                                </button>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: 'var(--s-8) 0' }}>
                                <ShieldCheck size={64} color="var(--success)" style={{ opacity: 0.8 }} />
                                <p style={{ marginTop: 'var(--s-4)', fontWeight: 600, color: 'var(--text-muted)' }}>Waiting for sender...</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Receiver;
