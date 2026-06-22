import React, { useCallback, useEffect, useState } from 'react';

function getApiBase() {
  const fromEnv = process.env.REACT_APP_BACKEND_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  return 'http://localhost:3001';
}

export function PasswordModal({ onClose, onSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/admin/new-tutores`, {
        headers: { 'x-admin-password': password },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Contraseña incorrecta');
        return;
      }
      onSuccess(password, data);
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div className="admin-modal admin-modal--small" onClick={(e) => e.stopPropagation()}>
        <h2>Administración</h2>
        <p className="admin-muted">Ingresá la contraseña para continuar.</p>
        <form onSubmit={handleSubmit} className="admin-form">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            autoFocus
          />
          {error && <p className="admin-error">{error}</p>}
          <div className="admin-actions">
            <button type="button" className="admin-btn admin-btn--secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="admin-btn admin-btn--primary" disabled={loading}>
              {loading ? 'Verificando...' : 'Ingresar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AdminPanel({ password, initialPreview, onClose, onTutoresUpdated }) {
  const [preview, setPreview] = useState(initialPreview);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadPreview = useCallback(async () => {
    setLoadingPreview(true);
    setError('');
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/admin/new-tutores`, {
        headers: { 'x-admin-password': password },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo leer la planilla');
        return;
      }
      setPreview(data);
    } catch {
      setError('Error de conexión con el servidor.');
    } finally {
      setLoadingPreview(false);
    }
  }, [password]);

  useEffect(() => {
    if (!initialPreview) {
      loadPreview();
    }
  }, [initialPreview, loadPreview]);

  const handleImport = async () => {
    setImporting(true);
    setMessage('');
    setError('');
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/admin/import-new-tutores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.details || data.error || 'Error al importar');
        return;
      }
      setMessage(
        data.inserted > 0
          ? `Se importaron ${data.inserted} tutor(es) nuevo(s).`
          : 'No había tutores nuevos para importar.'
      );
      await loadPreview();
      if (data.inserted > 0 && onTutoresUpdated) {
        onTutoresUpdated();
      }
    } catch {
      setError('Error de conexión con el servidor.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h2>Panel de administración</h2>
          <button type="button" className="admin-close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        <section className="admin-section">
          <h3>Importar tutores desde Google Sheets</h3>
          <p className="admin-muted">
            Lee la hoja <strong>Graduados</strong> y detecta filas que aún no están en la base de datos.
          </p>

          {loadingPreview && <p>Cargando planilla...</p>}

          {!loadingPreview && preview && (
            <div className="admin-stats">
              <span>{preview.sheetRows} filas en planilla</span>
              <span>{preview.newCount} nuevos</span>
              <span>{preview.inSheet - preview.newCount} ya en BD</span>
            </div>
          )}

          {!loadingPreview && preview?.newCount > 0 && (
            <ul className="admin-new-list">
              {preview.newTutors.map((t) => (
                <li key={`${t.nombre}-${t.apellido}-${t.dni || ''}`}>
                  <strong>{t.nombre} {t.apellido}</strong>
                  {t.carrera && <span> — {t.carrera}</span>}
                </li>
              ))}
            </ul>
          )}

          {!loadingPreview && preview?.newCount === 0 && (
            <p className="admin-muted">No hay tutores nuevos en la planilla.</p>
          )}

          {message && <p className="admin-success">{message}</p>}
          {error && <p className="admin-error">{error}</p>}

          <div className="admin-actions">
            <button
              type="button"
              className="admin-btn admin-btn--secondary"
              onClick={loadPreview}
              disabled={loadingPreview || importing}
            >
              Actualizar lista
            </button>
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              onClick={handleImport}
              disabled={loadingPreview || importing || !preview?.newCount}
            >
              {importing ? 'Importando...' : 'Importar nuevos a la BD'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export function SettingsButton({ onClick }) {
  return (
    <button
      type="button"
      className="settings-btn"
      onClick={onClick}
      aria-label="Configuración"
      title="Administración"
    >
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"
        />
      </svg>
    </button>
  );
}
