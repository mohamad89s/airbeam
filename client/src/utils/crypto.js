/**
 * Client-side file encryption using Web Crypto API
 * AES-GCM with PBKDF2 key derivation
 */

const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

/**
 * Derive encryption key from password using PBKDF2
 */
async function deriveKey(password, salt) {
    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: PBKDF2_ITERATIONS,
            hash: 'SHA-256'
        },
        passwordKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypt file data
 * @param {File} file - File to encrypt
 * @param {string} password - Password to use
 * @returns {Promise<{encryptedData: ArrayBuffer, salt: Uint8Array, iv: Uint8Array}>}
 */
export async function encryptFile(file, password) {
    // Generate random salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    // Derive key from password
    const key = await deriveKey(password, salt);

    // Read file as ArrayBuffer
    const fileData = await file.arrayBuffer();

    // Encrypt
    const encryptedData = await crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv
        },
        key,
        fileData
    );

    return {
        encryptedData,
        salt,
        iv
    };
}

/**
 * Decrypt file data
 * @param {ArrayBuffer} encryptedData - Encrypted file data
 * @param {string} password - Password to use
 * @param {Uint8Array} salt - Salt used during encryption
 * @param {Uint8Array} iv - IV used during encryption
 * @returns {Promise<ArrayBuffer>} - Decrypted file data
 */
export async function decryptFile(encryptedData, password, salt, iv) {
    // Derive key from password
    const key = await deriveKey(password, salt);

    // Decrypt
    try {
        const decryptedData = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            key,
            encryptedData
        );
        return decryptedData;
    } catch (error) {
        throw new Error('Decryption failed. Incorrect password or corrupted data.');
    }
}

/**
 * Encrypt chunk (for chunked transfer)
 */
export async function encryptChunk(chunk, password, salt, iv) {
    const key = await deriveKey(password, salt);

    return crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv
        },
        key,
        chunk
    );
}

/**
 * Decrypt chunk (for chunked transfer)
 */
export async function decryptChunk(encryptedChunk, password, salt, iv) {
    const key = await deriveKey(password, salt);

    try {
        return await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            key,
            encryptedChunk
        );
    } catch (error) {
        throw new Error('Chunk decryption failed.');
    }
}
