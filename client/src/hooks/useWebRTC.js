import { useState, useRef, useEffect, useCallback } from 'react';
import { socket } from '../services/socket';
import { WebRTCManager } from '../services/webrtc';
import { calculateTransferStats } from '../utils/helpers';
import { backgroundShield } from '../services/backgroundShield';

export const useWebRTC = (onReceived) => {
    const [status, setStatus] = useState('');
    const [progress, setProgress] = useState(0);
    const [stats, setStats] = useState({ speed: '0 B/s', eta: '0s' });
    const [receivedText, setReceivedText] = useState('');
    const [isPaused, setIsPaused] = useState(false);

    const rtcManager = useRef(null);
    const metadataRef = useRef(null);
    const receivedChunks = useRef([]);
    const receivedSize = useRef(0);
    const pendingDownloadRef = useRef(null);
    const pauseResolveRef = useRef(null);
    const startTime = useRef(0);
    const wakeLock = useRef(null);
    const bufferResolveRef = useRef(null);
    const isPausedRef = useRef(false);
    const isCancelledRef = useRef(false);

    const requestWakeLock = async () => {
        if ('wakeLock' in navigator) {
            try { wakeLock.current = await navigator.wakeLock.request('screen'); } catch (err) { }
        }
    };

    const releaseWakeLock = () => {
        if (wakeLock.current) { wakeLock.current.release(); wakeLock.current = null; }
    };

    const handleConnectionState = useCallback((state) => {
        if (state === 'connected') setStatus('Connected');
        else if (state === 'disconnected' || state === 'failed') {
            setStatus('Connection lost');
            releaseWakeLock();
        }
    }, []);

    useEffect(() => {
        const heartbeat = setInterval(() => {
            if (rtcManager.current?.dataChannel?.readyState === 'open') {
                // Send heartbeat to keep connection alive
                rtcManager.current.sendData(JSON.stringify({ type: 'heartbeat' }));
            }
        }, 15000); // 15s keep-alive

        return () => clearInterval(heartbeat);
    }, []);

    const handleDataReceived = useCallback((data) => {
        if (typeof data === 'string') {
            try {
                const parsed = JSON.parse(data);
                if (parsed.type === 'metadata') {
                    backgroundShield.activate(); // Ensure active on receiver side
                    metadataRef.current = parsed;
                    receivedChunks.current = [];
                    receivedSize.current = 0;
                    startTime.current = Date.now();
                    setReceivedText(''); // Clear previous text to show file progress

                    // MEMORY SHIELD: Warn if file is > 1GB
                    if (parsed.size > 1024 * 1024 * 1024) {
                        setStatus(`Warning: ${parsed.name} is very large. Memory may be limited.`);
                    } else {
                        setStatus(`Receiving ${parsed.name}`);
                    }

                    setProgress(0);
                    requestWakeLock();
                } else if (parsed.type === 'control') {
                    if (parsed.action === 'pause') {
                        setStatus('Paused by sender');
                        setIsPaused(true);
                    } else if (parsed.action === 'resume') {
                        setStatus(`Receiving ${metadataRef.current?.name || ''}`);
                        setIsPaused(false);
                    }
                    else if (parsed.action === 'cancel') {
                        setStatus('Transfer cancelled by sender');
                        setProgress(0);
                        setIsPaused(false);
                        releaseWakeLock();
                        backgroundShield.deactivate();
                    }
                } else if (parsed.type === 'heartbeat') {
                    return; // Ignore heartbeats, they just keep the connection alive
                } else if (parsed.type === 'text') {
                    setReceivedText(parsed.content);
                    setStatus('Text received successfully!');
                    requestWakeLock();
                    if (onReceived) {
                        onReceived([{
                            type: 'text',
                            name: parsed.content.length > 20 ? parsed.content.substring(0, 20) + '...' : parsed.content,
                            direction: 'received',
                            timestamp: Date.now()
                        }]);
                    }
                }
            } catch (e) { }
        } else {
            const meta = metadataRef.current;
            if (!meta) return;
            receivedChunks.current.push(data);
            receivedSize.current += data.byteLength;
            const percent = (receivedSize.current / meta.size) * 100;
            setProgress(percent);

            if (Math.random() > 0.8) {
                const newStats = calculateTransferStats(receivedSize.current, meta.size, startTime.current);
                if (newStats) setStats(newStats);
            }

            if (receivedSize.current >= meta.size) {
                const blob = new Blob(receivedChunks.current);
                const url = URL.createObjectURL(blob);

                const triggerDownload = () => {
                    console.log('📦 Triggering download for:', meta.name);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = meta.name;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);

                    // Cleanup after a short delay to ensure browser handled the click
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                };

                if (document.visibilityState === 'visible') {
                    triggerDownload();
                } else {
                    console.log('⏸️ Tab hidden. Queuing download for foreground.');
                    pendingDownloadRef.current = triggerDownload;
                }

                setStatus('File received successfully!');
                setProgress(100);
                releaseWakeLock();
                if (onReceived) {
                    onReceived([{
                        type: 'file',
                        name: meta.name,
                        size: meta.size,
                        direction: 'received',
                        timestamp: Date.now()
                    }]);
                }
            }
        }
    }, []);

    const initWebRTC = useCallback((room, isInitiator, onConnectionStateChange) => {
        if (rtcManager.current) rtcManager.current.destroy();
        rtcManager.current = new WebRTCManager(
            socket, isInitiator,
            (data) => handleDataReceived(data),
            (state) => {
                handleConnectionState(state);
                if (onConnectionStateChange) onConnectionStateChange(state);
            },
            () => {
                if (bufferResolveRef.current) {
                    bufferResolveRef.current();
                    bufferResolveRef.current = null;
                }
            }
        );
        if (!isInitiator) rtcManager.current.initializePeer(null, false);
    }, [handleDataReceived, handleConnectionState]);

    const sendFiles = async (files) => {
        if (!files.length) throw new Error('No files selected');
        if (!rtcManager.current || !rtcManager.current.dataChannel || rtcManager.current.dataChannel.readyState !== 'open') {
            throw new Error('No receiver connected. Share the code first!');
        }

        setStatus('Sending...');
        requestWakeLock();
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            startTime.current = Date.now();
            rtcManager.current.sendData(JSON.stringify({ type: 'metadata', name: file.name, size: file.size }));
            const CHUNK_SIZE = 16384 * 16; // 256KB chunks for better speed
            let offset = 0;
            while (offset < file.size) {
                if (isPausedRef.current) {
                    setStatus('Paused');
                    const pauseStartTime = Date.now();
                    await new Promise(resolve => {
                        pauseResolveRef.current = resolve;
                    });

                    if (isCancelledRef.current) {
                        isCancelledRef.current = false;
                        throw new Error('Transfer cancelled');
                    }

                    setStatus('Sending...');
                    // Shift startTime forward by the pause duration to maintain accurate speed stats
                    startTime.current += (Date.now() - pauseStartTime);
                }

                if (rtcManager.current.getBufferedAmount() > 1024 * 1024) {
                    await new Promise(resolve => {
                        bufferResolveRef.current = resolve;
                    });
                    continue;
                }
                const chunk = await file.slice(offset, offset + CHUNK_SIZE).arrayBuffer();
                const success = rtcManager.current.sendData(chunk);
                if (!success) throw new Error('Transfer interrupted. Please try again.');

                offset += chunk.byteLength;
                setProgress((offset / file.size) * 100);

                if (Math.random() > 0.8) {
                    const newStats = calculateTransferStats(offset, file.size, startTime.current);
                    if (newStats) setStats(newStats);
                }
            }
        }
        setStatus('File sent successfully!');
        releaseWakeLock();
        backgroundShield.deactivate();
    };

    const sendText = (text) => {
        if (!text) throw new Error('Text is empty');
        if (!rtcManager.current || !rtcManager.current.dataChannel || rtcManager.current.dataChannel.readyState !== 'open') {
            throw new Error('No receiver connected. Share the code first!');
        }
        const success = rtcManager.current.sendData(JSON.stringify({ type: 'text', content: text }));
        if (!success) throw new Error('Failed to send text. Check connection.');
        setStatus('Text sent successfully!');
    };

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && pendingDownloadRef.current) {
                console.log('👋 Tab foreground. Flushing pending download.');
                pendingDownloadRef.current();
                pendingDownloadRef.current = null;
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    const togglePause = useCallback(() => {
        setIsPaused(prev => {
            const next = !prev;
            isPausedRef.current = next;

            // Notify the receiver
            if (rtcManager.current) {
                rtcManager.current.sendData(JSON.stringify({
                    type: 'control',
                    action: next ? 'pause' : 'resume'
                }));
            }

            if (!next && pauseResolveRef.current) {
                // Resume logic: Resolve the promise that the loop is waiting on
                pauseResolveRef.current();
                pauseResolveRef.current = null;
            }
            return next;
        });
    }, []);

    const cancelTransfer = useCallback(() => {
        isCancelledRef.current = true;
        setIsPaused(false);
        isPausedRef.current = false;

        if (pauseResolveRef.current) {
            pauseResolveRef.current();
            pauseResolveRef.current = null;
        }

        if (rtcManager.current) {
            rtcManager.current.sendData(JSON.stringify({ type: 'control', action: 'cancel' }));
        }

        setStatus('Transfer cancelled');
        setProgress(0);
        releaseWakeLock();
        backgroundShield.deactivate();
    }, []);

    const destroy = useCallback(() => {
        if (rtcManager.current) {
            rtcManager.current.destroy();
            rtcManager.current = null;
        }
        setStatus('');
        setProgress(0);
        setIsPaused(false);
        setStats({ speed: '0 B/s', eta: '0s' });
        setReceivedText('');
        releaseWakeLock();
        if (pauseResolveRef.current) {
            pauseResolveRef.current();
            pauseResolveRef.current = null;
        }
        backgroundShield.deactivate();
    }, []);

    return {
        status,
        setStatus,
        progress,
        setProgress,
        stats,
        setStats,
        receivedText,
        setReceivedText,
        initWebRTC,
        sendFiles,
        sendText,
        isPaused,
        togglePause,
        cancelTransfer,
        destroy
    };
};
