const request = require('supertest');
const app = require('../app');

// Registers + logs in a user, returns { token, user }
async function createAuthedUser({ name, email, password = 'password123', role, location = '', skills = [] }) {
  await request(app).post('/api/auth/register').send({ name, email, password, role, location, skills });
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return { token: res.body.token, user: res.body.user };
}

module.exports = { createAuthedUser };
