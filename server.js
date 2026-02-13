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

const obtenerOCrearLoteSinAsignar = (usuarioId, callback) => {
  db.get(
    'SELECT id FROM lotes WHERE usuario_id = ? AND nombre = ? LIMIT 1',
    [usuarioId, 'Sin asignar'],
    (err, lote) => {
      if (err) return callback(err);
      if (lote) return callback(null, lote.id);

      db.run(
        `INSERT INTO lotes (usuario_id, nombre, descripcion, ubicacion, capacidad_maxima, estado)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [usuarioId, 'Sin asignar', 'Lote por defecto para animales sin asignación explícita', 'General', 99999, 'activo'],
        function (insertErr) {
          if (insertErr) return callback(insertErr);
          return callback(null, this.lastID);
        }
      );
    }
  );
};

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
    descripcion TEXT,
    ubicacion TEXT,
    capacidad_maxima INTEGER,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'cerrado')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(usuario_id, nombre),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS historial_lotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id INTEGER REFERENCES animales(id) ON DELETE CASCADE,
    lote_anterior_id INTEGER REFERENCES lotes(id),
    lote_nuevo_id INTEGER REFERENCES lotes(id),
    fecha_cambio DATETIME DEFAULT CURRENT_TIMESTAMP,
    usuario TEXT,
    motivo TEXT
  )`);
  db.run('CREATE INDEX IF NOT EXISTS idx_historial_animal ON historial_lotes(animal_id)');

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

  // Migraciones: lotes y relación con animales
  const columnasLotesEsperadas = [
    ['descripcion', 'TEXT'],
    ['capacidad_maxima', 'INTEGER'],
    ['fecha_creacion', 'DATETIME DEFAULT CURRENT_TIMESTAMP'],
    ["estado", "TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'cerrado'))"],
    ['created_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP'],
    ['updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP'],
  ];

  db.all('PRAGMA table_info(lotes)', [], (_err, columnasLotes = []) => {
    columnasLotesEsperadas.forEach(([nombreColumna, tipo]) => {
      const existe = columnasLotes.some((c) => c.name === nombreColumna);
      if (!existe) {
        db.run(`ALTER TABLE lotes ADD COLUMN ${nombreColumna} ${tipo}`);
      }
    });
  });

  db.run(`CREATE TRIGGER IF NOT EXISTS trg_lotes_updated_at
    AFTER UPDATE ON lotes
    FOR EACH ROW
    BEGIN
      UPDATE lotes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END`);

  // Migración: agregar columna lote_id en animales si no existe
  db.all(`PRAGMA table_info(animales)`, [], (err, columnas = []) => {
    if (err) return;
    const tieneLoteId = columnas.some((col) => col.name === 'lote_id');
    if (!tieneLoteId) {
      db.run('ALTER TABLE animales ADD COLUMN lote_id INTEGER REFERENCES lotes(id)');
    }

    db.run('CREATE INDEX IF NOT EXISTS idx_animales_lote ON animales(lote_id)');

    db.run(`CREATE TRIGGER IF NOT EXISTS trg_animales_lote_no_nulo_insert
      BEFORE INSERT ON animales
      FOR EACH ROW
      WHEN NEW.lote_id IS NULL
      BEGIN
        SELECT RAISE(ABORT, 'Todo animal debe tener lote asignado');
      END`);

    db.run(`CREATE TRIGGER IF NOT EXISTS trg_animales_lote_no_nulo_update
      BEFORE UPDATE OF lote_id ON animales
      FOR EACH ROW
      WHEN NEW.lote_id IS NULL
      BEGIN
        SELECT RAISE(ABORT, 'Todo animal debe tener lote asignado');
      END`);
  });


  db.all('SELECT id FROM usuarios', [], (_eUsers, usuarios = []) => {
    usuarios.forEach((u) => {
      obtenerOCrearLoteSinAsignar(u.id, (_eLote, loteId) => {
        if (!_eLote && loteId) {
          db.run('UPDATE animales SET lote_id = ? WHERE usuario_id = ? AND (lote_id IS NULL OR lote_id = 0)', [loteId, u.id]);
        }
      });
    });
  });

  // Verificar si existe usuario demo
  db.get('SELECT id FROM usuarios WHERE email = ?', ['demo@campo.com'], (err, row) => {
    if (!row) {
      // Crear usuario demo
      const passwordHash = bcrypt.hashSync('demo123', 10);
      db.run(`INSERT INTO usuarios (email, password, nombre_campo) VALUES (?, ?, ?)`,
        ['demo@campo.com', passwordHash, 'Estancia Los Álamos']);

      db.run(`INSERT INTO lotes (usuario_id, nombre, ubicacion, descripcion, capacidad_maxima, estado)
              VALUES (1, 'Lote Demo Norte', 'Sector Norte', 'Lote inicial demo', 50, 'activo')`, function () {
        const loteDemoId = this.lastID;

        // Crear animales demo
        const animalesDemo = [
          ['ARG001234567890', 1, 'Margarita', 'Aberdeen Angus', 'hembra', '2022-03-15', 35, null, null, 'Potrero Norte', 'activo', loteDemoId],
          ['ARG001234567891', 1, 'Tornado', 'Hereford', 'macho', '2021-08-20', 40, null, null, 'Potrero Sur', 'activo', loteDemoId],
          ['ARG001234567892', 1, 'Luna', 'Brangus', 'hembra', '2023-01-10', 32, 'ARG001234567890', null, 'Potrero Norte', 'activo', loteDemoId],
        ];

        animalesDemo.forEach(animal => {
          db.run(`INSERT INTO animales (caravana, usuario_id, nombre, raza, sexo, fecha_nacimiento, peso_nacimiento, madre_caravana, padre_caravana, potrero, estado, lote_id) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, animal);
        });
      });

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

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y password son obligatorios' });
  }

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

  if (!email || !password || !nombre_campo) {
    return res.status(400).json({ error: 'Email, password y nombre_campo son obligatorios' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

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

  if (!caravana) {
    return res.status(400).json({ error: 'La caravana es obligatoria' });
  }

  if (sexo && !['hembra', 'macho'].includes(sexo)) {
    return res.status(400).json({ error: 'Sexo inválido. Debe ser hembra o macho' });
  }

  const insertarAnimal = (loteAsignadoId) => {
    db.run(`INSERT INTO animales (caravana, usuario_id, nombre, raza, sexo, fecha_nacimiento, peso_nacimiento, madre_caravana, padre_caravana, potrero, lote_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [caravana, req.usuarioId, nombre, raza, sexo, fecha_nacimiento, peso_nacimiento, madre_caravana, padre_caravana, potrero, loteAsignadoId],
      function(err) {
        if (err) return res.status(400).json({ error: 'Caravana ya registrada o datos inválidos' });

        db.get('SELECT * FROM animales WHERE id = ?', [this.lastID], (_err, animal) => {
          res.json(animal);
        });
      }
    );
  };

  if (lote_id) {
    return insertarAnimal(lote_id);
  }

  return obtenerOCrearLoteSinAsignar(req.usuarioId, (errLote, loteDefaultId) => {
    if (errLote) return res.status(500).json({ error: errLote.message });
    return insertarAnimal(loteDefaultId);
  });
});

// Actualizar animal
app.put('/api/animales/:id', verificarToken, (req, res) => {
  const { id } = req.params;
  const { nombre, raza, potrero, estado, foto_url, lote_id } = req.body;

  if (!lote_id) {
    return res.status(400).json({ error: 'Todo animal debe tener un lote asignado' });
  }

  db.run(`UPDATE animales SET nombre = ?, raza = ?, potrero = ?, estado = ?, foto_url = ?, lote_id = ? WHERE id = ? AND usuario_id = ?`,
    [nombre, raza, potrero, estado, foto_url || null, lote_id, id, req.usuarioId],
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

  if (!animal_id || peso === undefined || peso === null) {
    return res.status(400).json({ error: 'animal_id y peso son obligatorios' });
  }

  if (Number(peso) <= 0) {
    return res.status(400).json({ error: 'El peso debe ser mayor a 0' });
  }

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

  const tiposValidos = ['vacuna', 'desparasitacion', 'antibiotico', 'vitamina', 'otro'];

  if (!animal_id || !tipo || !descripcion) {
    return res.status(400).json({ error: 'animal_id, tipo y descripcion son obligatorios' });
  }

  if (!tiposValidos.includes(tipo)) {
    return res.status(400).json({ error: 'Tipo de tratamiento inválido' });
  }

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
  db.all(`SELECT l.*, 
            COUNT(a.id) as cantidad_animales,
            COALESCE(l.capacidad_maxima, 0) as capacidad_maxima,
            CASE WHEN COALESCE(l.capacidad_maxima, 0) > 0 
              THEN ROUND((COUNT(a.id) * 100.0) / l.capacidad_maxima, 2)
              ELSE 0
            END as porcentaje_ocupacion
          FROM lotes l
          LEFT JOIN animales a ON a.lote_id = l.id AND a.usuario_id = l.usuario_id AND a.estado = 'activo'
          WHERE l.usuario_id = ?
          GROUP BY l.id
          ORDER BY l.created_at DESC, l.creado_en DESC`,
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
              (SELECT peso FROM pesajes WHERE animal_id = a.id ORDER BY fecha DESC LIMIT 1) as peso_actual,
              (SELECT fecha FROM pesajes WHERE animal_id = a.id ORDER BY fecha DESC LIMIT 1) as fecha_ultimo_peso
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

// Obtener animales de un lote
app.get('/api/lotes/:id/animales', verificarToken, (req, res) => {
  const { id } = req.params;
  db.all(`SELECT a.*, 
            (SELECT peso FROM pesajes WHERE animal_id = a.id ORDER BY fecha DESC LIMIT 1) as peso_actual,
            (SELECT fecha FROM pesajes WHERE animal_id = a.id ORDER BY fecha DESC LIMIT 1) as fecha_ultimo_peso
          FROM animales a
          WHERE a.usuario_id = ? AND a.lote_id = ? AND a.estado = 'activo'
          ORDER BY a.caravana ASC`,
  [req.usuarioId, id],
  (err, animales) => {
    if (err) return res.status(500).json({ error: err.message });
    return res.json(animales || []);
  });
});

// Exportar lote a Excel (o CSV si no hay dependencia xlsx)
app.get('/api/lotes/:id/export/excel', verificarToken, (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM lotes WHERE id = ? AND usuario_id = ?', [id, req.usuarioId], (errLote, lote) => {
    if (errLote) return res.status(500).json({ error: errLote.message });
    if (!lote) return res.status(404).json({ error: 'Lote no encontrado' });

    db.all(`SELECT a.*, 
              (SELECT peso FROM pesajes WHERE animal_id = a.id ORDER BY fecha DESC LIMIT 1) as peso_actual,
              (SELECT fecha FROM pesajes WHERE animal_id = a.id ORDER BY fecha DESC LIMIT 1) as fecha_ultimo_peso
            FROM animales a
            WHERE a.usuario_id = ? AND a.lote_id = ? AND a.estado = 'activo'`,
      [req.usuarioId, id],
      (errAnimales, animales = []) => {
        if (errAnimales) return res.status(500).json({ error: errAnimales.message });

        const rows = animales.map((animal) => ({
          'N° Caravana Visual': animal.caravana,
          'N° Chip Electrónico': animal.caravana,
          'Categoría': animal.sexo === 'macho' ? 'Novillo' : 'Vaquillona',
          'Raza': animal.raza || 'N/A',
          'Peso (kg)': animal.peso_actual || 'N/A',
          'Fecha Último Pesaje': animal.fecha_ultimo_peso || '',
          'Establecimiento': 'Establecimiento Demo',
          Lote: lote.nombre
        }));

        let XLSX;
        try {
          XLSX = require('xlsx');
        } catch (_errorXlsx) {
          const csvHeaders = Object.keys(rows[0] || {
            'N° Caravana Visual': '', 'N° Chip Electrónico': '', Categoría: '', Raza: '', 'Peso (kg)': '', 'Fecha Último Pesaje': '', Establecimiento: '', Lote: ''
          });
          const csvLines = [csvHeaders.join(',')].concat(rows.map((row) => csvHeaders.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')));
          res.setHeader('Content-Type', 'text/csv; charset=utf-8');
          res.setHeader('Content-Disposition', `attachment; filename=lote_${lote.nombre.replace(/\s+/g, '_')}.csv`);
          return res.send(csvLines.join('\n'));
        }

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'SENASA');
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=lote_${lote.nombre.replace(/\s+/g, '_')}.xlsx`);
        return res.send(buffer);
      });
  });
});

// Crear lote
app.post('/api/lotes', verificarToken, (req, res) => {
  const { nombre, ubicacion, descripcion, capacidad_maxima, estado } = req.body;
  if (!nombre || !nombre.trim()) return res.status(400).json({ error: 'El nombre es obligatorio' });

  db.run(
    `INSERT INTO lotes (usuario_id, nombre, ubicacion, descripcion, capacidad_maxima, estado)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [req.usuarioId, nombre.trim(), ubicacion || null, descripcion || null, capacidad_maxima || null, estado || 'activo'],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      db.get('SELECT * FROM lotes WHERE id = ?', [this.lastID], (_errLote, lote) => res.json(lote));
    }
  );
});

// Asignar/cambiar animal de lote + historial
app.put('/api/animales/:animalId/lote', verificarToken, (req, res) => {
  const { animalId } = req.params;
  const { lote_id, motivo } = req.body;

  if (!lote_id) {
    return res.status(400).json({ error: 'lote_id es obligatorio' });
  }

  db.get('SELECT * FROM animales WHERE id = ? AND usuario_id = ?', [animalId, req.usuarioId], (errAnimal, animal) => {
    if (errAnimal) return res.status(500).json({ error: errAnimal.message });
    if (!animal) return res.status(404).json({ error: 'Animal no encontrado' });

    db.get('SELECT * FROM lotes WHERE id = ? AND usuario_id = ?', [lote_id, req.usuarioId], (errLote, lote) => {
      if (errLote) return res.status(500).json({ error: errLote.message });
      if (!lote) return res.status(404).json({ error: 'Lote no encontrado' });

      db.run('UPDATE animales SET lote_id = ? WHERE id = ? AND usuario_id = ?', [lote_id, animalId, req.usuarioId], function (errUpdate) {
        if (errUpdate) return res.status(500).json({ error: errUpdate.message });

        db.run(`INSERT INTO historial_lotes (animal_id, lote_anterior_id, lote_nuevo_id, usuario, motivo)
                VALUES (?, ?, ?, ?, ?)`,
          [animalId, animal.lote_id || null, lote_id, String(req.usuarioId), motivo || 'Cambio manual de lote'],
          (errHist) => {
            if (errHist) return res.status(500).json({ error: errHist.message });
            return res.json({ mensaje: 'Lote asignado correctamente' });
          }
        );
      });
    });
  });
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

app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log('');
    console.log('🚀 Backend corriendo en http://localhost:' + PORT);
    console.log('📊 Usuario demo: demo@campo.com / demo123');
    console.log('💾 Base de datos: ' + dbPath);
    console.log('');
  });
}

module.exports = app;
module.exports.db = db;
