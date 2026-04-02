const request = require('supertest');
const app = require('../../../server').app; // need to export app from server
const mongoose = require('mongoose');
const User = require('../../../models/User');

describe('Auth API', () => {
  beforeAll(async () => {
    // Connect to test DB
    await mongoose.connect(process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/vibe_test');
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
    });

    it('should not register with existing email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});