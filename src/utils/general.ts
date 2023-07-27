import jwt, { JwtPayload } from 'jsonwebtoken'
import dotenv from 'dotenv'


const result = dotenv.config()
export const envs = result.parsed || {}

const key = envs.TOKEN_SECRET || process.env.TOKEN_SECRET


export function generateAccessToken(username : string) {
    return jwt.sign({data: {username}}, key as string, { expiresIn: '1h' });
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


interface DecodedToken {
  data?: JwtPayload; // Adjust the JwtPayload type as per your JWT payload structure
  error?: string;
}

export function verifyToken(token: string): DecodedToken {
  try {
    const data = jwt.verify(token, key as string) as JwtPayload;
    return { data };
  } catch (error: any) {
    return { error: error.message };
  }
}
