import { useState, useEffect, useRef } from 'react'
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
import './index.css'

function App() {
  const [mode, setMode] = useState('home'); // home, sender, receiver
  const [roomId, setRoomId] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const { history, addToHistory, clearHistory } = useHistory();
  const [showHistory, setShowHistory] = useState(false);
  const roomIdRef = useRef(roomId);

  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  const {
    status, setStatus, progress, stats, receivedText,
    initWebRTC, sendFiles, sendText, isPaused, togglePause, destroy: destroyWebRTC
  } = useWebRTC((items) => addToHistory(items, roomIdRef.current));

  const {
    files, setFiles, removeFile, renameFile, sharedText, setSharedText,
    transferType, setTransferType, copied, setCopied, resetTransfer
  } = useTransfer();

  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    connectSocket();
    socket.on('error', (msg) => {
      showToast(msg, 'error');
      setStatus('');
      if (msg.includes('Room not found') || msg.includes('full')) {
        setRoomId('');
        setMode('receiver'); // Ensure we stay on receiver screen but reset
      }
    });
    return () => {
      socket.off('error');
      disconnectSocket();
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room && room.length === 6 && mode !== 'receiver') {
      setRoomId(room);
      setMode('receiver');
      setTimeout(() => {
        socket.emit('join-room', { roomId: room, role: 'receiver' });
        setStatus('Joining via link...');
        initWebRTC(room, false);
      }, 500);
    }
  }, []);

  const handleModeSelect = (selectedMode) => {
    setMode(selectedMode);
    if (selectedMode === 'sender') {
      const newRoomId = Math.floor(100000 + Math.random() * 900000).toString();
      setRoomId(newRoomId);
      socket.emit('join-room', { roomId: newRoomId, role: 'sender' });
      setStatus('Waiting for receiver');
      initWebRTC(newRoomId, true);
    } else {
      setRoomId('');
      setStatus('');
    }
  };

  const goHome = () => {
    if (roomId) socket.emit('leave-room', roomId);
    setMode('home');
    setRoomId('');
    resetTransfer();
    destroyWebRTC();
  };

  const handleCopy = (text) => {
    copyToClipboard(text).then(() => {
      setCopied(true);
      showToast('Copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const startScanner = () => {
    setShowScanner(true);
  };

  const handleScan = (text) => {
    let room = text;
    try {
      const url = new URL(text);
      const roomParam = url.searchParams.get('room');
      if (roomParam) room = roomParam;
    } catch (e) {
      // Not a URL, use as is
    }

    setRoomId(room);
    setStatus('Connecting...');
    socket.emit('join-room', { roomId: room, role: 'receiver' });
    initWebRTC(room, false);
  };

  const handleSendFiles = () => {
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
  };

  const handleSendText = () => {
    try {
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
  };

  return (
    <>
      <Navbar onLogoClick={goHome} onHistoryClick={() => setShowHistory(true)} />

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
                progress={progress}
              />
            ) : (
              <Receiver
                goHome={goHome}
                receivedText={receivedText}
                status={status}
                roomId={roomId}
                setRoomId={setRoomId}
                startScanner={startScanner}
                joinRoom={() => { setStatus('Connecting...'); socket.emit('join-room', { roomId, role: 'receiver' }); initWebRTC(roomId, false); }}
                handleCopy={handleCopy}
                history={history.filter(item => item.roomId === roomId)}
              />
            )}

            {(progress > 0 || status) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)', marginTop: 'var(--s-4)' }}>
                <div className={`status-bar ${status.toLowerCase().includes('successfully') || status.toLowerCase().includes('connected') || status.toLowerCase().includes('ready') ? 'success' :
                  status.toLowerCase().includes('lost') || status.toLowerCase().includes('failed') || status.toLowerCase().includes('error') ? 'error' :
                    isPaused ? 'paused' : ''
                  }`}>
                  <span>{status}</span>
                  {progress > 0 && progress < 100 && (
                    <span>
                      {Math.round(progress)}% • {stats.speed} {stats.eta && stats.eta !== '0s' && `• ${stats.eta} left`}
                    </span>
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

        {showScanner && (
          <Scanner
            onScan={handleScan}
            onClose={() => setShowScanner(false)}
          />
        )}

        {toast && (
          <div className="toast-container">
            <Toast {...toast} onClose={hideToast} />
          </div>
        )}

        <HistoryModal
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          history={history}
          onClear={clearHistory}
        />
      </main>

      <Footer />
    </>
  )
}

export default App
