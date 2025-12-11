const request = require('supertest');
const app = require('../src/server');

describe('API Endpoints', () => {
  it('GET /health - deve retornar status OK', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toBe('OK');
  });

  it('POST /api/leads/submit - deve processar lead básico', async () => {
    const leadData = {
      email: 'test@example.com',
      name: 'User Test',
      phone: '+5511999999999',
      source: 'test'
    };

    const res = await request(app)
      .post('/api/leads/submit')
      .send(leadData);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });
});