const request = require('supertest');
const app = require('./server');

describe('GanaderoApp API Tests', () => {
  let authToken;
  let testAnimalId;

  afterAll((done) => {
    if (app.db) {
      app.db.close(done);
      return;
    }
    done();
  });

  // ==================== TESTS DE AUTENTICACIÓN ====================
  
  describe('POST /api/auth/login', () => {
    it('debe iniciar sesión con credenciales correctas', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'demo@campo.com',
          password: 'demo123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('usuario');
      expect(res.body.usuario.email).toBe('demo@campo.com');

      authToken = res.body.token; // Guardar para otros tests
    });

    it('debe rechazar credenciales incorrectas', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'demo@campo.com',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('debe requerir email y password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/auth/registro', () => {
    it('debe crear un nuevo usuario', async () => {
      const randomEmail = `test${Date.now()}@campo.com`;
      
      const res = await request(app)
        .post('/api/auth/registro')
        .send({
          email: randomEmail,
          password: 'password123',
          nombre_campo: 'Test Campo'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.usuario.email).toBe(randomEmail);
    });

    it('debe rechazar contraseñas cortas', async () => {
      const res = await request(app)
        .post('/api/auth/registro')
        .send({
          email: 'new@campo.com',
          password: '123'
        });

      expect(res.statusCode).toBe(400);
    });
  });

  // ==================== TESTS DE ANIMALES ====================

  describe('GET /api/animales', () => {
    it('debe requerir autenticación', async () => {
      const res = await request(app)
        .get('/api/animales');

      expect(res.statusCode).toBe(401);
    });

    it('debe obtener lista de animales', async () => {
      const res = await request(app)
        .get('/api/animales')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/animales', () => {
    it('debe crear un nuevo animal', async () => {
      const res = await request(app)
        .post('/api/animales')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          caravana: `ARG${Date.now()}`,
          nombre: 'Animal Test',
          raza: 'Aberdeen Angus',
          sexo: 'hembra',
          fecha_nacimiento: '2024-01-01',
          peso_nacimiento: 35,
          potrero: 'Test'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body.nombre).toBe('Animal Test');

      testAnimalId = res.body.id;
    });

    it('debe rechazar sexo inválido', async () => {
      const res = await request(app)
        .post('/api/animales')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          caravana: `ARG${Date.now()}`,
          sexo: 'invalido'
        });

      expect(res.statusCode).toBe(400);
    });

    it('debe requerir caravana', async () => {
      const res = await request(app)
        .post('/api/animales')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nombre: 'Sin Caravana'
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/animales/caravana/:caravana', () => {
    it('debe buscar animal por caravana', async () => {
      const res = await request(app)
        .get('/api/animales/caravana/ARG001234567890')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('caravana');
      expect(res.body).toHaveProperty('pesajes');
      expect(res.body).toHaveProperty('tratamientos');
    });

    it('debe retornar 404 para caravana inexistente', async () => {
      const res = await request(app)
        .get('/api/animales/caravana/INEXISTENTE')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(404);
    });
  });

  // ==================== TESTS DE PESAJES ====================

  describe('POST /api/pesajes', () => {
    it('debe registrar un nuevo pesaje', async () => {
      const res = await request(app)
        .post('/api/pesajes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          animal_id: 1,
          peso: 500,
          fecha: '2025-02-12',
          notas: 'Pesaje de prueba'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body.peso).toBe(500);
    });

    it('debe rechazar peso negativo', async () => {
      const res = await request(app)
        .post('/api/pesajes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          animal_id: 1,
          peso: -100
        });

      expect(res.statusCode).toBe(400);
    });

    it('debe requerir animal_id y peso', async () => {
      const res = await request(app)
        .post('/api/pesajes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(res.statusCode).toBe(400);
    });
  });

  // ==================== TESTS DE TRATAMIENTOS ====================

  describe('POST /api/tratamientos', () => {
    it('debe registrar un nuevo tratamiento', async () => {
      const res = await request(app)
        .post('/api/tratamientos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          animal_id: 1,
          tipo: 'vacuna',
          descripcion: 'Antiaftosa',
          fecha: '2025-02-12',
          proxima_fecha: '2025-08-12'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body.tipo).toBe('vacuna');
    });

    it('debe rechazar tipo inválido', async () => {
      const res = await request(app)
        .post('/api/tratamientos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          animal_id: 1,
          tipo: 'tipo_invalido',
          descripcion: 'Test'
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/tratamientos/pendientes', () => {
    it('debe obtener tratamientos pendientes', async () => {
      const res = await request(app)
        .get('/api/tratamientos/pendientes')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ==================== TESTS DE DASHBOARD ====================

  describe('GET /api/dashboard', () => {
    it('debe obtener estadísticas del dashboard', async () => {
      const res = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('total_animales');
      expect(res.body).toHaveProperty('total_hembras');
      expect(res.body).toHaveProperty('total_machos');
      expect(res.body).toHaveProperty('evolucion_peso');
      expect(Array.isArray(res.body.evolucion_peso)).toBe(true);
    });
  });

  // ==================== TESTS GENERALES ====================

  describe('GET /health', () => {
    it('debe responder con status ok', async () => {
      const res = await request(app).get('/health');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status');
      expect(res.body.status).toBe('ok');
    });
  });

  describe('404 Handler', () => {
    it('debe retornar 404 para rutas inexistentes', async () => {
      const res = await request(app).get('/ruta/inexistente');

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error');
    });
  });
});
