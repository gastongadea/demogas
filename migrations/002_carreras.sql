CREATE TABLE IF NOT EXISTS carreras (
  id SERIAL PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('mentor', 'alumno')),
  nombre TEXT NOT NULL,
  orden INTEGER NOT NULL DEFAULT 0,
  UNIQUE (tipo, nombre)
);

CREATE INDEX IF NOT EXISTS carreras_tipo_orden_idx ON carreras (tipo, orden);
