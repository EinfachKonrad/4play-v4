// encryption.js
/* eslint-disable @typescript-eslint/no-var-requires */
const method = 'aes-256-cbc'

function ensureServer() {
  if (typeof window !== 'undefined') {
    throw new Error('encryptData/decryptData can only be used on the server')
  }
}

function getCrypto() {
  ensureServer()
  // require here so bundlers don't try to include Node's crypto in the client bundle
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const crypto = require('crypto')
  return crypto
}

function getKeys() {
  const crypto = getCrypto()
  const secret = process.env.SECRET_KEY
  const iv = process.env.SECRET_IV

  if (!secret) {
    throw new Error('SECRET_KEY environment variable is required for encryption')
  }
  if (!iv) {
    throw new Error('SECRET_IV environment variable is required for encryption')
  }

  const key = crypto
    .createHash('sha512')
    .update(secret)
    .digest('hex')
    .substring(0, 32)
  const encryptionIV = crypto
    .createHash('sha512')
    .update(iv)
    .digest('hex')
    .substring(0, 16)

  return { crypto, key, encryptionIV }
}

export function encryptData(data: string) {
  const { crypto, key, encryptionIV } = getKeys()
  const cipher = crypto.createCipheriv(method, key, encryptionIV)
  return Buffer.from(
    cipher.update(data, 'utf8', 'hex') + cipher.final('hex')
  ).toString('base64')
}

export function decryptData(encryptedData: string) {
  const { crypto, key, encryptionIV } = getKeys()
  // Backward-compatible: some legacy records are plain text, not encrypted.
  // Only decrypt strings that look like base64-encoded hex payloads.
  const isBase64 = /^[A-Za-z0-9+/]+={0,2}$/.test(encryptedData) && encryptedData.length % 4 === 0
  if (!isBase64) {
    return encryptedData
  }

  const buff = Buffer.from(encryptedData, 'base64')
  const hexPayload = buff.toString('utf8')
  const isHex = /^[0-9a-fA-F]+$/.test(hexPayload) && hexPayload.length % 2 === 0

  if (!isHex) {
    return encryptedData
  }

  try {
    const decipher = crypto.createDecipheriv(method, key, encryptionIV)
    return decipher.update(hexPayload, 'hex', 'utf8') + decipher.final('utf8')
  } catch {
    // If decryption fails, preserve the original value instead of crashing auth.
    return encryptedData
  }
}