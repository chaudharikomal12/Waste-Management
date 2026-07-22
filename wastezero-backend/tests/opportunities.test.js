const request = require('supertest');
const app = require('../app');
const { connectTestDB, clearTestDB, closeTestDB } = require('./setup');
const { createAuthedUser } = require('./helpers');

beforeAll(async () => await connectTestDB());
afterEach(async () => await clearTestDB());
afterAll(async () => await closeTestDB());

describe('Opportunities - Creation & Role Restriction', () => {
  it('allows an admin to create an opportunity', async () => {
    const admin = await createAuthedUser({ name: 'Admin', email: 'a1@test.com', role: 'admin' });
    const res = await request(app)
      .post('/api/opportunities')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ title: 'Plastic Drive', description: 'Collect plastic waste', requiredSkills: ['Plastic'], duration: '2 hours', location: 'Hyderabad' });

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('open');
    expect(res.body.isDeleted).toBe(false);
    expect(res.body.ngo_id).toBe(admin.user.id);
  });

  it('rejects opportunity creation by a volunteer', async () => {
    const volunteer = await createAuthedUser({ name: 'Vol', email: 'v1@test.com', role: 'volunteer' });
    const res = await request(app)
      .post('/api/opportunities')
      .set('Authorization', `Bearer ${volunteer.token}`)
      .send({ title: 'X', description: 'Y', duration: '1h', location: 'Pune' });
    expect(res.statusCode).toBe(403);
  });

  it('rejects opportunity creation without a token', async () => {
    const res = await request(app).post('/api/opportunities').send({ title: 'X' });
    expect(res.statusCode).toBe(401);
  });
});

describe('Opportunities - Ownership Enforcement (Edit/Delete)', () => {
  it('prevents one admin from editing another admin\'s opportunity', async () => {
    const adminA = await createAuthedUser({ name: 'Admin A', email: 'oa@test.com', role: 'admin' });
    const adminB = await createAuthedUser({ name: 'Admin B', email: 'ob@test.com', role: 'admin' });

    const created = await request(app)
      .post('/api/opportunities')
      .set('Authorization', `Bearer ${adminA.token}`)
      .send({ title: 'Org A Drive', description: 'Desc', duration: '1h', location: 'Delhi' });

    const editRes = await request(app)
      .put(`/api/opportunities/${created.body._id}`)
      .set('Authorization', `Bearer ${adminB.token}`)
      .send({ title: 'Hijacked', description: 'Desc', duration: '1h', location: 'Delhi' });

    expect(editRes.statusCode).toBe(403);
  });

  it('allows the creator to edit their own opportunity', async () => {
    const admin = await createAuthedUser({ name: 'Owner', email: 'owner@test.com', role: 'admin' });
    const created = await request(app)
      .post('/api/opportunities')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ title: 'Original', description: 'Desc', duration: '1h', location: 'Delhi' });

    const editRes = await request(app)
      .put(`/api/opportunities/${created.body._id}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ title: 'Updated Title', description: 'Desc', duration: '1h', location: 'Delhi', status: 'in-progress' });

    expect(editRes.statusCode).toBe(200);
    expect(editRes.body.title).toBe('Updated Title');
    expect(editRes.body.status).toBe('in-progress');
  });

  it('soft-deletes instead of removing the record', async () => {
    const admin = await createAuthedUser({ name: 'Deleter', email: 'del@test.com', role: 'admin' });
    const created = await request(app)
      .post('/api/opportunities')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ title: 'To Delete', description: 'Desc', duration: '1h', location: 'Mumbai' });

    const delRes = await request(app)
      .delete(`/api/opportunities/${created.body._id}`)
      .set('Authorization', `Bearer ${admin.token}`);
    expect(delRes.statusCode).toBe(200);

    const Opportunity = require('../models/Opportunity');
    const stillExists = await Opportunity.findById(created.body._id);
    expect(stillExists).not.toBeNull();
    expect(stillExists.isDeleted).toBe(true);
  });
});

describe('Opportunities - Listing', () => {
  it('volunteers only see open, non-deleted opportunities', async () => {
    const admin = await createAuthedUser({ name: 'Lister', email: 'lister@test.com', role: 'admin' });
    const volunteer = await createAuthedUser({ name: 'Viewer', email: 'viewer@test.com', role: 'volunteer' });

    const open = await request(app).post('/api/opportunities').set('Authorization', `Bearer ${admin.token}`)
      .send({ title: 'Open One', description: 'D', duration: '1h', location: 'Pune' });
    const closed = await request(app).post('/api/opportunities').set('Authorization', `Bearer ${admin.token}`)
      .send({ title: 'Closed One', description: 'D', duration: '1h', location: 'Pune' });
    await request(app).put(`/api/opportunities/${closed.body._id}`).set('Authorization', `Bearer ${admin.token}`)
      .send({ title: 'Closed One', description: 'D', duration: '1h', location: 'Pune', status: 'closed' });

    const res = await request(app).get('/api/opportunities').set('Authorization', `Bearer ${volunteer.token}`);
    const titles = res.body.map(o => o.title);
    expect(titles).toContain('Open One');
    expect(titles).not.toContain('Closed One');
  });
});

describe('Applications - Volunteer apply & Admin manage', () => {
  it('lets a volunteer apply to an open opportunity', async () => {
    const admin = await createAuthedUser({ name: 'A', email: 'app-admin@test.com', role: 'admin' });
    const volunteer = await createAuthedUser({ name: 'V', email: 'app-vol@test.com', role: 'volunteer' });
    const opp = await request(app).post('/api/opportunities').set('Authorization', `Bearer ${admin.token}`)
      .send({ title: 'Apply Test', description: 'D', duration: '1h', location: 'Pune' });

    const res = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${volunteer.token}`)
      .send({ opportunity_id: opp.body._id });

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('pending');
  });

  it('prevents a volunteer from applying twice to the same opportunity', async () => {
    const admin = await createAuthedUser({ name: 'A2', email: 'app-admin2@test.com', role: 'admin' });
    const volunteer = await createAuthedUser({ name: 'V2', email: 'app-vol2@test.com', role: 'volunteer' });
    const opp = await request(app).post('/api/opportunities').set('Authorization', `Bearer ${admin.token}`)
      .send({ title: 'Dup Apply', description: 'D', duration: '1h', location: 'Pune' });

    await request(app).post('/api/applications').set('Authorization', `Bearer ${volunteer.token}`)
      .send({ opportunity_id: opp.body._id });
    const second = await request(app).post('/api/applications').set('Authorization', `Bearer ${volunteer.token}`)
      .send({ opportunity_id: opp.body._id });

    expect(second.statusCode).toBe(409);
  });

  it('prevents a user (non-volunteer) from applying', async () => {
    const admin = await createAuthedUser({ name: 'A3', email: 'app-admin3@test.com', role: 'admin' });
    const citizen = await createAuthedUser({ name: 'C', email: 'app-user3@test.com', role: 'user' });
    const opp = await request(app).post('/api/opportunities').set('Authorization', `Bearer ${admin.token}`)
      .send({ title: 'Role Block', description: 'D', duration: '1h', location: 'Pune' });

    const res = await request(app).post('/api/applications').set('Authorization', `Bearer ${citizen.token}`)
      .send({ opportunity_id: opp.body._id });
    expect(res.statusCode).toBe(403);
  });

  it('lets the owning admin accept an application', async () => {
    const admin = await createAuthedUser({ name: 'A4', email: 'app-admin4@test.com', role: 'admin' });
    const volunteer = await createAuthedUser({ name: 'V4', email: 'app-vol4@test.com', role: 'volunteer' });
    const opp = await request(app).post('/api/opportunities').set('Authorization', `Bearer ${admin.token}`)
      .send({ title: 'Accept Test', description: 'D', duration: '1h', location: 'Pune' });
    const application = await request(app).post('/api/applications').set('Authorization', `Bearer ${volunteer.token}`)
      .send({ opportunity_id: opp.body._id });

    const res = await request(app)
      .put(`/api/applications/${application.body._id}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ status: 'accepted' });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('accepted');
  });
});
