import { ArrowLeft, ArrowRight, Camera, ShieldCheck, Copy, Clock, Send, Download, FileText, Type } from 'lucide-react';
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
    history
}) => {
    const isSuccess = status.includes('successfully');

    return (
        <div className="card">
            <div className="card-header">
                <button onClick={goHome} className="icon-btn" style={{ padding: '6px' }}>
                    <ArrowLeft size={20} />
                </button>
                <h2 className="card-title">Receive</h2>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--s-4)', overflow: 'hidden' }}>
                {!receivedText && !status.includes('Connected') && !status.includes('Receiving') && !status.includes('Connecting') && !isSuccess ? (
                    <div className="connection-section" style={{ flex: 1, justifyContent: 'center' }}>
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
                            className="btn-primary"
                            onClick={joinRoom}
                            style={{ marginTop: 'var(--s-2)' }}
                        >
                            Connect <ArrowRight size={20} />
                        </button>
                    </div>
                ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--s-4)', justifyContent: 'center', overflow: 'hidden' }}>
                        {receivedText ? (
                            <div className="connection-section" style={{ textAlign: 'left', alignItems: 'flex-start' }}>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-main)', wordBreak: 'break-all', lineHeight: 1.6 }}>{receivedText}</p>
                                <button className="btn-secondary" onClick={() => handleCopy(receivedText)} style={{ marginTop: 'var(--s-2)', width: 'auto' }}>
                                    <Copy size={14} /> Copy to Clipboard
                                </button>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: 'var(--s-4) 0' }}>
                                <ShieldCheck size={64} color={isSuccess ? "var(--success)" : "var(--primary)"} style={{ opacity: 0.8 }} />
                                <p style={{ marginTop: 'var(--s-4)', fontWeight: 600, color: isSuccess ? 'var(--success)' : 'var(--text-muted)' }}>
                                    {status || 'Waiting for sender...'}
                                </p>
                            </div>
                        )}

                        {history && history.length > 0 && (
                            <div className="receiver-history" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--s-4)', marginTop: 'auto', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--s-3)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    <Clock size={14} /> Recent Beams
                                </div>
                                <div className="history-list compact" style={{ maxHeight: '160px', overflowY: 'auto' }}>
                                    {history.slice(0, 5).map((item, index) => (
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
                )}
            </div>
        </div>
    );
};

export default Receiver;
