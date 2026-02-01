import React, { useState, useRef } from 'react';
import { ArrowLeft, Copy, Check, ExternalLink, FileText, Zap, Pause, Play, RefreshCcw, X } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import FileList from './FileList';

const Sender = ({
    goHome,
    transferType,
    setTransferType,
    roomId,
    handleCopy,
    copied,
    files,
    setFiles,
    removeFile,
    renameFile,
    sharedText,
    setSharedText,
    sendFiles,
    sendText,
    status,
    setStatus,
    resetTransfer,
    isPaused,
    togglePause,
    cancelTransfer,
    progress
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

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
            setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
        }
    };

    const onFileInputChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFiles(prev => [...prev, ...Array.from(e.target.files)]);
        }
        // Small delay to ensure browser processed the selection
        const target = e.target;
        setTimeout(() => { target.value = null; }, 100);
    };

    const isSuccess = status.includes('successfully');

    const handleBeamMore = () => {
        setStatus('Waiting for receiver');
        resetTransfer();
    };

    if (isSuccess) {
        return (
            <div className="card">
                <div className="card-header">
                    <button onClick={goHome} className="icon-btn" style={{ padding: '6px' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <h2 className="card-title">Success</h2>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--s-4)', justifyContent: 'center', textAlign: 'center', padding: 'var(--s-8) 0' }}>
                    <div style={{ position: 'relative', display: 'inline-block', margin: '0 auto' }}>
                        <Zap size={64} color="var(--success)" fill="var(--success)" style={{ opacity: 0.8 }} />
                        <div style={{ position: 'absolute', top: -10, right: -10, background: 'var(--success)', color: 'white', borderRadius: '50%', padding: '4px' }}>
                            <Check size={20} strokeWidth={3} />
                        </div>
                    </div>
                    <p style={{ marginTop: 'var(--s-4)', fontWeight: 700, color: 'var(--success)', fontSize: '1.2rem' }}>
                        {status}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Your beam was delivered instantly.
                    </p>
                    <button className="btn-primary" onClick={handleBeamMore} style={{ marginTop: 'var(--s-6)', alignSelf: 'center' }}>
                        Beam More
                    </button>
                </div>
            </div>
        );
    }

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

            <div className="desktop-layout sender-layout">
                <div className="sidebar-panel">
                    <div className="connection-section">
                        <div className="room-qr-container">
                            <div className="sender-room-info">
                                <div className="room-display">
                                    <input readOnly value={roomId} onClick={() => handleCopy(roomId)} />
                                </div>
                                <button
                                    className="btn-secondary"
                                    onClick={() => handleCopy(roomId)}
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                >
                                    {copied ? <Check size={16} className="success-text" /> : <Copy size={16} />}
                                    <span>{copied ? 'Copied' : 'Copy'}</span>
                                </button>
                            </div>
                            <div className="qr-mini">
                                <QRCodeCanvas value={`${window.location.origin}?room=${roomId}`} size={160} />
                            </div>
                        </div>
                        <div style={{ textAlign: 'center', marginTop: 'var(--s-2)', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                            Ask receiver to scan this QR <br /> or enter the 6-digit code.
                        </div>
                    </div>
                </div>

                <div className="main-panel">
                    {transferType === 'file' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-4)', height: '100%' }}>
                            <div
                                className={`drop-zone ${isDragging ? 'dragging' : ''}`}
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                style={{ minHeight: files.length > 0 ? '80px' : '100px' }}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    style={{ display: 'none' }}
                                    onChange={onFileInputChange}
                                    onClick={e => e.stopPropagation()}
                                />
                                <div className="icon-wrap" style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-soft)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FileText size={24} />
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ fontWeight: 700, margin: 0, fontSize: '0.9rem' }}>
                                        {files.length > 0 ? 'Add more files' : 'Choose files'}
                                    </p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                        {isDragging ? "Drop them here!" : "Tap to browse or drag & drop"}
                                    </p>
                                </div>
                            </div>
                            {files.length > 0 && (
                                <FileList
                                    files={files}
                                    onRemove={removeFile}
                                    onRename={renameFile}
                                />
                            )}
                        </div>
                    ) : (
                        <textarea
                            className="text-area"
                            placeholder="Enter text or paste links..."
                            value={sharedText}
                            onChange={(e) => setSharedText(e.target.value)}
                            style={{ flex: 1 }}
                        />
                    )}

                    {transferType === 'file' && progress > 0 && progress < 100 ? (
                        <div style={{ display: 'flex', gap: 'var(--s-2)', marginTop: 'auto' }}>
                            <button
                                className={`btn-primary ${isPaused ? 'paused' : ''}`}
                                onClick={togglePause}
                                style={{ flex: 1 }}
                            >
                                {isPaused ? <Play size={18} fill="currentColor" /> : <Pause size={18} fill="currentColor" />}
                                {isPaused ? 'Resume' : 'Pause'}
                            </button>
                            {isPaused && (
                                <button
                                    className="btn-secondary"
                                    onClick={cancelTransfer}
                                    style={{ width: 'auto', padding: '0 var(--s-4)', color: 'var(--error)', borderColor: 'var(--error)', display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    <X size={18} /> Cancel
                                </button>
                            )}
                        </div>
                    ) : (
                        <button
                            className="btn-primary"
                            onClick={transferType === 'file' ? sendFiles : sendText}
                            disabled={transferType === 'file' ? files.length === 0 : !sharedText.trim()}
                            style={{ marginTop: 'auto' }}
                        >
                            <Zap size={18} fill="currentColor" /> {transferType === 'file' ? 'Beam Files' : 'Beam Text'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Sender;
