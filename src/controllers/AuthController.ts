import { db } from "../../src/utils/prismaClient";
import { Request, Response, NextFunction } from "express";
import { DecodedToken, generateAccessToken, generateRefreshToken, verifyRefreshToken, verifyToken } from "../utils/general";
import jwt, { JwtPayload } from 'jsonwebtoken'


class Auth {
    async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;

            const user = await db.user.findUnique({ where: { email } })
            if (!user) {
                res.status(401).json({error_code: 401, msg: 'Invalid credentials'});
            } else {
                const encodedpassword = Buffer.from(password, 'utf8').toString("base64");
                if (user.password === encodedpassword) {
                    const token = generateAccessToken(user.email)
                    const refreshToken = generateRefreshToken(user.email)
                    res.status(200).json({
                        message: 'Login successful',
                        data: {
                            id: user.id,
                            email: user.email,
                            subscriberId: user.subscriberID,
                            access_token: token,
                            refresh_token: refreshToken
                        }
                    })
                } else {
                    res.status(401).json({error_code: 401, msg:'Invalid credentials'});
                }
            }
        } catch (error) {
            res.status(400).json({ error_code: 400, msg: 'Bad request'})
        }    
    }

    // async logout(req: Request, res: Response) {
    //     try {
    //         const cookies = await parseCookies(req);
    //         const {token} = cookies

    //         let bearer
            
    //         const authHeader = req.headers['authorization'];
            
    //         if (authHeader && authHeader.startsWith('Bearer ')) {
    //           bearer = authHeader.split(' ')[1];
    //         }
            
    //         const tokenValue = token || bearer

    //         if (tokenValue) {
    //             await redisClient.del(tokenValue);
    //             console.log(`logged out`);
    //             res.status(200).clearCookie('token').send('Logged out');
    //         } else {
    //             res.status(401).send('Unauthorized');
    //         }
    //     } catch (error) {
    //         console.log(error);
    //         res.status(500).send('Internal server error');
    //     }
    // }

    async auth(req: Request, res: Response, next: NextFunction) {
        try {
           
            const authHeader = req.headers['authorization'];

            const bearer = (authHeader?.split(' ')[1])?.replace(/^(['"])(.*?)\1$/, '$2');

            if (bearer) {
                const decodedToken: DecodedToken = verifyToken(bearer);

                if (decodedToken.error) {
                    const err: any = decodedToken.error
                    if (err instanceof jwt.JsonWebTokenError) {
                        return res.status(401).json({ error_code: 401, msg: 'Invalid token' });
                      } else if (err instanceof jwt.TokenExpiredError) {
                        return res.status(401).json({ error_code: 401, msg: 'Token has expired' });
                      } else if (err instanceof jwt.NotBeforeError) {
                        return res.status(401).json({ error_code: 401, msg: 'Token cannot be used yet' });
                      }
                      return res.status(500).json({ error_code: 500, msg: 'Something went wrong' });
                    
                } else {
                    const { email } = decodedToken?.data?.data ?? { email: null };
                    if (email) {
                        const user = await db.user.findUnique({ where: { email } });
                        
                        if (user) {
                            req.body = {...req.body, detokenizedEmail: email, detokenizedRole: user.roleID};
                            next();
                        }
                    } else {
                        res.status(401).json({error_code: 401, msg: 'Unauthorized'});
                    }
                }
            } else {
                    res.status(401).json({error_code: 401, msg: 'Unauthorized'});
            }
        } catch (error) {
            res.status(500).json({error_code: 500, msg: 'Internal Server Error'});
        }
    }

    async refresh (req: Request, res: Response) {
        const { refresh_token } = req.body
        if (!refresh_token) return res.status(401).json({error_code: 400, msg: 'Unauthorized'});

        try {
            const decodedToken: DecodedToken = verifyRefreshToken(refresh_token?.replace(/^(['"])(.*?)\1$/, '$2'));

            if (decodedToken.error) {
                const err: any = decodedToken.error
                if (err instanceof jwt.JsonWebTokenError) {
                    return res.status(401).json({ error_code: 401, msg: 'Invalid token' });
                  } else if (err instanceof jwt.TokenExpiredError) {
                    return res.status(401).json({ error_code: 401, msg: 'Token has expired' });
                  } else if (err instanceof jwt.NotBeforeError) {
                    return res.status(401).json({ error_code: 401, msg: 'Token cannot be used yet' });
                  }
                  return res.status(500).json({ error_code: 500, msg: 'Something went wrong' });
                
            } else {
                const { email, refresh } = decodedToken?.data?.data ?? { email: null, refresh: null };
                if (email && refresh) {
                    const access_token = generateAccessToken(email)
                    return res.status(200).json({data: {access_token}, msg: "Token refreshed successfully."});   
                } else {
                    res.status(401).json({error_code: 401, msg: 'Unauthorized'});
                }
            }
        } catch (error) {
            res.status(500).json({error_code: 500, msg: 'Internal Server Error'});
        }
    }
}

const auth = new Auth();
export default auth;
