import { Novu } from '@novu/node';
import jwt, { JsonWebTokenError, JwtPayload } from 'jsonwebtoken'
import dotenv from 'dotenv'


const result = dotenv.config()
export const envs = result.parsed || {}

const key = envs.TOKEN_SECRET || process.env.TOKEN_SECRET
const refreshKey = envs.REFRESH_TOKEN_SECRET || process.env.REFRESH_TOKEN_SECRET
const novuAPI = envs.NOVU_API_KEY || process.env.NOVU_API_KEY as string

export const novu = new Novu(novuAPI);

export function generateAccessToken(email : string) {
    return jwt.sign({data: {email}}, key as string, { expiresIn: '24h' });
}

export function generateRefreshToken(email: string) {
    return jwt.sign({data: {refresh: true, email}}, refreshKey as string, { expiresIn: '7d' });
}


export interface DecodedToken {
  data?: JwtPayload; // Adjust the JwtPayload type as per your JWT payload structure
  error?: JsonWebTokenError;
}

export function verifyToken(token: string): DecodedToken {
  try {
    const data = jwt.verify(token, key as string) as JwtPayload;
    return { data };
  } catch (error: any) {
    return { error: error };
  }
}

export function verifyRefreshToken(token: string) {
  try {
    const data = jwt.verify(token, refreshKey as string) as JwtPayload;
    return { data };
  } catch (error: any) {
    return { error: error };
  }
}

export function isValidDate (dateString: string) {
  const timestamp = Date.parse(dateString);
  return !isNaN(timestamp);
}

export function generateUniqueId() {
  // Generate a 10-digit timestamp
  const timestamp = Date.now().toString().substr(-10);

  // Generate 4 random digits
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

  // Combine timestamp and random digits
  const uniqueId = timestamp + random;

  return uniqueId;
}
