import crypto from 'crypto';
import { env } from '../config/env';

const ALGORITHM = 'aes-256-cbc';
// Convertimos la clave HEX a Buffer
const KEY = Buffer.from(env.encryptionKey, 'hex');

export const encryptionUtil = {
  encrypt(text: string): string {
    // Vector de inicialización aleatorio (16 bytes)
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Devolvemos IV:TextoEncriptado
    return `${iv.toString('hex')}:${encrypted}`;
  },

  decrypt(text: string): string {
    const parts = text.split(':');
    // Validación simple para evitar errores si leemos algo no encriptado
    if (parts.length !== 2) throw new Error('Formato de datos corrupto o no encriptado');
    
    const [ivHex, encryptedHex] = parts;

    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
};