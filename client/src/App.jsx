import { useState, useEffect, useRef } from 'react'
import { socket, connectSocket, disconnectSocket } from './services/socket'
import { WebRTCManager } from './services/webrtc'
import { QRCodeCanvas } from 'qrcode.react'
import {
  Send,
  Download,
  Wifi,
  FileText,
  ShieldCheck,
  Zap,
  Clock,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  ClipboardPaste
} from 'lucide-react'
import './index.css'

function App() {
  const [mode, setMode] = useState('home') // home, sender, receiver
  const [roomId, setRoomId] = useState('')
  const [status, setStatus] = useState('')
  const [progress, setProgress] = useState(0)
  const [file, setFile] = useState(null)
  const [copied, setCopied] = useState(false)

  // Refs
  const rtcManager = useRef(null)

  useEffect(() => {
    connectSocket();
    return () => disconnectSocket();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room && room.length === 6 && mode !== 'receiver') {
      setRoomId(room);
      setMode('receiver');
      setTimeout(() => {
        socket.emit('join-room', room);
        setStatus('Joining via link...');
        initWebRTC(room, false);
      }, 500);
    }
  }, []); // Only run on mount to handle shared link

  const handleModeSelect = (selectedMode) => {
    setMode(selectedMode);
    if (selectedMode === 'sender') {
      const newRoomId = Math.floor(100000 + Math.random() * 900000).toString();
      setRoomId(newRoomId);
      socket.emit('join-room', newRoomId);
      setStatus('Waiting for receiver...');
      initWebRTC(newRoomId, true);
    } else if (selectedMode === 'receiver') {
      setRoomId(''); // Clear any previous sender room ID
      setStatus('');
    }
  };

  const goHome = () => {
    setMode('home');
    setRoomId('');
    setFile(null);
    setProgress(0);
    setStatus('');
    setStats({ speed: '0 B/s', eta: '0s' });
    if (rtcManager.current) {
      rtcManager.current.destroy();
      rtcManager.current = null;
    }
  };

  const wakeLock = useRef(null);
  const backgroundTimer = useRef(null);


  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLock.current = await navigator.wakeLock.request('screen');
        console.log('Wake Lock is active');
      } catch (err) {
        console.error(`${err.name}, ${err.message}`);
      }
    }
  };

  const releaseWakeLock = () => {
    if (wakeLock.current) {
      wakeLock.current.release();
      wakeLock.current = null;
      console.log('Wake Lock released');
    }
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('App returned to foreground');
        if (backgroundTimer.current) {
          clearTimeout(backgroundTimer.current);
          backgroundTimer.current = null;
        }

        if (roomId && roomId.length === 6) {
          socket.emit('join-room', roomId);
        }

        if (status.includes('Receiving') || status.includes('Sending')) {
          requestWakeLock();
        }
      } else {
        if (!status.includes('Receiving') && !status.includes('Sending')) {
          backgroundTimer.current = setTimeout(() => {
            console.log('Cleaning up after 30 mins of inactivity');
            releaseWakeLock();
          }, 30 * 60 * 1000);
        }
      }
    };

    const handleReconnect = () => {
      console.log('Socket reconnected, syncing room...');
      if (roomId && roomId.length === 6) {
        socket.emit('join-room', roomId);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    socket.on('connect', handleReconnect);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      socket.off('connect', handleReconnect);
      releaseWakeLock();
    };
  }, [roomId, status]);

  const handleJoinRoom = () => {
    if (roomId.length !== 6) return alert('Invalid Room ID');
    console.log('Manually joining room:', roomId);
    socket.emit('join-room', roomId);
    setStatus('Joining room...');
    initWebRTC(roomId, false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const cleanText = text.trim().toUpperCase().substring(0, 6).replace(/[^0-9]/g, '');
      if (cleanText) setRoomId(cleanText);
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  };

  const copyLink = () => {
    const link = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    copyToClipboard(link);
  };

  const initWebRTC = (room, isInitiator) => {
    if (rtcManager.current) {
      rtcManager.current.destroy();
    }

    rtcManager.current = new WebRTCManager(
      socket,
      isInitiator,
      (data) => handleDataReceived(data),
      (connectionState) => handleConnectionState(connectionState)
    );

    if (isInitiator) {
      // Wait for user-joined to initialize peer with target ID
    } else {
      rtcManager.current.initializePeer(null, false);
    }
  };

  const handleConnectionState = (state) => {
    setStatus(`Status: ${state}`);
    if (state === 'connected') {
      setStatus('Connected!');
    } else if (state === 'local-connected') {
      setStatus('Connected (Local Network)');
    } else if (state === 'disconnected' || state === 'failed') {
      releaseWakeLock();
    }
  };

  // Receiver State
  const receivedChunks = useRef([]);
  const [metadata, _setMetadata] = useState(null);
  const metadataRef = useRef(null);
  const receivedSize = useRef(0);

  const setMetadata = (data) => {
    _setMetadata(data);
    metadataRef.current = data;
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const startTime = useRef(0);
  const [stats, setStats] = useState({ speed: '0 B/s', eta: '0s' });

  const calculateStats = (loaded, total, start) => {
    const now = Date.now();
    const duration = (now - start) / 1000;
    if (duration === 0) return;

    const speedBytes = loaded / duration;
    const remainingBytes = total - loaded;
    const etaSeconds = speedBytes > 0 ? remainingBytes / speedBytes : 0;

    setStats({
      speed: formatBytes(speedBytes) + '/s',
      eta: Math.ceil(etaSeconds) + 's'
    });
  };

  const handleDataReceived = (data) => {
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === 'metadata') {
          setMetadata(parsed);
          receivedChunks.current = [];
          receivedSize.current = 0;
          startTime.current = Date.now();
          setStatus(`Receiving ${parsed.name}...`);
          setProgress(0);
          requestWakeLock();
        }
      } catch (e) {
        console.error("Error parsing metadata", e);
      }
    } else {
      const currentMeta = metadataRef.current;
      if (!currentMeta && receivedSize.current === 0) return;

      receivedChunks.current.push(data);
      receivedSize.current += data.byteLength;

      if (currentMeta) {
        if (Math.random() > 0.8) {
          calculateStats(receivedSize.current, currentMeta.size, startTime.current);
        }

        const percent = (receivedSize.current / currentMeta.size) * 100;
        setProgress(percent);
        setStatus(`Receiving: ${formatBytes(receivedSize.current)} / ${formatBytes(currentMeta.size)}`);

        if (receivedSize.current >= currentMeta.size) {
          saveFile(currentMeta);
        }
      }
    }
  };

  const saveFile = (meta) => {
    setStatus('Ready to download...');
    const blob = new Blob(receivedChunks.current);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = meta.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setStatus(`Success! Downloaded ${meta.name}`);
    receivedChunks.current = [];
    receivedSize.current = 0;
    setMetadata(null);
    setStats({ speed: 'Finished', eta: '0s' });
    releaseWakeLock();
  };

  const resetSelection = () => {
    setFile(null);
    setProgress(0);
    setStatus('Connected!');
    setStats({ speed: '0 B/s', eta: '0s' });
    const input = document.getElementById('file-input');
    if (input) input.value = '';
  };

  const sendFile = async () => {
    if (!file || !rtcManager.current) return;

    setStatus('Sending...');
    requestWakeLock();
    startTime.current = Date.now();
    const metadata = {
      type: 'metadata',
      name: file.name,
      size: file.size
    };
    rtcManager.current.sendData(JSON.stringify(metadata));

    const CHUNK_SIZE = 16384 * 4;
    let offset = 0;

    const readFileSlice = (file, offset, size) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        const slice = file.slice(offset, offset + size);
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(slice);
      });
    };

    while (offset < file.size) {
      if (rtcManager.current.getBufferedAmount() > 1024 * 1024) {
        await new Promise(r => setTimeout(r, 50));
        continue;
      }

      const chunk = await readFileSlice(file, offset, CHUNK_SIZE);
      const success = rtcManager.current.sendData(chunk);

      if (!success) {
        setStatus('Error: Connection lost');
        break;
      }

      offset += chunk.byteLength;
      if (Math.random() > 0.8) {
        calculateStats(offset, file.size, startTime.current);
      }
      setProgress((offset / file.size) * 100);
      setStatus(`Sending: ${formatBytes(offset)} / ${formatBytes(file.size)}`);
    }

    if (offset >= file.size) {
      setStatus('Transfer Complete!');
      setStats({ speed: 'Finished', eta: '0s' });
      releaseWakeLock();
    }
  };

  return (
    <>
      <header>
        <div className="logo" onClick={goHome} style={{ cursor: 'pointer' }}>
          <Zap size={24} fill="currentColor" />
          <span>AirBeam</span>
        </div>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          Direct P2P
        </div>
      </header>

      <main className="container">
        {mode === 'home' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>Share files instantly.</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Direct P2P sharing. No limits.</p>
            </div>
            <div className="mode-selection">
              <div className="mode-btn" onClick={() => handleModeSelect('sender')}>
                <Send size={32} strokeWidth={2.5} />
                <span>Send</span>
              </div>
              <div className="mode-btn" onClick={() => handleModeSelect('receiver')}>
                <Download size={32} strokeWidth={2.5} />
                <span>Receive</span>
              </div>
            </div>
          </div>
        )}

        {mode === 'sender' && (
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <button onClick={goHome} className="input-icon-btn" style={{ position: 'static' }}>
                <ArrowLeft size={20} />
              </button>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Send Files</h2>
            </div>

            <div className="share-info">
              <div className="input-group" style={{ maxWidth: '240px', margin: '0 auto 0.75rem' }}>
                <input
                  readOnly
                  className="room-code"
                  value={roomId}
                  onClick={() => copyToClipboard(roomId)}
                  style={{ cursor: 'pointer', fontSize: '1.25rem' }}
                />
                <button
                  className="input-icon-btn"
                  onClick={() => copyToClipboard(roomId)}
                >
                  {copied ? <Check size={18} className="success-text" /> : <Copy size={18} />}
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '0.75rem' }}>
                <button
                  className="secondary-btn"
                  onClick={copyLink}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  {copied ? 'Copied' : 'Copy Link'}
                </button>
              </div>

              <div className="qr-container">
                <QRCodeCanvas value={`${window.location.origin}${window.location.pathname}?room=${roomId}`} size={120} />
              </div>
            </div>

            <div className="drop-zone" onClick={() => document.getElementById('file-input').click()} style={{ padding: '1rem' }}>
              <input
                id="file-input"
                type="file"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files[0]) {
                    setFile(e.target.files[0]);
                    setStatus('');
                    setProgress(0);
                    setStats({ speed: '0 B/s', eta: '0s' });
                  }
                }}
              />
              <FileText size={24} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
              {file ? (
                <p style={{ fontWeight: 600, fontSize: '0.85rem', margin: 0 }}>{file.name}</p>
              ) : (
                <p style={{ fontSize: '0.85rem', margin: 0 }}>Select file</p>
              )}
            </div>

            {file && !status.includes('Complete') && (
              <button className="primary-btn" onClick={sendFile} style={{ padding: '0.75rem' }}>
                <Zap size={18} /> Beam
              </button>
            )}

            {status.includes('Complete') && (
              <button className="primary-btn" onClick={resetSelection} style={{ background: 'var(--success)', padding: '0.75rem' }}>
                <RefreshCw size={18} /> Another
              </button>
            )}

            <div className="status" style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>{status}</div>

            {progress > 0 && progress < 100 && (
              <div className="progress-bar-container" style={{ marginTop: '0.5rem' }}>
                <div className="progress-bar" style={{ width: `${progress}%` }}></div>
              </div>
            )}
          </div>
        )}

        {mode === 'receiver' && (
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <button onClick={goHome} className="input-icon-btn" style={{ position: 'static' }}>
                <ArrowLeft size={20} />
              </button>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Receive Files</h2>
            </div>

            {!status.includes('Connected') && !status.includes('Receiving') && !status.includes('Success') ? (
              <>
                <div className="input-group" style={{ maxWidth: '240px', margin: '0 auto 1rem' }}>
                  <input
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    placeholder="CODE"
                    maxLength={6}
                    style={{ fontSize: '1.25rem' }}
                  />
                  <button
                    className="input-icon-btn"
                    onClick={pasteFromClipboard}
                  >
                    <ClipboardPaste size={18} />
                  </button>
                </div>
                <button className="primary-btn" onClick={handleJoinRoom} style={{ padding: '0.75rem' }}>
                  Join <ArrowRight size={18} />
                </button>
              </>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <ShieldCheck size={48} color="var(--success)" style={{ marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Waiting for files...</p>
              </div>
            )}

            <div className="status" style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>{status}</div>

            {progress > 0 && progress < 100 && (
              <div className="progress-bar-container" style={{ marginTop: '0.5rem' }}>
                <div className="progress-bar" style={{ width: `${progress}%` }}></div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', fontSize: '0.75rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><ShieldCheck size={14} /> P2P</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Wifi size={14} /> Local</span>
        </div>
      </footer>
    </>
  )
}

export default App
