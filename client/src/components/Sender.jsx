import React, { useState, useRef } from 'react';
import { ArrowLeft, Copy, Check, ExternalLink, FileText, Zap, Pause, Play, RefreshCcw, X, ShieldCheck } from 'lucide-react';
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
    progress,
    p2pConnectionState,
    t
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

    const isSuccess = status.includes('successfully') || status === t('files_beamed_success');

    const handleBeamMore = () => {
        setStatus(t('waiting_for_receiver'));
        resetTransfer();
    };

    if (isSuccess) {
        return (
            <div className="card">
                <div className="card-header">
                    <button onClick={goHome} className="icon-btn" style={{ padding: '6px' }}>
                        <ArrowLeft size={20} style={{ transform: document.documentElement.dir === 'rtl' ? 'rotate(180deg)' : 'none' }} />
                    </button>
                    <h2 className="card-title">{t('success')}</h2>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--s-4)', justifyContent: 'center', textAlign: 'center', padding: 'var(--s-8) 0' }}>
                    <div style={{ position: 'relative', display: 'inline-block', margin: '0 auto' }}>
                        <Zap size={64} color="var(--success)" fill="var(--success)" style={{ opacity: 0.8 }} />
                        <div style={{ position: 'absolute', top: -10, right: -10, background: 'var(--success)', color: 'white', borderRadius: '50%', padding: '4px' }}>
                            <Check size={20} strokeWidth={3} />
                        </div>
                    </div>
                    <p style={{ marginTop: 'var(--s-4)', fontWeight: 700, color: 'var(--success)', fontSize: '1.2rem' }}>
                        {t(status) || status}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {t('beam_delivered')}
                    </p>
                    <button className="btn-primary" onClick={handleBeamMore} style={{ marginTop: 'var(--s-6)', alignSelf: 'center' }}>
                        {t('beam_more')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-header">
                <button onClick={goHome} className="icon-btn" style={{ padding: '6px' }}>
                    <ArrowLeft size={20} style={{ transform: document.documentElement.dir === 'rtl' ? 'rotate(180deg)' : 'none' }} />
                </button>
                <h2 className="card-title">{t('sending')}</h2>
                <div className="tab-group" style={{ marginInlineStart: 'auto' }}>
                    <button
                        className={`tab-btn ${transferType === 'file' ? 'active' : ''}`}
                        onClick={() => setTransferType('file')}
                    >{t('files')}</button>
                    <button
                        className={`tab-btn ${transferType === 'text' ? 'active' : ''}`}
                        onClick={() => setTransferType('text')}
                    >{t('text')}</button>
                </div>
            </div>

            <div className="desktop-layout sender-layout">
                <div className="sidebar-panel">
                    {p2pConnectionState !== 'connected' ? (
                        <div className="connection-section connection-fade-in">
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
                                        <span>{copied ? t('copied') : t('copy')}</span>
                                    </button>
                                </div>
                                <div className="qr-mini">
                                    <QRCodeCanvas value={`${window.location.origin}?room=${roomId}`} size={160} />
                                </div>
                            </div>
                            <div style={{ textAlign: 'center', marginTop: 'var(--s-2)', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                                {t('ask_receiver')}
                            </div>
                        </div>
                    ) : (
                        <div className="connection-section connection-fade-in" style={{ textAlign: 'center', padding: 'var(--s-6)' }}>
                            <ShieldCheck size={64} color="var(--primary)" style={{ opacity: 0.8 }} className="shield-icon" />
                            <p style={{ marginTop: 'var(--s-4)', fontWeight: 600, color: 'var(--text-muted)' }}>
                                {t('connected')}
                            </p>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 'var(--s-2)', opacity: 0.7 }}>
                                {t('ready_to_beam')}
                            </p>
                        </div>
                    )}
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
                                        {files.length > 0 ? t('add_more') : t('choose_files')}
                                    </p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                        {isDragging ? t('drop_files') : t('tap_to_browse')}
                                    </p>
                                </div>
                            </div>
                            {files.length > 0 && (
                                <FileList
                                    files={files}
                                    onRemove={removeFile}
                                    onRename={renameFile}
                                    t={t}
                                />
                            )}
                        </div>
                    ) : (
                        <textarea
                            className="text-area"
                            placeholder={t('enter_text')}
                            value={sharedText}
                            onChange={(e) => setSharedText(e.target.value)}
                            style={{ flex: 1 }}
                        />
                    )}

                    {transferType === 'file' && progress > 0 && progress < 100 ? (
                        <>
                            <div style={{ display: 'flex', gap: 'var(--s-2)', marginTop: 'auto' }}>
                                <button
                                    className={`btn-primary ${isPaused ? 'paused' : ''}`}
                                    onClick={togglePause}
                                    disabled={isPaused && p2pConnectionState !== 'connected'}
                                    style={{ flex: 1, opacity: (isPaused && p2pConnectionState !== 'connected') ? 0.5 : 1 }}
                                >
                                    {isPaused ? <Play size={18} fill="currentColor" style={{ transform: document.documentElement.dir === 'rtl' ? 'rotate(180deg)' : 'none' }} /> : <Pause size={18} fill="currentColor" />}
                                    {isPaused ? (p2pConnectionState === 'connected' ? t('resume') : t('reconnecting')) : t('pause')}
                                </button>
                                {isPaused && (
                                    <button
                                        className="btn-secondary"
                                        onClick={cancelTransfer}
                                        style={{ width: 'auto', padding: '0 var(--s-4)', color: 'var(--error)', borderColor: 'var(--error)', display: 'flex', alignItems: 'center', gap: '8px' }}
                                    >
                                        <X size={18} /> {t('cancel')}
                                    </button>
                                )}
                            </div>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 'var(--s-3)', opacity: 0.7 }}>
                                {t('leave_page_tip')}
                            </p>
                        </>
                    ) : (
                        <button
                            className="btn-primary"
                            onClick={transferType === 'file' ? sendFiles : sendText}
                            disabled={transferType === 'file' ? files.length === 0 : !sharedText.trim()}
                            style={{ marginTop: 'auto' }}
                        >
                            <Zap size={18} fill="currentColor" /> {transferType === 'file' ? t('beam_files') : t('beam_text')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Sender;
