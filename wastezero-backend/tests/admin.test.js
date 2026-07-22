const request = require('supertest');
const app = require('../app');
const { connectTestDB, clearTestDB, closeTestDB } = require('./setup');
const { createAuthedUser } = require('./helpers');

beforeAll(async () => await connectTestDB());
afterEach(async () => await clearTestDB());
afterAll(async () => await closeTestDB());

describe('Admin Dashboard & Controls', () => {
  it('returns platform-wide stats', async () => {
    const admin = await createAuthedUser({ name: 'StatsAdmin', email: 'stats@test.com', role: 'admin' });
    await createAuthedUser({ name: 'StatUser', email: 'statuser@test.com', role: 'user' });
    await createAuthedUser({ name: 'StatVol', email: 'statvol@test.com', role: 'volunteer' });

    const res = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${admin.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.totalUsers).toBeGreaterThanOrEqual(1);
    expect(res.body.totalVolunteers).toBeGreaterThanOrEqual(1);
  });

  it('blocks a non-admin from accessing admin stats', async () => {
    const user = await createAuthedUser({ name: 'Blocked', email: 'blocked@test.com', role: 'user' });
    const res = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${user.token}`);
    expect(res.statusCode).toBe(403);
  });

  it('lists all users for the admin', async () => {
    const admin = await createAuthedUser({ name: 'ListAdmin', email: 'listadmin@test.com', role: 'admin' });
    await createAuthedUser({ name: 'ListUser', email: 'listuser@test.com', role: 'user' });

    const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${admin.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.some(u => u.email === 'listuser@test.com')).toBe(true);
    // passwords should never be returned
    expect(res.body.every(u => !u.password)).toBe(true);
  });

  it('suspends and reactivates a user, logging both actions', async () => {
    const admin = await createAuthedUser({ name: 'SuspendAdmin', email: 'suspendadmin@test.com', role: 'admin' });
    const target = await createAuthedUser({ name: 'Target', email: 'target@test.com', role: 'user' });

    const suspendRes = await request(app)
      .put(`/api/admin/users/${target.user.id}/suspend`)
      .set('Authorization', `Bearer ${admin.token}`);
    expect(suspendRes.body.user.isSuspended).toBe(true);

    const reactivateRes = await request(app)
      .put(`/api/admin/users/${target.user.id}/suspend`)
      .set('Authorization', `Bearer ${admin.token}`);
    expect(reactivateRes.body.user.isSuspended).toBe(false);

    const logs = await request(app).get('/api/admin/logs').set('Authorization', `Bearer ${admin.token}`);
    expect(logs.body.length).toBe(2);
    expect(logs.body.map(l => l.action)).toEqual(expect.arrayContaining(['suspended_user', 'activated_user']));
  });

  it('a suspended user cannot log in', async () => {
    const admin = await createAuthedUser({ name: 'SuspendAdmin2', email: 'suspendadmin2@test.com', role: 'admin' });
    const target = await createAuthedUser({ name: 'Target2', email: 'target2@test.com', role: 'user' });

    await request(app).put(`/api/admin/users/${target.user.id}/suspend`).set('Authorization', `Bearer ${admin.token}`);

    const loginRes = await request(app).post('/api/auth/login').send({ email: 'target2@test.com', password: 'password123' });
    expect(loginRes.statusCode).toBe(403);
  });
});

describe('Admin Reports', () => {
  it('generates a user report with totals', async () => {
    const admin = await createAuthedUser({ name: 'RepAdmin', email: 'repadmin@test.com', role: 'admin' });
    await createAuthedUser({ name: 'RepUser', email: 'repuser@test.com', role: 'user' });

    const res = await request(app).get('/api/admin/reports/users').set('Authorization', `Bearer ${admin.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('active');
    expect(res.body).toHaveProperty('volunteers');
  });

  it('generates a pickup report with status breakdown', async () => {
    const admin = await createAuthedUser({ name: 'RepAdmin2', email: 'repadmin2@test.com', role: 'admin' });
    const citizen = await createAuthedUser({ name: 'RepCitizen', email: 'repcitizen@test.com', role: 'user' });

    await request(app).post('/api/pickups').set('Authorization', `Bearer ${citizen.token}`).send({
      wasteType: 'Organic', estimatedQuantity: '2kg', pickupAddress: 'Addr',
      preferredDate: '2026-08-01', preferredTime: '09:00'
    });

    const res = await request(app).get('/api/admin/reports/pickups').set('Authorization', `Bearer ${admin.token}`);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
    expect(res.body.pending).toBeGreaterThanOrEqual(1);
  });

  it('generates a volunteer report including completed-pickup counts per volunteer', async () => {
    const admin = await createAuthedUser({ name: 'RepAdmin3', email: 'repadmin3@test.com', role: 'admin' });
    const citizen = await createAuthedUser({ name: 'RepCitizen2', email: 'repcitizen2@test.com', role: 'user' });
    const volunteer = await createAuthedUser({ name: 'RepVol', email: 'repvol@test.com', role: 'volunteer' });

    const pickup = await request(app).post('/api/pickups').set('Authorization', `Bearer ${citizen.token}`).send({
      wasteType: 'Metal', estimatedQuantity: '1kg', pickupAddress: 'Addr',
      preferredDate: '2026-08-01', preferredTime: '09:00'
    });
    await request(app).put(`/api/pickups/${pickup.body._id}/accept`).set('Authorization', `Bearer ${volunteer.token}`);
    await request(app).put(`/api/pickups/${pickup.body._id}/complete`).set('Authorization', `Bearer ${volunteer.token}`);

    const res = await request(app).get('/api/admin/reports/volunteers').set('Authorization', `Bearer ${admin.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.perVolunteer.some(v => v.completedCount === 1)).toBe(true);
  });

  it('generates a waste-by-category report', async () => {
    const admin = await createAuthedUser({ name: 'RepAdmin4', email: 'repadmin4@test.com', role: 'admin' });
    const citizen = await createAuthedUser({ name: 'RepCitizen3', email: 'repcitizen3@test.com', role: 'user' });

    await request(app).post('/api/pickups').set('Authorization', `Bearer ${citizen.token}`).send({
      wasteType: 'E-waste', estimatedQuantity: '1kg', pickupAddress: 'Addr',
      preferredDate: '2026-08-01', preferredTime: '09:00'
    });

    const res = await request(app).get('/api/admin/reports/waste').set('Authorization', `Bearer ${admin.token}`);
    expect(res.body.some(w => w._id === 'E-waste')).toBe(true);
  });
});
