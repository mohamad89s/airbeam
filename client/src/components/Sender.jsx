import React, { useState } from 'react';
import { ArrowLeft, Copy, Check, ExternalLink, FileText, Zap } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

const Sender = ({
    goHome,
    transferType,
    setTransferType,
    roomId,
    handleCopy,
    copied,
    files,
    setFiles,
    sharedText,
    setSharedText,
    sendFiles,
    sendText
}) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setFiles(Array.from(e.dataTransfer.files));
        }
    };

    const onFileInputChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFiles(Array.from(e.target.files));
        }
    };

    return (
        <div className="card">
            <div className="card-header">
                <button onClick={goHome} className="icon-btn" style={{ padding: '6px' }}>
                    <ArrowLeft size={20} />
                </button>
                <h2 className="card-title">Send</h2>
                <div className="tab-group" style={{ marginLeft: 'auto' }}>
                    <button
                        className={`tab-btn ${transferType === 'file' ? 'active' : ''}`}
                        onClick={() => setTransferType('file')}
                    >Files</button>
                    <button
                        className={`tab-btn ${transferType === 'text' ? 'active' : ''}`}
                        onClick={() => setTransferType('text')}
                    >Text</button>
                </div>
            </div>

            <div className="connection-section">
                <div style={{ width: '100%', marginBottom: 'var(--s-4)' }}>
                    <div className="room-display" style={{ marginBottom: 'var(--s-2)' }}>
                        <input readOnly value={roomId} onClick={() => handleCopy(roomId)} />
                    </div>
                    <button
                        className="btn-secondary"
                        onClick={() => handleCopy(roomId)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                        {copied ? <Check size={16} className="success-text" /> : <Copy size={16} />}
                        <span>{copied ? 'Copied' : 'Copy Code'}</span>
                    </button>
                </div>
                <div className="qr-mini">
                    <QRCodeCanvas value={`${window.location.origin}?room=${roomId}`} size={160} />
                </div>
            </div>

            {transferType === 'file' ? (
                <div
                    className={`drop-zone ${isDragging ? 'dragging' : ''}`}
                    onClick={() => document.getElementById('file-input').click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <input id="file-input" type="file" multiple style={{ display: 'none' }}
                        onChange={onFileInputChange} />
                    <div className="icon-wrap" style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-soft)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileText size={24} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ fontWeight: 700, margin: 0, fontSize: '0.9rem' }}>
                            {files.length > 0 ? `${files.length} files selected` : 'Choose files'}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {isDragging ? "Drop them here!" : "Tap to browse or drag & drop"}
                        </p>
                    </div>
                </div>
            ) : (
                <textarea
                    className="text-area"
                    placeholder="Enter text or paste links..."
                    value={sharedText}
                    onChange={(e) => setSharedText(e.target.value)}
                />
            )}

            <button className="btn-primary" onClick={transferType === 'file' ? sendFiles : sendText} disabled={!files.length && !sharedText}>
                <Zap size={18} fill="currentColor" /> {transferType === 'file' ? 'Beam Files' : 'Beam Text'}
            </button>
        </div>
    );
};

export default Sender;
