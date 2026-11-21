// Web Crypto API - Client-Side End-to-End Encryption (AES-GCM 256-bit)

class CryptoService {
  constructor() {
    this.cachedKey = null;
    this.currentPassphrase = null;
  }

  // Derive AES-GCM-256 key from passphrase and salt
  async deriveKey(passphrase, salt = 'aura_alarm_salt_e2ee_2026') {
    if (this.cachedKey && this.currentPassphrase === passphrase) {
      return this.cachedKey;
    }

    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(passphrase),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    const derivedKey = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: enc.encode(salt),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    this.cachedKey = derivedKey;
    this.currentPassphrase = passphrase;
    return derivedKey;
  }

  // Encrypt plaintext into { iv, ciphertext } base64 string
  async encrypt(plaintext, passphrase = 'default-aura-vault-key') {
    if (!plaintext) return '';
    try {
      const key = await this.deriveKey(passphrase);
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encoded = new TextEncoder().encode(plaintext);

      const cipherBuffer = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoded
      );

      const ivBase64 = btoa(String.fromCharCode(...iv));
      const cipherBase64 = btoa(String.fromCharCode(...new Uint8Array(cipherBuffer)));

      return `E2EE::${ivBase64}::${cipherBase64}`;
    } catch (err) {
      console.error('Encryption failed:', err);
      return plaintext;
    }
  }

  // Decrypt base64 string back to plaintext
  async decrypt(encryptedString, passphrase = 'default-aura-vault-key') {
    if (!encryptedString || !encryptedString.startsWith('E2EE::')) {
      return encryptedString; // Return unencrypted as-is
    }

    try {
      const parts = encryptedString.split('::');
      if (parts.length !== 3) return encryptedString;

      const iv = new Uint8Array(atob(parts[1]).split('').map(c => c.charCodeAt(0)));
      const cipherBytes = new Uint8Array(atob(parts[2]).split('').map(c => c.charCodeAt(0)));

      const key = await this.deriveKey(passphrase);
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        cipherBytes
      );

      return new TextDecoder().decode(decryptedBuffer);
    } catch (err) {
      console.warn('Decryption failed, could be wrong key:', err);
      return '[Encrypted Vault Note - Key Required]';
    }
  }
}

export const cryptoService = new CryptoService();
