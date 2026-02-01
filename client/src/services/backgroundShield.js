class BackgroundShield {
    constructor() {
        this.ctx = null;
        this.keepAliveInterval = null;
    }

    /**
     * Activates the background shield by starting a silent audio context.
     * This should be called during a user interaction (like a button click).
     */
    activate() {
        if (this.ctx) return;

        try {
            // Using Web Audio API to create a silent but "active" audio stream
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();

            // Create a buffer source that plays silence
            const buffer = this.ctx.createBuffer(1, 1, 22050);
            const source = this.ctx.createBufferSource();
            source.buffer = buffer;
            source.loop = true;

            // Connect to destination but keep volume at 0
            const gainNode = this.ctx.createGain();
            gainNode.gain.value = 0.01; // Extremely low, effectively silent

            source.connect(gainNode);
            gainNode.connect(this.ctx.destination);

            source.start();

            // Force resume if suspended (common in browsers)
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }

            console.log('🛡️ Background Activity Shield: Active');

            // Small periodic heartbeat to ensure the main thread stays high priority
            this.keepAliveInterval = setInterval(() => {
                if (this.ctx && this.ctx.state === 'suspended') {
                    this.ctx.resume();
                }
            }, 5000);

        } catch (e) {
            console.error('Failed to activate background shield:', e);
        }
    }

    deactivate() {
        if (this.keepAliveInterval) {
            clearInterval(this.keepAliveInterval);
            this.keepAliveInterval = null;
        }

        if (this.ctx) {
            this.ctx.close();
            this.ctx = null;
            console.log('🛡️ Background Activity Shield: Released');
        }
    }
}

export const backgroundShield = new BackgroundShield();
