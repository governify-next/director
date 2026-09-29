import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { bootEnv } from '../src/config/bootConfig.js';

describe('Script route authentication', () => {
    it.each(['/api/v1/scripts/', '/api/v1/scripts/example.echo'])(
        'requires a service token for %s',
        async (path) => {
            const response = await request(app).get(path);
            expect(response.status).toBe(401);
        },
    );

    it('accepts a valid service token', async () => {
        const token = jwt.sign(
            { type: 'service', sub: 'reporter', service: 'reporter', serviceName: 'reporter' },
            bootEnv.JWT_SECRET,
            { issuer: bootEnv.JWT_ISSUER, audience: bootEnv.JWT_AUDIENCE },
        );
        const response = await request(app)
            .get('/api/v1/scripts/')
            .set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(200);
    });
});
