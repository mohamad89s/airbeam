import React from 'react';
import { X, Clock, Trash2, Download, Send, FileText, Type } from 'lucide-react';
import { formatBytes } from '../utils/helpers';

const HistoryModal = ({ isOpen, onClose, history, onClear }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="card-header" style={{ marginBottom: 'var(--s-4)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)' }}>
                        <div className="icon-wrap-small">
                            <Clock size={16} />
                        </div>
                        <h2 className="card-title">Transfer History</h2>
                    </div>
                    <button className="icon-btn" onClick={onClose} style={{ marginLeft: 'auto', padding: '6px' }}>
                        <X size={20} />
                    </button>
                </div>

                <div className="history-list">
                    {history.length === 0 ? (
                        <div className="empty-history">
                            <Clock size={48} className="text-muted" style={{ opacity: 0.2, marginBottom: 'var(--s-2)' }} />
                            <p>No recent transfers</p>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sent and received items appear here</span>
                        </div>
                    ) : (
                        history.map((item, index) => (
                            <div key={`${item.timestamp}-${index}`} className="history-item">
                                <div className={`history-direction ${item.direction}`}>
                                    {item.direction === 'sent' ? <Send size={14} /> : <Download size={14} />}
                                </div>
                                <div className="history-body">
                                    <div className="history-name" title={item.name}>
                                        {item.name}
                                    </div>
                                    <div className="history-meta">
                                        {item.type === 'file' ? formatBytes(item.size) : 'Text Content'} • {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                                <div className="history-icon-type">
                                    {item.type === 'file' ? <FileText size={16} /> : <Type size={16} />}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {history.length > 0 && (
                    <button className="btn-secondary danger" onClick={onClear} style={{ marginTop: 'var(--s-4)', width: '100%', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <Trash2 size={16} />
                        Clear History
                    </button>
                )}
            </div>
        </div>
    );
};

export default HistoryModal;
