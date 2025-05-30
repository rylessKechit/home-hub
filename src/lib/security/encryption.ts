// src/lib/security/encryption.ts
import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!
const ALGORITHM = 'aes-256-gcm'

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
  throw new Error('ENCRYPTION_KEY must be 64 characters (32 bytes hex)')
}

// Convertir la clé hex en Buffer
const KEY = Buffer.from(ENCRYPTION_KEY, 'hex')

export interface EncryptedData {
  encrypted: string
  iv: string
  authTag: string
}

/**
 * Chiffre du texte avec AES-256-GCM
 */
export function encrypt(text: string): EncryptedData {
  if (!text) {
    throw new Error('Text to encrypt cannot be empty')
  }

  // Générer un IV aléatoire
  const iv = crypto.randomBytes(16)
  
  // Créer le cipher
  const cipher = crypto.createCipher(ALGORITHM, KEY)
  
  // Chiffrer
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  // Récupérer l'auth tag pour l'intégrité
  const authTag = cipher.getAuthTag()
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  }
}

/**
 * Déchiffre des données chiffrées
 */
export function decrypt(data: EncryptedData): string {
  if (!data.encrypted || !data.iv || !data.authTag) {
    throw new Error('Invalid encrypted data format')
  }

  try {
    // Créer le decipher
    const decipher = crypto.createDecipher(ALGORITHM, KEY)
    decipher.setAuthTag(Buffer.from(data.authTag, 'hex'))
    
    // Déchiffrer
    let decrypted = decipher.update(data.encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt data')
  }
}

/**
 * Chiffre des credentials JSON
 */
export function encryptCredentials(credentials: Record<string, any>): string {
  const json = JSON.stringify(credentials)
  const encrypted = encrypt(json)
  
  // Encoder en base64 pour stockage facile
  return Buffer.from(JSON.stringify(encrypted)).toString('base64')
}

/**
 * Déchiffre des credentials depuis la DB
 */
export function decryptCredentials(encryptedCredentials: string): Record<string, any> {
  try {
    // Décoder depuis base64
    const json = Buffer.from(encryptedCredentials, 'base64').toString('utf8')
    const encryptedData: EncryptedData = JSON.parse(json)
    
    // Déchiffrer
    const decrypted = decrypt(encryptedData)
    return JSON.parse(decrypted)
  } catch (error) {
    console.error('Credentials decryption error:', error)
    throw new Error('Failed to decrypt credentials')
  }
}

/**
 * Hash sécurisé pour les mots de passe (alternative à bcrypt)
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256').toString('hex')
  return `${salt}:${hash}`
}

/**
 * Vérifier un mot de passe hashé
 */
export function verifyPassword(password: string, hashedPassword: string): boolean {
  try {
    const [salt, hash] = hashedPassword.split(':')
    const verifyHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256').toString('hex')
    return hash === verifyHash
  } catch {
    return false
  }
}

/**
 * Générer une clé d'API sécurisée
 */
export function generateApiKey(prefix = 'ihub'): string {
  const randomBytes = crypto.randomBytes(32).toString('hex')
  return `${prefix}_${randomBytes}`
}

/**
 * Générer un token de vérification
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Hash rapide pour identifier les données (non cryptographique)
 */
export function quickHash(data: string): string {
  return crypto.createHash('md5').update(data).digest('hex')
}

/**
 * Vérifier l'intégrité d'un webhook avec signature HMAC
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch {
    return false
  }
}

/**
 * Masquer partiellement des données sensibles pour les logs
 */
export function maskSensitiveData(data: string, visibleChars = 4): string {
  if (data.length <= visibleChars * 2) {
    return '*'.repeat(data.length)
  }
  
  const start = data.slice(0, visibleChars)
  const end = data.slice(-visibleChars)
  const middle = '*'.repeat(data.length - visibleChars * 2)
  
  return `${start}${middle}${end}`
}

// Export des constantes utiles
export const ENCRYPTION_CONFIG = {
  algorithm: ALGORITHM,
  keyLength: 32, // bytes
  ivLength: 16,  // bytes
  tagLength: 16, // bytes
} as const