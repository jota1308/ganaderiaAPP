require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_THIS_SECRET_IN_PRODUCTION';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Crear directorio de base de datos si no existe
const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Base de datos SQLite PERSISTENTE (no in-memory)
const dbPath = process.env.DB_PATH || path.join(dbDir, 'ganadero.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error conectando a la base de datos:', err);
    process.exit(1);
  }
  console.log(`✅ Base de datos conectada: ${dbPath}`);
});

// Inicializar base de datos
db.serialize(() => {
  // Tabla de usuarios/campos
  db.run(`CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    nombre_campo TEXT,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Tabla de animales
  db.run(`CREATE TABLE IF NOT EXISTS animales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    caravana TEXT UNIQUE NOT NULL,
    usuario_id INTEGER,
    nombre TEXT,
    raza TEXT,
    sexo TEXT,
    fecha_nacimiento DATE,
    peso_nacimiento REAL,
    madre_caravana TEXT,
    padre_caravana TEXT,
    potrero TEXT,
    estado TEXT DEFAULT 'activo',
    foto_url TEXT,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
  )`);

  // Tabla de pesajes
  db.run(`CREATE TABLE IF NOT EXISTS pesajes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id INTEGER,
    peso REAL,
    fecha DATE,
    notas TEXT,
    FOREIGN KEY (animal_id) REFERENCES animales(id)
  )`);

  // Tabla de tratamientos veterinarios
  db.run(`CREATE TABLE IF NOT EXISTS tratamientos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id INTEGER,
    tipo TEXT,
    descripcion TEXT,
    fecha DATE,
    proxima_fecha DATE,
    veterinario TEXT,
    costo REAL,
    FOREIGN KEY (animal_id) REFERENCES animales(id)
  )`);

  // Tabla de eventos reproductivos
  db.run(`CREATE TABLE IF NOT EXISTS eventos_reproductivos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id INTEGER,
    tipo TEXT,
    fecha DATE,
    notas TEXT,
    toro_caravana TEXT,
    FOREIGN KEY (animal_id) REFERENCES animales(id)
  )`);

  // Tabla de lotes
  db.run(`CREATE TABLE IF NOT EXISTS lotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    ubicacion TEXT,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
  )`);

  // Historial de búsquedas por caravana
  db.run(`CREATE TABLE IF NOT EXISTS busquedas_recientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    animal_id INTEGER,
    caravana TEXT NOT NULL,
    buscado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (animal_id) REFERENCES animales(id)
  )`);

  // Migración: agregar columna lote_id en animales si no existe
  db.all(`PRAGMA table_info(animales)`, [], (err, columnas = []) => {
    if (err) return;
    const tieneLoteId = columnas.some((col) => col.name === 'lote_id');
    if (!tieneLoteId) {
      db.run('ALTER TABLE animales ADD COLUMN lote_id INTEGER REFERENCES lotes(id)');
    }
  });

  // Verificar si existe usuario demo
  db.get('SELECT id FROM usuarios WHERE email = ?', ['demo@campo.com'], (err, row) => {
    if (!row) {
      // Crear usuario demo
      const passwordHash = bcrypt.hashSync('demo123', 10);
      db.run(`INSERT INTO usuarios (email, password, nombre_campo) VALUES (?, ?, ?)`,
        ['demo@campo.com', passwordHash, 'Estancia Los Álamos']);

      // Crear animales demo
      const animalesDemo = [
        ['ARG001234567890', 1, 'Margarita', 'Aberdeen Angus', 'hembra', '2022-03-15', 35, null, null, 'Potrero Norte', 'activo'],
        ['ARG001234567891', 1, 'Tornado', 'Hereford', 'macho', '2021-08-20', 40, null, null, 'Potrero Sur', 'activo'],
        ['ARG001234567892', 1, 'Luna', 'Brangus', 'hembra', '2023-01-10', 32, 'ARG001234567890', null, 'Potrero Norte', 'activo'],
      ];

      animalesDemo.forEach(animal => {
        db.run(`INSERT INTO animales (caravana, usuario_id, nombre, raza, sexo, fecha_nacimiento, peso_nacimiento, madre_caravana, padre_caravana, potrero, estado) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, animal);
      });

      db.run(`INSERT INTO lotes (usuario_id, nombre, ubicacion) VALUES (1, 'Lote Demo Norte', 'Sector Norte')`);

      // Crear pesajes demo
      db.run(`INSERT INTO pesajes (animal_id, peso, fecha, notas) VALUES (1, 450, '2024-12-01', 'Peso estable')`);
      db.run(`INSERT INTO pesajes (animal_id, peso, fecha, notas) VALUES (1, 465, '2025-01-15', 'Ganancia 15kg en 45 días')`);
      db.run(`INSERT INTO pesajes (animal_id, peso, fecha, notas) VALUES (2, 620, '2024-12-01', 'Toro en buen estado')`);
      db.run(`INSERT INTO pesajes (animal_id, peso, fecha, notas) VALUES (3, 180, '2025-01-20', 'Ternera creciendo bien')`);

      // Crear tratamientos demo
      db.run(`INSERT INTO tratamientos (animal_id, tipo, descripcion, fecha, proxima_fecha, veterinario) 
              VALUES (1, 'vacuna', 'Antiaftosa', '2025-01-10', '2025-07-10', 'Dr. Martínez')`);
      db.run(`INSERT INTO tratamientos (animal_id, tipo, descripcion, fecha, proxima_fecha) 
              VALUES (2, 'desparasitacion', 'Ivermectina', '2024-12-15', '2025-03-15')`);

      console.log('✅ Datos demo creados');
    }
  });
});

// Middleware de autenticación
const verificarToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No autorizado' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuarioId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

// ==================== RUTAS DE AUTENTICACIÓN ====================

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  db.get('SELECT * FROM usuarios WHERE email = ?', [email], (err, usuario) => {
    if (err || !usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (!bcrypt.compareSync(password, usuario.password)) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign({ id: usuario.id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({
      token,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre_campo: usuario.nombre_campo
      }
    });
  });
});

// Registro
app.post('/api/auth/registro', (req, res) => {
  const { email, password, nombre_campo } = req.body;
  const passwordHash = bcrypt.hashSync(password, 10);

  db.run('INSERT INTO usuarios (email, password, nombre_campo) VALUES (?, ?, ?)',
    [email, passwordHash, nombre_campo],
    function(err) {
      if (err) {
        return res.status(400).json({ error: 'Email ya registrado' });
      }

      const token = jwt.sign({ id: this.lastID }, JWT_SECRET, { expiresIn: '30d' });
      res.json({
        token,
        usuario: { id: this.lastID, email, nombre_campo }
      });
    }
  );
});

// ==================== RUTAS DE ANIMALES ====================

// Obtener todos los animales del usuario
app.get('/api/animales', verificarToken, (req, res) => {
  db.all(`SELECT a.*, 
          (SELECT peso FROM pesajes WHERE animal_id = a.id ORDER BY fecha DESC LIMIT 1) as peso_actual,
          (SELECT fecha FROM pesajes WHERE animal_id = a.id ORDER BY fecha DESC LIMIT 1) as fecha_ultimo_peso
          FROM animales a 
          WHERE a.usuario_id = ? AND a.estado = 'activo'
          ORDER BY a.creado_en DESC`,
    [req.usuarioId],
    (err, animales) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(animales);
    }
  );
});

// Buscar animal por caravana (escaneo)
app.get('/api/animales/caravana/:caravana', verificarToken, (req, res) => {
  const { caravana } = req.params;

  db.get(`SELECT a.*,
          (SELECT peso FROM pesajes WHERE animal_id = a.id ORDER BY fecha DESC LIMIT 1) as peso_actual,
          (SELECT fecha FROM pesajes WHERE animal_id = a.id ORDER BY fecha DESC LIMIT 1) as fecha_ultimo_peso
          FROM animales a 
          WHERE a.caravana = ? AND a.usuario_id = ?`,
    [caravana, req.usuarioId],
    (err, animal) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!animal) return res.status(404).json({ error: 'Animal no encontrado' });

      db.run('INSERT INTO busquedas_recientes (usuario_id, animal_id, caravana) VALUES (?, ?, ?)', [req.usuarioId, animal.id, animal.caravana]);

      // Obtener historial completo
      db.all('SELECT * FROM pesajes WHERE animal_id = ? ORDER BY fecha DESC', [animal.id], (err, pesajes) => {
        db.all('SELECT * FROM tratamientos WHERE animal_id = ? ORDER BY fecha DESC', [animal.id], (err2, tratamientos) => {
          db.all('SELECT * FROM eventos_reproductivos WHERE animal_id = ? ORDER BY fecha DESC', [animal.id], (err3, eventos) => {
            res.json({
              ...animal,
              pesajes: pesajes || [],
              tratamientos: tratamientos || [],
              eventos_reproductivos: eventos || []
            });
          });
        });
      });
    }
  );
});

// Obtener detalle de un animal
app.get('/api/animales/:id', verificarToken, (req, res) => {
  const { id } = req.params;
  db.get(`SELECT a.*,
          (SELECT peso FROM pesajes WHERE animal_id = a.id ORDER BY fecha DESC LIMIT 1) as peso_actual,
          (SELECT fecha FROM pesajes WHERE animal_id = a.id ORDER BY fecha DESC LIMIT 1) as fecha_ultimo_peso
          FROM animales a
          WHERE a.id = ? AND a.usuario_id = ?`,
    [id, req.usuarioId],
    (err, animal) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!animal) return res.status(404).json({ error: 'Animal no encontrado' });

      db.all('SELECT * FROM pesajes WHERE animal_id = ? ORDER BY fecha DESC', [animal.id], (_errPesajes, pesajes) => {
        db.all('SELECT * FROM tratamientos WHERE animal_id = ? ORDER BY fecha DESC', [animal.id], (_errTrat, tratamientos) => {
          db.all('SELECT * FROM eventos_reproductivos WHERE animal_id = ? ORDER BY fecha DESC', [animal.id], (_errEvent, eventos) => {
            res.json({
              ...animal,
              pesajes: pesajes || [],
              tratamientos: tratamientos || [],
              eventos_reproductivos: eventos || []
            });
          });
        });
      });
    }
  );
});

// Crear nuevo animal
app.post('/api/animales', verificarToken, (req, res) => {
  const { caravana, nombre, raza, sexo, fecha_nacimiento, peso_nacimiento, madre_caravana, padre_caravana, potrero, lote_id } = req.body;

  db.run(`INSERT INTO animales (caravana, usuario_id, nombre, raza, sexo, fecha_nacimiento, peso_nacimiento, madre_caravana, padre_caravana, potrero, lote_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [caravana, req.usuarioId, nombre, raza, sexo, fecha_nacimiento, peso_nacimiento, madre_caravana, padre_caravana, potrero, lote_id || null],
    function(err) {
      if (err) return res.status(400).json({ error: 'Caravana ya registrada o datos inválidos' });
      
      db.get('SELECT * FROM animales WHERE id = ?', [this.lastID], (err, animal) => {
        res.json(animal);
      });
    }
  );
});

// Actualizar animal
app.put('/api/animales/:id', verificarToken, (req, res) => {
  const { id } = req.params;
  const { nombre, raza, potrero, estado, foto_url, lote_id } = req.body;

  db.run(`UPDATE animales SET nombre = ?, raza = ?, potrero = ?, estado = ?, foto_url = ?, lote_id = ? WHERE id = ? AND usuario_id = ?`,
    [nombre, raza, potrero, estado, foto_url || null, lote_id || null, id, req.usuarioId],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Animal no encontrado' });
      res.json({ mensaje: 'Animal actualizado' });
    }
  );
});

// ==================== RUTAS DE PESAJES ====================

// Registrar nuevo pesaje
app.post('/api/pesajes', verificarToken, (req, res) => {
  const { animal_id, peso, fecha, notas } = req.body;

  // Verificar que el animal pertenece al usuario
  db.get('SELECT * FROM animales WHERE id = ? AND usuario_id = ?', [animal_id, req.usuarioId], (err, animal) => {
    if (!animal) return res.status(404).json({ error: 'Animal no encontrado' });

    db.run('INSERT INTO pesajes (animal_id, peso, fecha, notas) VALUES (?, ?, ?, ?)',
      [animal_id, peso, fecha || new Date().toISOString().split('T')[0], notas],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        db.get('SELECT * FROM pesajes WHERE id = ?', [this.lastID], (err, pesaje) => {
          res.json(pesaje);
        });
      }
    );
  });
});

// ==================== RUTAS DE TRATAMIENTOS ====================

// Registrar tratamiento
app.post('/api/tratamientos', verificarToken, (req, res) => {
  const { animal_id, tipo, descripcion, fecha, proxima_fecha, veterinario, costo } = req.body;

  db.get('SELECT * FROM animales WHERE id = ? AND usuario_id = ?', [animal_id, req.usuarioId], (err, animal) => {
    if (!animal) return res.status(404).json({ error: 'Animal no encontrado' });

    db.run('INSERT INTO tratamientos (animal_id, tipo, descripcion, fecha, proxima_fecha, veterinario, costo) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [animal_id, tipo, descripcion, fecha, proxima_fecha, veterinario, costo],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        db.get('SELECT * FROM tratamientos WHERE id = ?', [this.lastID], (err, tratamiento) => {
          res.json(tratamiento);
        });
      }
    );
  });
});

// Obtener tratamientos pendientes
app.get('/api/tratamientos/pendientes', verificarToken, (req, res) => {
  db.all(`SELECT t.*, a.caravana, a.nombre as animal_nombre
          FROM tratamientos t
          JOIN animales a ON t.animal_id = a.id
          WHERE a.usuario_id = ? AND t.proxima_fecha <= date('now', '+30 days')
          ORDER BY t.proxima_fecha ASC`,
    [req.usuarioId],
    (err, tratamientos) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(tratamientos);
    }
  );
});

// Obtener todos los tratamientos
app.get('/api/tratamientos', verificarToken, (req, res) => {
  db.all(`SELECT t.*, a.caravana, a.nombre as animal_nombre
          FROM tratamientos t
          JOIN animales a ON t.animal_id = a.id
          WHERE a.usuario_id = ?
          ORDER BY t.fecha DESC`,
    [req.usuarioId],
    (err, tratamientos) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(tratamientos || []);
    }
  );
});

// Obtener búsquedas recientes
app.get('/api/busquedas-recientes', verificarToken, (req, res) => {
  db.all(`SELECT b.id, b.animal_id, b.caravana, b.buscado_en,
            a.nombre as animal_nombre
          FROM busquedas_recientes b
          LEFT JOIN animales a ON b.animal_id = a.id
          WHERE b.usuario_id = ?
          ORDER BY b.buscado_en DESC
          LIMIT 20`,
    [req.usuarioId],
    (err, busquedas) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(busquedas || []);
    }
  );
});

// Obtener lotes del usuario
app.get('/api/lotes', verificarToken, (req, res) => {
  db.all(`SELECT l.*, COUNT(a.id) as cantidad_animales
          FROM lotes l
          LEFT JOIN animales a ON a.lote_id = l.id AND a.usuario_id = l.usuario_id AND a.estado = 'activo'
          WHERE l.usuario_id = ?
          GROUP BY l.id
          ORDER BY l.creado_en DESC`,
    [req.usuarioId],
    (err, lotes) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(lotes || []);
    }
  );
});

// Obtener detalle de un lote
app.get('/api/lotes/:id', verificarToken, (req, res) => {
  const { id } = req.params;
  db.get(`SELECT l.*, COUNT(a.id) as cantidad_animales
          FROM lotes l
          LEFT JOIN animales a ON a.lote_id = l.id AND a.usuario_id = l.usuario_id AND a.estado = 'activo'
          WHERE l.id = ? AND l.usuario_id = ?
          GROUP BY l.id`,
    [id, req.usuarioId],
    (err, lote) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!lote) return res.status(404).json({ error: 'Lote no encontrado' });

      db.all(`SELECT a.*,
              (SELECT peso FROM pesajes WHERE animal_id = a.id ORDER BY fecha DESC LIMIT 1) as peso_actual
              FROM animales a
              WHERE a.usuario_id = ? AND a.lote_id = ? AND a.estado = 'activo'
              ORDER BY a.creado_en DESC`,
        [req.usuarioId, id],
        (_errAnimales, animales) => {
          res.json({
            ...lote,
            animales: animales || []
          });
        }
      );
    }
  );
});

// Crear lote
app.post('/api/lotes', verificarToken, (req, res) => {
  const { nombre, ubicacion } = req.body;
  if (!nombre || !nombre.trim()) return res.status(400).json({ error: 'El nombre es obligatorio' });

  db.run('INSERT INTO lotes (usuario_id, nombre, ubicacion) VALUES (?, ?, ?)',
    [req.usuarioId, nombre.trim(), ubicacion || null],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      db.get('SELECT * FROM lotes WHERE id = ?', [this.lastID], (_errLote, lote) => res.json(lote));
    }
  );
});

// ==================== RUTAS DE EVENTOS REPRODUCTIVOS ====================

app.post('/api/eventos-reproductivos', verificarToken, (req, res) => {
  const { animal_id, tipo, fecha, notas, toro_caravana } = req.body;

  db.get('SELECT * FROM animales WHERE id = ? AND usuario_id = ?', [animal_id, req.usuarioId], (err, animal) => {
    if (!animal) return res.status(404).json({ error: 'Animal no encontrado' });

    db.run('INSERT INTO eventos_reproductivos (animal_id, tipo, fecha, notas, toro_caravana) VALUES (?, ?, ?, ?, ?)',
      [animal_id, tipo, fecha, notas, toro_caravana],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        db.get('SELECT * FROM eventos_reproductivos WHERE id = ?', [this.lastID], (err, evento) => {
          res.json(evento);
        });
      }
    );
  });
});

// ==================== DASHBOARD / ESTADÍSTICAS ====================

app.get('/api/dashboard', verificarToken, (req, res) => {
  db.get(`SELECT 
            COUNT(*) as total_animales,
            SUM(CASE WHEN sexo = 'hembra' THEN 1 ELSE 0 END) as total_hembras,
            SUM(CASE WHEN sexo = 'macho' THEN 1 ELSE 0 END) as total_machos
          FROM animales WHERE usuario_id = ? AND estado = 'activo'`,
    [req.usuarioId],
    (err, stats) => {
      db.all(`SELECT DATE(fecha) as fecha, AVG(peso) as peso_promedio
              FROM pesajes p
              JOIN animales a ON p.animal_id = a.id
              WHERE a.usuario_id = ?
              GROUP BY DATE(fecha)
              ORDER BY fecha DESC LIMIT 30`,
        [req.usuarioId],
        (err2, pesajes) => {
          res.json({
            ...stats,
            evolucion_peso: pesajes
          });
        }
      );
    }
  );
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('');
  console.log('🚀 Backend corriendo en http://localhost:' + PORT);
  console.log('📊 Usuario demo: demo@campo.com / demo123');
  console.log('💾 Base de datos: ' + dbPath);
  console.log('');
});
