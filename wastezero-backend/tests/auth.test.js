const request = require('supertest');
const app = require('../app');
const { connectTestDB, clearTestDB, closeTestDB } = require('./setup');

beforeAll(async () => await connectTestDB());
afterEach(async () => await clearTestDB());
afterAll(async () => await closeTestDB());

describe('Auth - Registration', () => {
  it('registers a new user successfully', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'user@test.com',
      password: 'password123',
      role: 'user',
      location: 'Hyderabad'
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('userId');
  });

  it('registers a volunteer and an admin', async () => {
    const volunteer = await request(app).post('/api/auth/register').send({
      name: 'Vol One', email: 'vol@test.com', password: 'password123', role: 'volunteer'
    });
    const admin = await request(app).post('/api/auth/register').send({
      name: 'Admin One', email: 'admin@test.com', password: 'password123', role: 'admin'
    });
    expect(volunteer.statusCode).toBe(201);
    expect(admin.statusCode).toBe(201);
  });

  it('rejects registration with missing required fields', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'incomplete@test.com' });
    expect(res.statusCode).toBe(400);
  });

  it('rejects duplicate email registration', async () => {
    const payload = { name: 'Dup', email: 'dup@test.com', password: 'password123', role: 'user' };
    await request(app).post('/api/auth/register').send(payload);
    const res = await request(app).post('/api/auth/register').send(payload);
    expect(res.statusCode).toBe(409);
  });

  it('stores the password hashed, not in plaintext', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Hash Check', email: 'hash@test.com', password: 'plaintextpw', role: 'user'
    });
    const User = require('../models/User');
    const user = await User.findOne({ email: 'hash@test.com' });
    expect(user.password).not.toBe('plaintextpw');
    expect(user.password.length).toBeGreaterThan(20); // bcrypt hashes are long
  });
});

describe('Auth - Login', () => {
  const credentials = { name: 'Login User', email: 'login@test.com', password: 'password123', role: 'user' };

  beforeEach(async () => {
    await request(app).post('/api/auth/register').send(credentials);
  });

  it('logs in with correct credentials and returns a token + role', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: credentials.email, password: credentials.password
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.role).toBe('user');
  });

  it('rejects login with wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: credentials.email, password: 'wrongpassword'
    });
    expect(res.statusCode).toBe(401);
  });

  it('rejects login for non-existent email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@test.com', password: 'whatever'
    });
    expect(res.statusCode).toBe(401);
  });

  it('rejects login for a suspended account', async () => {
    const User = require('../models/User');
    await User.updateOne({ email: credentials.email }, { isSuspended: true });
    const res = await request(app).post('/api/auth/login').send({
      email: credentials.email, password: credentials.password
    });
    expect(res.statusCode).toBe(403);
  });
});
