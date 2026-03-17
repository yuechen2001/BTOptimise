/**
 * UserSession Service — Integration Tests
 *
 * Uses mongodb-memory-server so no real DB connection is needed.
 * Tests cover: create, retrieve, update, delete, input validation,
 * and server-side derivation of deferredIncomeAssessment.
 */
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../../app';

let mongod: MongoMemoryServer;

beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
});

afterEach(async () => {
    // Clear the collection between tests for isolation
    await mongoose.connection.collection('usersessions').deleteMany({});
});

/* ─── Shared helpers ────────────────────────────────────────────────────── */

const validProfile = {
    applicantType: 'single',
    age: 25,
    citizenship: 'SC',
    firstTimer: true,
    employmentStatus: 'employed',
    monthlyIncome: 4000,
    cpfOA: 20000,
    cashSavings: 30000,
    preferredFlatTypes: ['4-Room'],
    preferredRegions: ['Tampines'],
};

async function createSession(body = validProfile) {
    return request(app).post('/api/sessions').send(body);
}

/* ─── POST /api/sessions ────────────────────────────────────────────────── */

describe('POST /api/sessions', () => {
    it('creates a session and returns a sessionId', async () => {
        const res = await createSession();

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.sessionId).toBeDefined();
        expect(typeof res.body.data.sessionId).toBe('string');
    });

    it('creates a session with only partial profile (empty body)', async () => {
        const res = await createSession({} as any);

        expect(res.status).toBe(201);
        expect(res.body.data.sessionId).toBeDefined();
    });

    it('sets deferredIncomeAssessment=true for student', async () => {
        const res = await createSession({
            ...validProfile,
            employmentStatus: 'student',
            monthlyIncome: 0,
        });

        expect(res.status).toBe(201);
        expect(res.body.data.deferredIncomeAssessment).toBe(true);
    });

    it('sets deferredIncomeAssessment=true for nsf', async () => {
        const res = await createSession({
            ...validProfile,
            employmentStatus: 'nsf',
            monthlyIncome: 0,
        });

        expect(res.status).toBe(201);
        expect(res.body.data.deferredIncomeAssessment).toBe(true);
    });

    it('sets deferredIncomeAssessment=false for employed', async () => {
        const res = await createSession();

        expect(res.status).toBe(201);
        expect(res.body.data.deferredIncomeAssessment).toBe(false);
    });

    it('ignores client-supplied deferredIncomeAssessment', async () => {
        const res = await createSession({ ...validProfile, deferredIncomeAssessment: true } as any);

        // employmentStatus is "employed", so server should override to false
        expect(res.status).toBe(201);
        expect(res.body.data.deferredIncomeAssessment).toBe(false);
    });

    it('sets expiresAt approximately 24h in the future', async () => {
        const before = Date.now();
        const res = await createSession();
        const after = Date.now();

        const expiresAt = new Date(res.body.data.expiresAt).getTime();
        const twentyFourHours = 24 * 60 * 60 * 1000;

        expect(expiresAt).toBeGreaterThanOrEqual(before + twentyFourHours - 1000);
        expect(expiresAt).toBeLessThanOrEqual(after + twentyFourHours + 1000);
    });

    /* Validation failures */

    it('rejects age below 21', async () => {
        const res = await createSession({ ...validProfile, age: 18 });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/age/i);
    });

    it('rejects invalid applicantType', async () => {
        const res = await createSession({ ...validProfile, applicantType: 'group' } as any);

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/applicantType/i);
    });

    it('rejects invalid citizenship', async () => {
        const res = await createSession({ ...validProfile, citizenship: 'PR' } as any);

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/citizenship/i);
    });

    it('rejects invalid employmentStatus', async () => {
        const res = await createSession({ ...validProfile, employmentStatus: 'unemployed' } as any);

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/employmentStatus/i);
    });

    it('rejects negative monthlyIncome', async () => {
        const res = await createSession({ ...validProfile, monthlyIncome: -100 });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/monthlyIncome/i);
    });

    it('rejects invalid flat type in preferredFlatTypes', async () => {
        const res = await createSession({ ...validProfile, preferredFlatTypes: ['6-Room'] } as any);

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/flat type/i);
    });

    it('rejects invalid region in preferredRegions', async () => {
        const res = await createSession({ ...validProfile, preferredRegions: ['Atlantis'] } as any);

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/region/i);
    });

    it('rejects non-boolean firstTimer', async () => {
        const res = await createSession({ ...validProfile, firstTimer: 'yes' } as any);

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/firstTimer/i);
    });
});

/* ─── GET /api/sessions/:sessionId ─────────────────────────────────────── */

describe('GET /api/sessions/:sessionId', () => {
    it('retrieves an existing session', async () => {
        const createRes = await createSession();
        const { sessionId } = createRes.body.data;

        const res = await request(app).get(`/api/sessions/${sessionId}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.sessionId).toBe(sessionId);
        expect(res.body.data.age).toBe(validProfile.age);
    });

    it('returns 404 for a non-existent sessionId', async () => {
        const res = await request(app).get('/api/sessions/00000000-0000-0000-0000-000000000000');

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
    });
});

/* ─── PATCH /api/sessions/:sessionId ───────────────────────────────────── */

describe('PATCH /api/sessions/:sessionId', () => {
    it('updates individual profile fields', async () => {
        const createRes = await createSession();
        const { sessionId } = createRes.body.data;

        const res = await request(app)
            .patch(`/api/sessions/${sessionId}`)
            .send({ age: 30, cashSavings: 50000 });

        expect(res.status).toBe(200);
        expect(res.body.data.age).toBe(30);
        expect(res.body.data.cashSavings).toBe(50000);
        // Untouched fields should be preserved
        expect(res.body.data.monthlyIncome).toBe(validProfile.monthlyIncome);
    });

    it('re-derives deferredIncomeAssessment when employmentStatus changes to student', async () => {
        const createRes = await createSession(); // employed → false
        const { sessionId } = createRes.body.data;
        expect(createRes.body.data.deferredIncomeAssessment).toBe(false);

        const res = await request(app)
            .patch(`/api/sessions/${sessionId}`)
            .send({ employmentStatus: 'student' });

        expect(res.status).toBe(200);
        expect(res.body.data.deferredIncomeAssessment).toBe(true);
    });

    it('re-derives deferredIncomeAssessment when employmentStatus changes back to employed', async () => {
        const createRes = await createSession({
            ...validProfile,
            employmentStatus: 'nsf',
            monthlyIncome: 0,
        });
        const { sessionId } = createRes.body.data;
        expect(createRes.body.data.deferredIncomeAssessment).toBe(true);

        const res = await request(app)
            .patch(`/api/sessions/${sessionId}`)
            .send({ employmentStatus: 'employed', monthlyIncome: 4000 });

        expect(res.status).toBe(200);
        expect(res.body.data.deferredIncomeAssessment).toBe(false);
    });

    it('rejects invalid field values on update', async () => {
        const createRes = await createSession();
        const { sessionId } = createRes.body.data;

        const res = await request(app).patch(`/api/sessions/${sessionId}`).send({ age: 15 });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/age/i);
    });

    it('returns 404 when patching a non-existent session', async () => {
        const res = await request(app)
            .patch('/api/sessions/00000000-0000-0000-0000-000000000000')
            .send({ age: 30 });

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
    });
});

/* ─── DELETE /api/sessions/:sessionId ──────────────────────────────────── */

describe('DELETE /api/sessions/:sessionId', () => {
    it('deletes an existing session', async () => {
        const createRes = await createSession();
        const { sessionId } = createRes.body.data;

        const deleteRes = await request(app).delete(`/api/sessions/${sessionId}`);
        expect(deleteRes.status).toBe(200);
        expect(deleteRes.body.success).toBe(true);

        // Confirm it is gone
        const getRes = await request(app).get(`/api/sessions/${sessionId}`);
        expect(getRes.status).toBe(404);
    });

    it('returns 404 when deleting a non-existent session', async () => {
        const res = await request(app).delete('/api/sessions/00000000-0000-0000-0000-000000000000');

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
    });
});
