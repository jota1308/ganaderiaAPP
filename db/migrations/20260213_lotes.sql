-- Tabla de lotes
CREATE TABLE IF NOT EXISTS lotes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    ubicacion VARCHAR(200),
    capacidad_maxima INT,
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'cerrado')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE animales
ADD COLUMN IF NOT EXISTS lote_id INT REFERENCES lotes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_animales_lote ON animales(lote_id);

-- Luego de backfill de datos, dejar NOT NULL
-- ALTER TABLE animales ALTER COLUMN lote_id SET NOT NULL;

CREATE TABLE IF NOT EXISTS historial_lotes (
    id SERIAL PRIMARY KEY,
    animal_id INT REFERENCES animales(id) ON DELETE CASCADE,
    lote_anterior_id INT REFERENCES lotes(id),
    lote_nuevo_id INT REFERENCES lotes(id),
    fecha_cambio TIMESTAMP DEFAULT NOW(),
    usuario VARCHAR(100),
    motivo TEXT
);

CREATE INDEX IF NOT EXISTS idx_historial_animal ON historial_lotes(animal_id);
