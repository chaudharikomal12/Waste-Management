const request = require('supertest');
const app = require('../app');
const { connectTestDB, clearTestDB, closeTestDB } = require('./setup');
const { createAuthedUser } = require('./helpers');

beforeAll(async () => await connectTestDB());
afterEach(async () => await clearTestDB());
afterAll(async () => await closeTestDB());

const samplePickup = {
  wasteType: 'Plastic',
  wasteDescription: '3 bags of bottles',
  estimatedQuantity: '5kg',
  pickupAddress: '12 MG Road, Nashik',
  preferredDate: '2026-07-15',
  preferredTime: '10:00',
  contactDetails: '9999999999'
};

describe('Pickup Request - Full Lifecycle (spec Section 6)', () => {
  it('Step 1-2: user creates pickup, stored as Open', async () => {
    const citizen = await createAuthedUser({ name: 'Citizen', email: 'c1@test.com', role: 'user' });
    const res = await request(app)
      .post('/api/pickups')
      .set('Authorization', `Bearer ${citizen.token}`)
      .send(samplePickup);

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('open');
  });

  it('Step 3: volunteer can view open pickups as opportunities', async () => {
    const citizen = await createAuthedUser({ name: 'C2', email: 'c2@test.com', role: 'user' });
    const volunteer = await createAuthedUser({ name: 'Vol', email: 'v2@test.com', role: 'volunteer' });

    await request(app).post('/api/pickups').set('Authorization', `Bearer ${citizen.token}`).send(samplePickup);

    const res = await request(app).get('/api/pickups/open').set('Authorization', `Bearer ${volunteer.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('Step 4-5: volunteer accepts a pickup, status becomes Accepted', async () => {
    const citizen = await createAuthedUser({ name: 'C3', email: 'c3@test.com', role: 'user' });
    const volunteer = await createAuthedUser({ name: 'V3', email: 'v3@test.com', role: 'volunteer' });

    const created = await request(app).post('/api/pickups').set('Authorization', `Bearer ${citizen.token}`).send(samplePickup);

    const res = await request(app)
      .put(`/api/pickups/${created.body._id}/accept`)
      .set('Authorization', `Bearer ${volunteer.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('accepted');
    expect(res.body.assignedVolunteer).toBe(volunteer.user.id);
  });

  it('rejects accepting a pickup that is already accepted', async () => {
    const citizen = await createAuthedUser({ name: 'C4', email: 'c4@test.com', role: 'user' });
    const volA = await createAuthedUser({ name: 'VA', email: 'va@test.com', role: 'volunteer' });
    const volB = await createAuthedUser({ name: 'VB', email: 'vb@test.com', role: 'volunteer' });

    const created = await request(app).post('/api/pickups').set('Authorization', `Bearer ${citizen.token}`).send(samplePickup);
    await request(app).put(`/api/pickups/${created.body._id}/accept`).set('Authorization', `Bearer ${volA.token}`);

    const res = await request(app).put(`/api/pickups/${created.body._id}/accept`).set('Authorization', `Bearer ${volB.token}`);
    expect(res.statusCode).toBe(400);
  });

  it('Step 6-7: assigned volunteer marks pickup completed', async () => {
    const citizen = await createAuthedUser({ name: 'C5', email: 'c5@test.com', role: 'user' });
    const volunteer = await createAuthedUser({ name: 'V5', email: 'v5@test.com', role: 'volunteer' });

    const created = await request(app).post('/api/pickups').set('Authorization', `Bearer ${citizen.token}`).send(samplePickup);
    await request(app).put(`/api/pickups/${created.body._id}/accept`).set('Authorization', `Bearer ${volunteer.token}`);

    const res = await request(app)
      .put(`/api/pickups/${created.body._id}/complete`)
      .set('Authorization', `Bearer ${volunteer.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('completed');
  });

  it('prevents a different volunteer from completing someone else\'s assigned pickup', async () => {
    const citizen = await createAuthedUser({ name: 'C6', email: 'c6@test.com', role: 'user' });
    const volA = await createAuthedUser({ name: 'VC', email: 'vc@test.com', role: 'volunteer' });
    const volB = await createAuthedUser({ name: 'VD', email: 'vd@test.com', role: 'volunteer' });

    const created = await request(app).post('/api/pickups').set('Authorization', `Bearer ${citizen.token}`).send(samplePickup);
    await request(app).put(`/api/pickups/${created.body._id}/accept`).set('Authorization', `Bearer ${volA.token}`);

    const res = await request(app).put(`/api/pickups/${created.body._id}/complete`).set('Authorization', `Bearer ${volB.token}`);
    expect(res.statusCode).toBe(403);
  });

  it('Step 8: admin can view all pickups for monitoring', async () => {
    const citizen = await createAuthedUser({ name: 'C7', email: 'c7@test.com', role: 'user' });
    const admin = await createAuthedUser({ name: 'Adm', email: 'adm7@test.com', role: 'admin' });

    await request(app).post('/api/pickups').set('Authorization', `Bearer ${citizen.token}`).send(samplePickup);

    const res = await request(app).get('/api/admin/pickups').set('Authorization', `Bearer ${admin.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('a citizen only sees their own pickups, not everyone\'s', async () => {
    const citizenA = await createAuthedUser({ name: 'CA', email: 'ca@test.com', role: 'user' });
    const citizenB = await createAuthedUser({ name: 'CB', email: 'cb@test.com', role: 'user' });

    await request(app).post('/api/pickups').set('Authorization', `Bearer ${citizenA.token}`).send(samplePickup);

    const res = await request(app).get('/api/pickups/my').set('Authorization', `Bearer ${citizenB.token}`);
    expect(res.body.length).toBe(0);
  });
});
