// /api/crypto.js
// Encryption/Decryption API for pros and cons text
// Uses AES-256-GCM authenticated encryption

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  // Hash the key to ensure it's exactly 32 bytes for AES-256
  return crypto.createHash('sha256').update(key).digest();
}

function encrypt(text) {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  // Combine IV + authTag + encrypted data, all base64 encoded
  // Format: base64(iv):base64(authTag):base64(encryptedData)
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

function decrypt(encryptedText) {
  const key = getKey();

  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format');
  }

  const iv = Buffer.from(parts[0], 'base64');
  const authTag = Buffer.from(parts[1], 'base64');
  const encrypted = parts[2];

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, text, texts } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Missing action parameter' });
    }

    // Handle batch operations for efficiency
    if (action === 'encrypt') {
      if (texts && Array.isArray(texts)) {
        // Batch encrypt
        const encrypted = texts.map(t => encrypt(t));
        return res.status(200).json({ encrypted });
      } else if (text) {
        // Single encrypt
        const encrypted = encrypt(text);
        return res.status(200).json({ encrypted });
      } else {
        return res.status(400).json({ error: 'Missing text or texts parameter' });
      }
    }

    if (action === 'decrypt') {
      if (texts && Array.isArray(texts)) {
        // Batch decrypt
        const decrypted = texts.map(t => {
          try {
            return decrypt(t);
          } catch (err) {
            // If decryption fails, return the original text
            // This handles cases where text wasn't encrypted (migration)
            console.warn('Decryption failed for text, returning as-is:', err.message);
            return t;
          }
        });
        return res.status(200).json({ decrypted });
      } else if (text) {
        // Single decrypt
        try {
          const decrypted = decrypt(text);
          return res.status(200).json({ decrypted });
        } catch (err) {
          // If decryption fails, return the original text
          console.warn('Decryption failed, returning original:', err.message);
          return res.status(200).json({ decrypted: text });
        }
      } else {
        return res.status(400).json({ error: 'Missing text or texts parameter' });
      }
    }

    return res.status(400).json({ error: 'Invalid action. Use "encrypt" or "decrypt"' });

  } catch (error) {
    console.error('Crypto API error:', error);
    return res.status(500).json({ error: error.message });
  }
};
