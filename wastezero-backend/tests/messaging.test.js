const request = require('supertest');
const app = require('../app');
const { connectTestDB, clearTestDB, closeTestDB } = require('./setup');
const { createAuthedUser } = require('./helpers');

beforeAll(async () => await connectTestDB());
afterEach(async () => await clearTestDB());
afterAll(async () => await closeTestDB());

describe('Messaging System', () => {
  it('sends a message and it appears in the conversation history', async () => {
    const a = await createAuthedUser({ name: 'Sender', email: 'sender@test.com', role: 'user' });
    const b = await createAuthedUser({ name: 'Receiver', email: 'receiver@test.com', role: 'volunteer' });

    const sendRes = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${a.token}`)
      .send({ receiverId: b.user.id, content: 'Hi, when can you pick up?' });

    expect(sendRes.statusCode).toBe(201);
    expect(sendRes.body.content).toBe('Hi, when can you pick up?');

    const convo = await request(app)
      .get(`/api/messages/${b.user.id}`)
      .set('Authorization', `Bearer ${a.token}`);

    expect(convo.statusCode).toBe(200);
    expect(convo.body.length).toBe(1);
  });

  it('sending a message creates a notification for the receiver', async () => {
    const a = await createAuthedUser({ name: 'Sender2', email: 'sender2@test.com', role: 'user' });
    const b = await createAuthedUser({ name: 'Receiver2', email: 'receiver2@test.com', role: 'volunteer' });

    await request(app).post('/api/messages').set('Authorization', `Bearer ${a.token}`)
      .send({ receiverId: b.user.id, content: 'Test message' });

    const notifs = await request(app).get('/api/notifications').set('Authorization', `Bearer ${b.token}`);
    expect(notifs.body.some(n => n.type === 'message')).toBe(true);
  });

  it('rejects sending a message without auth', async () => {
    const res = await request(app).post('/api/messages').send({ receiverId: 'x', content: 'y' });
    expect(res.statusCode).toBe(401);
  });
});

describe('Notification System', () => {
  it('application accept/reject triggers a notification to the volunteer', async () => {
    const admin = await createAuthedUser({ name: 'NA', email: 'na@test.com', role: 'admin' });
    const volunteer = await createAuthedUser({ name: 'NV', email: 'nv@test.com', role: 'volunteer' });

    const opp = await request(app).post('/api/opportunities').set('Authorization', `Bearer ${admin.token}`)
      .send({ title: 'Notify Test', description: 'D', duration: '1h', location: 'Nashik' });
    const application = await request(app).post('/api/applications').set('Authorization', `Bearer ${volunteer.token}`)
      .send({ opportunity_id: opp.body._id });

    await request(app).put(`/api/applications/${application.body._id}`).set('Authorization', `Bearer ${admin.token}`)
      .send({ status: 'accepted' });

    const notifs = await request(app).get('/api/notifications').set('Authorization', `Bearer ${volunteer.token}`);
    expect(notifs.body.some(n => n.type === 'application')).toBe(true);
  });

  it('creating an opportunity notifies volunteers whose skills/location match', async () => {
    const admin = await createAuthedUser({ name: 'NA2', email: 'na2@test.com', role: 'admin' });
    const matchingVolunteer = await createAuthedUser({
      name: 'Matchy', email: 'matchy@test.com', role: 'volunteer', location: 'Nashik', skills: ['Plastic']
    });

    await request(app).post('/api/opportunities').set('Authorization', `Bearer ${admin.token}`)
      .send({ title: 'Plastic Cleanup', description: 'D', requiredSkills: ['Plastic'], duration: '1h', location: 'Nashik' });

    const notifs = await request(app).get('/api/notifications').set('Authorization', `Bearer ${matchingVolunteer.token}`);
    expect(notifs.body.some(n => n.type === 'opportunity')).toBe(true);
  });

  it('marks a notification as read', async () => {
    const a = await createAuthedUser({ name: 'RA', email: 'ra@test.com', role: 'user' });
    const b = await createAuthedUser({ name: 'RB', email: 'rb@test.com', role: 'volunteer' });
    await request(app).post('/api/messages').set('Authorization', `Bearer ${a.token}`)
      .send({ receiverId: b.user.id, content: 'hello' });

    const notifs = await request(app).get('/api/notifications').set('Authorization', `Bearer ${b.token}`);
    const notifId = notifs.body[0]._id;

    const readRes = await request(app).put(`/api/notifications/${notifId}/read`).set('Authorization', `Bearer ${b.token}`);
    expect(readRes.statusCode).toBe(200);
  });
});
