/**
 * Formats bytes into human-readable string (B, KB, MB, GB)
 * @param {number} bytes
 * @returns {string}
 */
export const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

/**
 * Calculates transfer speed and ETA
 * @param {number} loaded - Bytes transferred
 * @param {number} total - Total bytes
 * @param {number} start - Start timestamp in ms
 * @returns {{ speed: string, eta: string } | null}
 */
export const calculateTransferStats = (loaded, total, start) => {
    const now = Date.now();
    const duration = (now - start) / 1000;
    if (duration === 0) return null;

    const speedBytes = loaded / duration;
    const remainingBytes = total - loaded;
    const etaSeconds = speedBytes > 0 ? remainingBytes / speedBytes : 0;

    const totalSeconds = Math.ceil(etaSeconds);
    const eta = totalSeconds >= 60
        ? `${Math.floor(totalSeconds / 60)}m ${totalSeconds % 60}s`
        : totalSeconds + 's';

    return {
        speed: formatBytes(speedBytes) + '/s',
        eta
    };
};

/**
 * Copies text to clipboard
 * @param {string} text
 * @returns {Promise<void>}
 */
export const copyToClipboard = async (text) => {
    if (!navigator.clipboard) {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
        } catch (err) {
            console.error('Fallback copy failed', err);
        }
        document.body.removeChild(textArea);
        return;
    }
    await navigator.clipboard.writeText(text);
};
