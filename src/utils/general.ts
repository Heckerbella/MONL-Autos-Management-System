import jwt, { JsonWebTokenError, JwtPayload } from 'jsonwebtoken'
import dotenv from 'dotenv'


const result = dotenv.config()
export const envs = result.parsed || {}

const key = envs.TOKEN_SECRET || process.env.TOKEN_SECRET
const refreshKey = envs.REFRESH_TOKEN_SECRET || process.env.REFRESH_TOKEN_SECRET


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
