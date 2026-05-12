import jwt from 'jsonwebtoken';
import { bootEnv } from '../config/bootConfig.js';

function generateJwt(service: string): string {
    return jwt.sign({ service }, bootEnv.JWT_SECRET, { expiresIn: '1d' });
}

export { generateJwt };
