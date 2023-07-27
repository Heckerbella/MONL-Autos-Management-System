import jwt, { JsonWebTokenError, JwtPayload } from 'jsonwebtoken'
import dotenv from 'dotenv'


const result = dotenv.config()
export const envs = result.parsed || {}

const key = envs.TOKEN_SECRET || process.env.TOKEN_SECRET


export function generateAccessToken(email : string) {
    return jwt.sign({data: {email}}, key as string, { expiresIn: '1h' });
}

// export function verifyAccessToken(token : string) {
//     // return jwt.verify(token, key as string) as {data: {username: string}}
//     const decodedToken = verifyToken(token, key);

//     if (decodedToken.error) {
//     console.error('Error verifying JWT:', decodedToken.error);
//     } else {
//     console.log('Decoded JWT data:', decodedToken.data);
//     }
// }


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
