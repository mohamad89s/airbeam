import { ArrowLeft, ArrowRight, Camera, ShieldCheck, Copy, Clock, Send, Download, FileText, Type, Pause } from 'lucide-react';
import { formatBytes } from '../utils/helpers';

const Receiver = ({
    goHome,
    receivedText,
    status,
    roomId,
    setRoomId,
    startScanner,
    joinRoom,
    handleCopy,
    history,
    p2pConnectionState
}) => {
    const isSuccess = status.includes('successfully');
    const isPaused = status.toLowerCase().includes('paused');
    const isCancelled = status.toLowerCase().includes('cancelled');
    const isConnected = receivedText || status.includes('Connected') || status.includes('Receiving') || isSuccess || isPaused || isCancelled || p2pConnectionState === 'connected';

    return (
        <div className="card">
            <div className="card-header">
                <button onClick={goHome} className="icon-btn" style={{ padding: '6px' }}>
                    <ArrowLeft size={20} />
                </button>
                <h2 className="card-title">Receive</h2>
            </div>

            <div className="desktop-layout receiver-layout" style={{ gridTemplateColumns: isConnected ? '1fr' : undefined }}>
                {!isConnected && (
                    <div className="sidebar-panel">
                        <div className="connection-section" style={{ height: 'auto', minHeight: 'unset' }}>
                            <button className="icon-btn" onClick={startScanner} style={{ marginBottom: 'var(--s-4)', width: '56px', height: '56px', borderRadius: '50%' }}>
                                <Camera size={28} />
                            </button>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 'var(--s-2)' }}>Enter 6-digit code</p>
                            <div className="room-display">
                                <input
                                    value={roomId}
                                    onChange={(e) => setRoomId(e.target.value.replace(/\D/g, '').substring(0, 6))}
                                    onKeyDown={(e) => e.key === 'Enter' && roomId.length === 6 && joinRoom()}
                                    placeholder="000000"
                                />
                            </div>
                            <button
                                className="btn-secondary"
                                onClick={async () => {
                                    try {
                                        const text = await navigator.clipboard.readText();
                                        const cleaned = text.replace(/\D/g, '').substring(0, 6);
                                        if (cleaned) setRoomId(cleaned);
                                    } catch (err) {
                                        console.error('Failed to paste:', err);
                                    }
                                }}
                                style={{ margin: 'var(--s-2) 0', width: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}
                            >
                                <Copy size={14} /> Paste Code
                            </button>
                            <button
                                className="btn-primary"
                                onClick={joinRoom}
                                style={{ marginTop: 'var(--s-2)' }}
                            >
                                Connect <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                )}

                <div className="main-panel">
                    {isConnected ? (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--s-4)', justifyContent: 'center' }}>
                            {receivedText ? (
                                <div className="connection-section" style={{ textAlign: 'left', alignItems: 'flex-start' }}>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-main)', wordBreak: 'break-all', lineHeight: 1.6 }}>{receivedText}</p>
                                    <button className="btn-secondary" onClick={() => handleCopy(receivedText)} style={{ marginTop: 'var(--s-2)', width: 'auto' }}>
                                        <Copy size={14} /> Copy to Clipboard
                                    </button>
                                </div>
                            ) : isPaused ? (
                                <div style={{ textAlign: 'center', padding: 'var(--s-4) 0' }}>
                                    <div style={{ position: 'relative', display: 'inline-block' }}>
                                        <Download size={64} color="var(--primary)" style={{ opacity: 0.3 }} />
                                        <Pause size={32} color="var(--warning)" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
                                    </div>
                                    <p style={{ marginTop: 'var(--s-4)', fontWeight: 600, color: 'var(--warning)' }}>
                                        Transfer Paused by Sender
                                    </p>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        Waiting for sender to resume...
                                    </p>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 'var(--s-2)', opacity: 0.7 }}>
                                        You can leave this page while transferring
                                    </p>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: 'var(--s-4) 0' }}>
                                    <ShieldCheck size={64} color={isSuccess ? "var(--success)" : isCancelled ? "var(--error)" : "var(--primary)"} style={{ opacity: 0.8 }} />
                                    <p style={{ marginTop: 'var(--s-4)', fontWeight: 600, color: isSuccess ? 'var(--success)' : isCancelled ? 'var(--error)' : 'var(--text-muted)' }}>
                                        {status || 'Waiting for sender...'}
                                    </p>
                                    {!isSuccess && (
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 'var(--s-2)', opacity: 0.7 }}>
                                            You can leave this page while transferring
                                        </p>
                                    )}
                                </div>
                            )}

                            {history && history.length > 0 && (
                                <div className="receiver-history" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--s-4)', marginTop: 'auto' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--s-3)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                        <Clock size={14} /> Recent Beams (This Room)
                                    </div>
                                    <div className="history-list compact" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                        {history.slice(0, 10).map((item, index) => (
                                            <div key={`${item.timestamp}-${index}`} className="history-item" style={{ padding: 'var(--s-2)', fontSize: '0.8rem' }}>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 600, width: '12px' }}>{index + 1}</div>
                                                <div className={`history-direction ${item.direction}`} style={{ width: '24px', height: '24px' }}>
                                                    {item.direction === 'sent' ? <Send size={10} /> : <Download size={10} />}
                                                </div>
                                                <div className="history-body">
                                                    <div className="history-name" style={{ fontSize: '0.75rem' }}>{item.name}</div>
                                                    <div className="history-meta" style={{ fontSize: '0.65rem' }}>
                                                        {item.type === 'file' ? formatBytes(item.size) : 'Text Content'}
                                                    </div>
                                                </div>
                                                <div className="history-icon-type">
                                                    {item.type === 'file' ? <FileText size={12} /> : <Type size={12} />}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center', gap: 'var(--s-4)' }}>
                            <div className="desktop-only" style={{ padding: 'var(--s-8)', background: 'var(--bg-input)', borderRadius: '50%', color: 'var(--primary)', opacity: 0.6 }}>
                                <ArrowRight size={48} strokeWidth={1} />
                            </div>
                            <div>
                                <p style={{ fontWeight: 700, margin: 0 }}>Waiting for connection</p>
                                <p style={{ fontSize: '0.85rem' }}>Enter the code to start receiving</p>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 'var(--s-4)', opacity: 0.7 }}>
                                    Tip: You can leave this page while transferring and we'll keep the beam alive
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Receiver;
