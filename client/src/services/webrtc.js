export class WebRTCManager {
    constructor(socket, isInitiator, onData, onStatusChange) {
        this.socket = socket;
        this.onData = onData;
        this.onStatusChange = onStatusChange; // 'connecting', 'connected', 'disconnected'
        this.peerConnection = null;
        this.dataChannel = null;
        this.remotePeerId = null;
        this.isInitiator = isInitiator;
        this.iceCandidateQueue = [];

        this.config = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
            ]
        };

        // Bind handlers for easy removal
        this.boundHandleOffer = (payload) => this.handleOffer(payload.sdp, payload.caller);
        this.boundHandleAnswer = (payload) => this.handleAnswer(payload.sdp);
        this.boundHandleCandidate = (payload) => this.handleCandidate(payload.candidate);
        this.boundUserJoined = (userId) => this.handleUserJoined(userId);

        this.setupSocketListeners();
    }

    setupSocketListeners() {
        this.socket.on('offer', this.boundHandleOffer);
        this.socket.on('answer', this.boundHandleAnswer);
        this.socket.on('ice-candidate', this.boundHandleCandidate);
        this.socket.on('user-joined', this.boundUserJoined);
    }

    removeSocketListeners() {
        this.socket.off('offer', this.boundHandleOffer);
        this.socket.off('answer', this.boundHandleAnswer);
        this.socket.off('ice-candidate', this.boundHandleCandidate);
        this.socket.off('user-joined', this.boundUserJoined);
    }

    initializePeer(remotePeerId, isInitiator) {
        console.log(`Initializing peer. Initiator: ${isInitiator}, Remote: ${remotePeerId}`);
        this.remotePeerId = remotePeerId;
        this.isInitiator = isInitiator;

        if (this.peerConnection) {
            console.log('Closing existing peer connection');
            this.peerConnection.close();
        }

        this.peerConnection = new RTCPeerConnection(this.config);

        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate && this.remotePeerId) {
                this.socket.emit('ice-candidate', {
                    target: this.remotePeerId,
                    candidate: event.candidate
                });
            }
        };

        this.peerConnection.onconnectionstatechange = () => {
            const state = this.peerConnection.connectionState;
            console.log('WebRTC Connection state:', state);
            this.onStatusChange(state);
            if (state === 'connected') {
                this.checkLocalConnection();
            }
        };

        this.peerConnection.onsignalingstatechange = () => {
            console.log('WebRTC Signaling state:', this.peerConnection.signalingState);
        };

        if (this.isInitiator) {
            this.dataChannel = this.peerConnection.createDataChannel("file-transfer", {
                ordered: true
            });
            this.setupDataChannel();
            this.createOffer();
        } else {
            this.peerConnection.ondatachannel = (event) => {
                this.dataChannel = event.channel;
                this.setupDataChannel();
            };
        }
    }

    handleUserJoined(userId) {
        console.log('User joined event received for:', userId);
        if (this.isInitiator && !this.remotePeerId) {
            this.initializePeer(userId, true);
        }
    }

    setupDataChannel() {
        if (!this.dataChannel) return;

        this.dataChannel.binaryType = 'arraybuffer';

        this.dataChannel.onopen = () => {
            console.log('Data channel is open');
            this.onStatusChange('connected');
        };

        this.dataChannel.onclose = () => {
            console.log('Data channel is closed');
            this.onStatusChange('disconnected');
        };

        this.dataChannel.onmessage = (event) => {
            this.onData(event.data);
        };
    }

    async createOffer() {
        if (this.peerConnection.signalingState !== 'stable') return;
        try {
            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);
            this.socket.emit('offer', {
                target: this.remotePeerId,
                sdp: offer
            });
        } catch (err) {
            console.error('Failed to create offer:', err);
        }
    }

    async handleOffer(offer, callerId) {
        if (!this.peerConnection) {
            this.initializePeer(callerId, false);
        }

        // Politeness/collision handling could go here, but for now we reset if in wrong state
        if (this.peerConnection.signalingState !== 'stable') {
            console.warn('Received offer while not in stable state. Signaling state:', this.peerConnection.signalingState);
            // If we are already connecting or have an offer, we might have a collision.
            // Simple approach: non-initiator accepts the new offer.
            if (this.isInitiator) return; // Wait for polite peer logic if needed
        }

        try {
            if (callerId) this.remotePeerId = callerId;
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);

            this.socket.emit('answer', {
                target: this.remotePeerId,
                sdp: answer
            });

            // Process queued candidates
            while (this.iceCandidateQueue.length > 0) {
                const candidate = this.iceCandidateQueue.shift();
                await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            }
        } catch (err) {
            console.error('Failed to handle offer:', err);
        }
    }

    async handleAnswer(answer) {
        if (this.peerConnection.signalingState !== 'have-local-offer') {
            console.warn('Received answer while not in have-local-offer state. State:', this.peerConnection.signalingState);
            return;
        }
        try {
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));

            // Process queued candidates
            while (this.iceCandidateQueue.length > 0) {
                const candidate = this.iceCandidateQueue.shift();
                await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            }
        } catch (err) {
            console.error('Failed to handle answer:', err);
        }
    }

    async handleCandidate(candidate) {
        try {
            if (this.peerConnection && this.peerConnection.remoteDescription && this.peerConnection.remoteDescription.type) {
                await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            } else {
                console.log('Queuing ICE candidate (remote description not set yet)');
                this.iceCandidateQueue.push(candidate);
            }
        } catch (e) {
            console.error('Error adding received ice candidate', e);
        }
    }

    sendData(data) {
        if (this.dataChannel && this.dataChannel.readyState === 'open') {
            try {
                this.dataChannel.send(data);
                return true;
            } catch (e) {
                console.error("Error sending data:", e);
                return false;
            }
        }
        return false;
    }

    getBufferedAmount() {
        return this.dataChannel ? this.dataChannel.bufferedAmount : 0;
    }

    destroy() {
        console.log('Destroying WebRTCManager');
        this.removeSocketListeners();
        if (this.dataChannel) {
            this.dataChannel.close();
        }
        if (this.peerConnection) {
            this.peerConnection.close();
        }
        this.iceCandidateQueue = [];
    }

    async checkLocalConnection() {
        try {
            const stats = await this.peerConnection.getStats();
            let isLocal = false;
            stats.forEach(report => {
                if (report.type === 'remote-candidate') {
                    if (report.candidateType === 'host' ||
                        (report.address && (report.address.startsWith('192.168.') || report.address.startsWith('10.')))) {
                        isLocal = true;
                    }
                }
            });
            if (isLocal) {
                console.log('Connection established via LOCAL network');
                this.onStatusChange('local-connected');
            }
        } catch (e) {
            console.error('Error checking local connection stats', e);
        }
    }
}
