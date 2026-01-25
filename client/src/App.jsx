import { useState, useEffect } from 'react'
import { socket, connectSocket, disconnectSocket } from './services/socket'
import { QRCodeCanvas } from 'qrcode.react'
import { copyToClipboard } from './utils/helpers'
import { useWebRTC } from './hooks/useWebRTC'
import { useTransfer } from './hooks/useTransfer'
import { useToast } from './hooks/useToast'
import Navbar from './components/common/Navbar'
import Footer from './components/common/Footer'
import Toast from './components/common/Toast'
import Home from './components/Home'
import Sender from './components/Sender'
import Receiver from './components/Receiver'
import Scanner from './components/Scanner'
import './index.css'

function App() {
  const [mode, setMode] = useState('home'); // home, sender, receiver
  const [roomId, setRoomId] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const {
    status, setStatus, progress, stats, receivedText,
    initWebRTC, sendFiles, sendText, destroy: destroyWebRTC
  } = useWebRTC();

  const {
    files, setFiles, sharedText, setSharedText,
    transferType, setTransferType, copied, setCopied, resetTransfer
  } = useTransfer();

  const { toast, showToast, hideToast } = useToast();

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
  }, []);

  const handleModeSelect = (selectedMode) => {
    setMode(selectedMode);
    if (selectedMode === 'sender') {
      const newRoomId = Math.floor(100000 + Math.random() * 900000).toString();
      setRoomId(newRoomId);
      socket.emit('join-room', newRoomId);
      setStatus('Ready to beam');
      initWebRTC(newRoomId, true);
    } else {
      setRoomId('');
      setStatus('');
    }
  };

  const goHome = () => {
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
    setRoomId(text);
    socket.emit('join-room', text);
    initWebRTC(text, false);
  };

  const handleSendFiles = () => {
    showToast('Starting file beam...', 'info');
    sendFiles(files).then(() => {
      showToast('Files beamed successfully!', 'success');
    }).catch(err => {
      showToast('Failed to beam files.', 'error');
    });
  };

  const handleSendText = () => {
    showToast('Text beamed!', 'success');
    sendText(sharedText);
    setSharedText('');
  };

  return (
    <>
      <Navbar onLogoClick={goHome} />

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
                sharedText={sharedText}
                setSharedText={setSharedText}
                sendFiles={handleSendFiles}
                sendText={handleSendText}
              />
            ) : (
              <Receiver
                goHome={goHome}
                receivedText={receivedText}
                status={status}
                roomId={roomId}
                setRoomId={setRoomId}
                startScanner={startScanner}
                joinRoom={() => { socket.emit('join-room', roomId); initWebRTC(roomId, false); }}
                handleCopy={handleCopy}
              />
            )}

            {(progress > 0 || status) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)', marginTop: 'var(--s-4)' }}>
                <div className="status-bar">
                  <span>{status}</span>
                  {progress > 0 && progress < 100 && <span>{Math.round(progress)}% • {stats.speed}</span>}
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
      </main>

      <Footer />
    </>
  )
}

export default App
