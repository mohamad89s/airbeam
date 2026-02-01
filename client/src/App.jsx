import { useState, useEffect, useRef, useCallback } from 'react'
import { socket, connectSocket, disconnectSocket } from './services/socket'
import { QRCodeCanvas } from 'qrcode.react'
import { copyToClipboard } from './utils/helpers'
import { useWebRTC } from './hooks/useWebRTC'
import { useTransfer } from './hooks/useTransfer'
import { useToast } from './hooks/useToast'
import { useHistory } from './hooks/useHistory'
import Navbar from './components/common/Navbar'
import Footer from './components/common/Footer'
import Toast from './components/common/Toast'
import Home from './components/Home'
import Sender from './components/Sender'
import Receiver from './components/Receiver'
import Scanner from './components/Scanner'
import HistoryModal from './components/HistoryModal'
import { backgroundShield } from './services/backgroundShield'
import './index.css'

function App() {
  const [mode, setMode] = useState(() => sessionStorage.getItem('airbeam_mode') || 'home');
  const [roomId, setRoomId] = useState(() => sessionStorage.getItem('airbeam_roomId') || '');
  const [showScanner, setShowScanner] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [p2pConnectionState, setP2pConnectionState] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('airbeam_theme') || 'light');

  const { history, addToHistory, clearHistory } = useHistory();
  const [showHistory, setShowHistory] = useState(false);
  const roomIdRef = useRef(roomId);
  const joinRetryCount = useRef(0);

  useEffect(() => {
    roomIdRef.current = roomId;
    if (roomId) sessionStorage.setItem('airbeam_roomId', roomId);
    else sessionStorage.removeItem('airbeam_roomId');
  }, [roomId]);

  useEffect(() => {
    if (mode) sessionStorage.setItem('airbeam_mode', mode);
  }, [mode]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('airbeam_theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const handleReceived = useCallback((items) => {
    addToHistory(items, roomIdRef.current);
  }, [addToHistory]);

  const {
    status, setStatus, progress, setProgress, stats, setStats, receivedText, setReceivedText,
    initWebRTC, sendFiles, sendText, isPaused, togglePause, cancelTransfer, destroy: destroyWebRTC
  } = useWebRTC(handleReceived);
  const {
    files, setFiles, removeFile, renameFile, sharedText, setSharedText,
    transferType, setTransferType, copied, setCopied, resetTransfer
  } = useTransfer();

  const { toast, showToast, hideToast } = useToast();

  const handleModeSelect = useCallback((selectedMode) => {
    setMode(selectedMode);
    if (selectedMode === 'sender') {
      const newRoomId = Math.floor(100000 + Math.random() * 900000).toString();
      setRoomId(newRoomId);
      socket.emit('join-room', { roomId: newRoomId, role: 'sender' });
      setStatus('Waiting for receiver');
      initWebRTC(newRoomId, true, setP2pConnectionState);
    } else {
      setRoomId('');
      setStatus('');
      setP2pConnectionState('');
    }
  }, [initWebRTC, setStatus, setRoomId]);

  const goHome = useCallback(() => {
    if (roomIdRef.current) socket.emit('leave-room', roomIdRef.current);
    setMode('home');
    setRoomId('');
    setP2pConnectionState('');
    sessionStorage.removeItem('airbeam_mode');
    sessionStorage.removeItem('airbeam_roomId');
    resetTransfer();
    destroyWebRTC();
  }, [resetTransfer, destroyWebRTC]);

  const handleCopy = useCallback((text) => {
    copyToClipboard(text).then(() => {
      setCopied(true);
      showToast('Copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    });
  }, [setCopied, showToast]);

  const handleScan = useCallback((text) => {
    let room = text;
    try {
      const url = new URL(text);
      const roomParam = url.searchParams.get('room');
      if (roomParam) room = roomParam;
    } catch (e) { }
    setRoomId(room);
    setMode('receiver');
    setStatus('Connecting...');
    socket.emit('join-room', { roomId: room, role: 'receiver' });
    initWebRTC(room, false, setP2pConnectionState);
    setShowScanner(false);
  }, [initWebRTC, setStatus]);

  const handleSendFiles = useCallback(() => {
    backgroundShield.activate();
    sendFiles(files).then(() => {
      showToast('Files beamed successfully!', 'success');
      addToHistory(files.map(f => ({
        type: 'file',
        name: f.name,
        size: f.size,
        direction: 'sent',
        timestamp: Date.now()
      })), roomIdRef.current);
    }).catch(err => {
      showToast(err.message || 'Failed to beam files.', 'error');
    });
  }, [files, sendFiles, showToast, addToHistory]);

  const handleSendText = useCallback(() => {
    try {
      backgroundShield.activate();
      sendText(sharedText);
      showToast('Text beamed!', 'success');
      addToHistory([{
        type: 'text',
        name: sharedText.length > 20 ? sharedText.substring(0, 20) + '...' : sharedText,
        direction: 'sent',
        timestamp: Date.now()
      }], roomIdRef.current);
      setSharedText('');
    } catch (err) {
      showToast(err.message || 'Failed to beam text.', 'error');
    }
  }, [sharedText, sendText, showToast, addToHistory, setSharedText]);

  useEffect(() => {
    connectSocket();

    const onConnect = () => {
      console.log('Socket connected');
      setIsSocketConnected(true);
      joinRetryCount.current = 0;
    };
    const onDisconnect = () => setIsSocketConnected(false);
    const onError = (msg) => {
      if ((msg.includes('full') || msg.includes('not found')) && joinRetryCount.current < 2) {
        joinRetryCount.current++;
        setStatus(msg.includes('full') ? 'Room busy, retrying...' : 'Finding room...');
        setTimeout(() => {
          if (roomIdRef.current && mode !== 'home') {
            const role = mode === 'sender' ? 'sender' : 'receiver';
            socket.emit('join-room', { roomId: roomIdRef.current, role });
          }
        }, 1500);
        return;
      }
      showToast(msg, 'error');
      setStatus('');
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('error', onError);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !socket.connected) {
        connectSocket();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('error', onError);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [showToast, setStatus, mode, initWebRTC, setP2pConnectionState]);

  useEffect(() => {
    if (isSocketConnected && mode !== 'home' && roomId) {
      console.log('Re-syncing room state');
      socket.emit('join-room', { roomId, role: mode === 'sender' ? 'sender' : 'receiver' });
      initWebRTC(roomId, mode === 'sender', setP2pConnectionState);
    }
  }, [isSocketConnected]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room && room.length === 6 && mode !== 'receiver') {
      setRoomId(room);
      setMode('receiver');
      setTimeout(() => {
        socket.emit('join-room', { roomId: room, role: 'receiver' });
        setStatus('Joining...');
        initWebRTC(room, false, setP2pConnectionState);
      }, 500);
    }
  }, []);

  return (
    <>
      <Navbar
        onLogoClick={goHome}
        onHistoryClick={() => setShowHistory(true)}
        theme={theme}
        toggleTheme={toggleTheme}
      />
      <main className="container">
        {mode === 'home' ? (
          <Home onModeSelect={handleModeSelect} />
        ) : (
          <>
            {mode === 'sender' ? (
              <Sender
                goHome={goHome}
                transferType={transferType}
                setTransferType={setTransferType}
                roomId={roomId}
                handleCopy={handleCopy}
                copied={copied}
                files={files}
                setFiles={setFiles}
                removeFile={removeFile}
                renameFile={renameFile}
                sharedText={sharedText}
                setSharedText={setSharedText}
                sendFiles={handleSendFiles}
                sendText={handleSendText}
                status={status}
                setStatus={setStatus}
                resetTransfer={resetTransfer}
                isPaused={isPaused}
                togglePause={togglePause}
                cancelTransfer={cancelTransfer}
                progress={progress}
                p2pConnectionState={p2pConnectionState}
              />
            ) : (
              <Receiver
                goHome={goHome}
                receivedText={receivedText}
                status={status}
                roomId={roomId}
                setRoomId={setRoomId}
                startScanner={() => setShowScanner(true)}
                joinRoom={() => {
                  backgroundShield.activate();
                  setStatus('Connecting...');
                  socket.emit('join-room', { roomId, role: 'receiver' });
                  initWebRTC(roomId, false, setP2pConnectionState);
                }}
                handleCopy={handleCopy}
                history={history.filter(item => item.roomId === roomId)}
                p2pConnectionState={p2pConnectionState}
              />
            )}

            {(progress > 0 || status) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)', marginTop: 'var(--s-4)' }}>
                <div className={`status-bar ${status.toLowerCase().includes('successfully') || status.toLowerCase().includes('connected') ? 'success' :
                  status.toLowerCase().includes('lost') || status.toLowerCase().includes('failed') || status.toLowerCase().includes('error') ? 'error' :
                    isPaused ? 'paused' : ''
                  }`}>
                  <span>{p2pConnectionState === 'connected' ? (status === 'Waiting for receiver' ? 'Ready to beam' : status) : status}</span>
                  {progress > 0 && progress < 100 && (
                    <span>{Math.round(progress)}% • {stats.speed} {stats.eta && stats.eta !== '0s' && `• ${stats.eta} left`}</span>
                  )}
                </div>
                {progress > 0 && (
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
        {showScanner && <Scanner onScan={handleScan} onClose={() => setShowScanner(false)} />}
        {toast && <div className="toast-container"><Toast {...toast} onClose={hideToast} /></div>}
        <HistoryModal isOpen={showHistory} onClose={() => setShowHistory(false)} history={history} onClear={clearHistory} />
      </main>
      <Footer />
    </>
  );
}

export default App
