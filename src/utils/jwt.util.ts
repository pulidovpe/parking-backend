import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export const generateToken = (payload: object, expiresIn?: string): string => {
  // Usar el valor de env si no se proporciona uno
  const expiration = expiresIn || env.jwt.expiresIn;
  
  console.log('🔑 Generando access token con expiración:', expiration);
  
  return jwt.sign(
    payload, 
    env.jwt.secret as string, 
    { expiresIn: expiration } as SignOptions
  );
};

export const generateRefreshToken = (payload: object, expiresIn?: string): string => {
  // Usar el valor de env si no se proporciona uno
  const expiration = expiresIn || env.jwt.refreshExpiresIn;
  
  console.log('🔑 Generando refresh token con expiración:', expiration);
  
  return jwt.sign(
    payload, 
    env.jwt.refreshSecret as string, 
    { expiresIn: expiration } as SignOptions
  );
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, env.jwt.secret as string);
};

export const verifyRefreshToken = (token: string): any => {
  return jwt.verify(token, env.jwt.refreshSecret as string);
};