import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export const generateToken = (payload: object, expiresIn: string = '15m'): string => {
  // Aseguramos que el secret es string y las opciones coinciden
  return jwt.sign(payload, env.jwt.secret as string, { expiresIn } as SignOptions);
};

export const generateRefreshToken = (payload: object): string => {
  return jwt.sign(payload, env.jwt.refreshSecret as string, { expiresIn: '7d' } as SignOptions);
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, env.jwt.secret as string);
};