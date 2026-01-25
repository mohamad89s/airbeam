import { useState, useRef, useEffect, useCallback } from 'react';
import { socket } from '../services/socket';
import { WebRTCManager } from '../services/webrtc';
import { calculateTransferStats } from '../utils/helpers';

export const useWebRTC = () => {
    const [status, setStatus] = useState('');
    const [progress, setProgress] = useState(0);
    const [stats, setStats] = useState({ speed: '0 B/s', eta: '0s' });
    const [receivedText, setReceivedText] = useState('');

    const rtcManager = useRef(null);
    const metadataRef = useRef(null);
    const receivedChunks = useRef([]);
    const receivedSize = useRef(0);
    const startTime = useRef(0);
    const wakeLock = useRef(null);

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

    const handleDataReceived = useCallback((data) => {
        if (typeof data === 'string') {
            try {
                const parsed = JSON.parse(data);
                if (parsed.type === 'metadata') {
                    metadataRef.current = parsed;
                    receivedChunks.current = [];
                    receivedSize.current = 0;
                    startTime.current = Date.now();
                    setStatus(`Receiving ${parsed.name}`);
                    setProgress(0);
                    requestWakeLock();
                } else if (parsed.type === 'text') {
                    setReceivedText(parsed.content);
                    setStatus('Message received');
                    requestWakeLock();
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
                const a = document.createElement('a');
                a.href = url;
                a.download = meta.name;
                a.click();
                URL.revokeObjectURL(url);
                setStatus('Download complete');
                setProgress(100);
                releaseWakeLock();
            }
        }
    }, []);

    const initWebRTC = useCallback((room, isInitiator) => {
        if (rtcManager.current) rtcManager.current.destroy();
        rtcManager.current = new WebRTCManager(
            socket, isInitiator,
            (data) => handleDataReceived(data),
            (state) => handleConnectionState(state)
        );
        if (!isInitiator) rtcManager.current.initializePeer(null, false);
    }, [handleDataReceived, handleConnectionState]);

    const sendFiles = async (files) => {
        if (!files.length || !rtcManager.current) return;
        setStatus('Sending...');
        requestWakeLock();
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            startTime.current = Date.now();
            rtcManager.current.sendData(JSON.stringify({ type: 'metadata', name: file.name, size: file.size }));
            const CHUNK_SIZE = 16384 * 4;
            let offset = 0;
            while (offset < file.size) {
                if (rtcManager.current.getBufferedAmount() > 1024 * 1024) {
                    await new Promise(r => setTimeout(r, 50));
                    continue;
                }
                const chunk = await file.slice(offset, offset + CHUNK_SIZE).arrayBuffer();
                rtcManager.current.sendData(chunk);
                offset += chunk.byteLength;
                setProgress((offset / file.size) * 100);

                if (Math.random() > 0.8) {
                    const newStats = calculateTransferStats(offset, file.size, startTime.current);
                    if (newStats) setStats(newStats);
                }
            }
        }
        setStatus('Beam successful');
        releaseWakeLock();
    };

    const sendText = (text) => {
        if (!text || !rtcManager.current) return;
        rtcManager.current.sendData(JSON.stringify({ type: 'text', content: text }));
        setStatus('Text shared');
    };

    const destroy = useCallback(() => {
        if (rtcManager.current) {
            rtcManager.current.destroy();
            rtcManager.current = null;
        }
        setStatus('');
        setProgress(0);
        setStats({ speed: '0 B/s', eta: '0s' });
        setReceivedText('');
        releaseWakeLock();
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
        destroy
    };
};
