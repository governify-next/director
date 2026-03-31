import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../utils/customErrors.js';
import { type Request, type Response, type NextFunction } from 'express';
import { getLogger } from '../utils/logger.js';
import { bootEnv } from '../config/bootConfig.js';

const logger = getLogger().setTag('authentication.ts');

declare module 'express' {
    interface Request {
        auth?: JwtPayload;
    }
}

export interface JwtPayload {
    service: string;
}

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new UnauthorizedError('Authorization header missing or malformed'));
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, bootEnv.JWT_SECRET) as JwtPayload;

        req.auth = decoded; // Attach JwtPayload to the Request for downstream use
        next();
    } catch (err) {
        logger.debug('JWT verification failed', err);
        next(new UnauthorizedError('Invalid or expired token'));
    }
};
