export class WebRTCManager {
    constructor(socket, onData, onStatusChange) {
        this.socket = socket;
        this.onData = onData;
        this.onStatusChange = onStatusChange; // 'connecting', 'connected', 'disconnected'
        this.peerConnection = null;
        this.dataChannel = null;
        this.remotePeerId = null;
        this.isInitiator = false;

        this.config = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
            ]
        };
    }

    initializePeer(remotePeerId, isInitiator) {
        this.remotePeerId = remotePeerId;
        this.isInitiator = isInitiator;
        this.peerConnection = new RTCPeerConnection(this.config);

        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.socket.emit('ice-candidate', {
                    target: this.remotePeerId,
                    candidate: event.candidate
                });
            }
        };

        this.peerConnection.onconnectionstatechange = () => {
            console.log('Connection state:', this.peerConnection.connectionState);
            this.onStatusChange(this.peerConnection.connectionState);
        };

        if (this.isInitiator) {
            this.dataChannel = this.peerConnection.createDataChannel("file-transfer");
            this.setupDataChannel();
            this.createOffer();
        } else {
            this.peerConnection.ondatachannel = (event) => {
                this.dataChannel = event.channel;
                this.setupDataChannel();
            };
        }
    }

    setupDataChannel() {
        if (!this.dataChannel) return;

        // Set binary type explicitly for file transfers
        this.dataChannel.binaryType = 'arraybuffer';

        this.dataChannel.onopen = () => {
            console.log('Data channel is open');
            this.onStatusChange('connected'); // Simplified status
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
        try {
            if (callerId) this.remotePeerId = callerId;
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);
            this.socket.emit('answer', {
                target: this.remotePeerId,
                sdp: answer
            });
        } catch (err) {
            console.error('Failed to handle offer:', err);
        }
    }

    async handleAnswer(answer) {
        try {
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
            console.error('Failed to handle answer:', err);
        }
    }

    async handleCandidate(candidate) {
        try {
            if (this.peerConnection.remoteDescription) {
                await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            }
        } catch (e) {
            console.error('Error adding received ice candidate', e);
        }
    }

    sendData(data) {
        if (this.dataChannel && this.dataChannel.readyState === 'open') {
            this.dataChannel.send(data);
            return true;
        }
        return false;
    }

    getBufferedAmount() {
        return this.dataChannel ? this.dataChannel.bufferedAmount : 0;
    }

    destroy() {
        if (this.dataChannel) {
            this.dataChannel.close();
        }
        if (this.peerConnection) {
            this.peerConnection.close();
        }
    }
}
