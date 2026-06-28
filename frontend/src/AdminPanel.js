import React, { useCallback, useEffect, useState } from 'react';
import { apiUrl } from './getApiBase';
import { parseApiResponse, apiErrorMessage } from './apiResponse';

export function PasswordModal({ onClose, onSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/admin-new-tutores'), {
        headers: { 'x-admin-password': password },
      });
      const { data, ok } = await parseApiResponse(res);
      if (!ok) {
        setError(apiErrorMessage(data, 'Contraseña incorrecta'));
        return;
      }
      onSuccess(password, data);
    } catch (err) {
      setError(err.message || 'No se pudo conectar con el servidor.');
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
  const [liberatingAll, setLiberatingAll] = useState(false);
  const [liberatingId, setLiberatingId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const adminHeaders = (extra = {}) => ({
    'Content-Type': 'application/json',
    'x-admin-password': password,
    ...extra,
  });

  const loadPreview = useCallback(async () => {
    setLoadingPreview(true);
    setError('');
    try {
      const res = await fetch(apiUrl('/admin-new-tutores'), {
        headers: { 'x-admin-password': password },
      });
      const { data, ok } = await parseApiResponse(res);
      if (!ok) {
        setError(apiErrorMessage(data, 'No se pudo leer la planilla'));
        return;
      }
      setPreview(data);
      if (onTutoresUpdated) onTutoresUpdated();
    } catch (err) {
      setError(err.message || 'Error de conexión con el servidor.');
    } finally {
      setLoadingPreview(false);
    }
  }, [password, onTutoresUpdated]);

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
      const res = await fetch(apiUrl('/admin-import-new-tutores'), {
        method: 'POST',
        headers: adminHeaders(),
      });
      const { data, ok } = await parseApiResponse(res);
      if (!ok) {
        setError(apiErrorMessage(data, 'Error al importar'));
        return;
      }
      setMessage(
        data.inserted > 0
          ? `Se importaron ${data.inserted} tutor(es) nuevo(s).`
          : 'No había tutores nuevos para importar.'
      );
      await loadPreview();
      if (onTutoresUpdated) onTutoresUpdated();
    } catch (err) {
      setError(err.message || 'Error de conexión con el servidor.');
    } finally {
      setImporting(false);
    }
  };

  const handleLiberar = async (tutorId) => {
    setLiberatingId(tutorId);
    setMessage('');
    setError('');
    try {
      const res = await fetch(apiUrl('/admin-liberar-cupo'), {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({ id: tutorId }),
      });
      const { data, ok } = await parseApiResponse(res);
      if (!ok) {
        setError(apiErrorMessage(data, 'Error al liberar cupo'));
        return;
      }
      setPreview((prev) => ({
        ...prev,
        tutoresConAsignados: data.tutoresConAsignados || [],
      }));
      setMessage('Se liberó 1 cupo.');
      if (onTutoresUpdated) onTutoresUpdated();
    } catch (err) {
      setError(err.message || 'Error de conexión con el servidor.');
    } finally {
      setLiberatingId(null);
    }
  };

  const handleLiberarTodos = async () => {
    if (!window.confirm('¿Resetear a 0 la cantidad asignada de todos los mentores?')) return;

    setLiberatingAll(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch(apiUrl('/admin-liberar-todos'), {
        method: 'POST',
        headers: adminHeaders(),
      });
      const { data, ok } = await parseApiResponse(res);
      if (!ok) {
        setError(apiErrorMessage(data, 'Error al liberar cupos'));
        return;
      }
      setPreview((prev) => ({
        ...prev,
        tutoresConAsignados: data.tutoresConAsignados || [],
      }));
      setMessage(
        data.resetCount > 0
          ? `Se liberaron cupos de ${data.resetCount} mentor(es).`
          : 'No había asignaciones para liberar.'
      );
      if (onTutoresUpdated) onTutoresUpdated();
    } catch (err) {
      setError(err.message || 'Error de conexión con el servidor.');
    } finally {
      setLiberatingAll(false);
    }
  };

  const tutoresConAsignados = preview?.tutoresConAsignados || [];
  const busy = loadingPreview || importing || liberatingAll || liberatingId !== null;

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div className="admin-modal admin-modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h2>Panel de administración</h2>
          <button type="button" className="admin-close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        <section className="admin-section">
          <h3>Importar tutores desde Google Sheets</h3>
          <p className="admin-muted">
            Lee la hoja <strong>Graduados</strong> y detecta filas nuevas.
            <strong> Actualizar lista</strong> también sincroniza cupos y carreras desde la planilla.
          </p>

          {loadingPreview && <p>Cargando planilla...</p>}

          {!loadingPreview && preview && (
            <div className="admin-stats">
              <span>{preview.sheetRows} filas en planilla</span>
              <span>{preview.newCount} nuevos</span>
              <span>{preview.inSheet - preview.newCount} ya en BD</span>
              {preview.cuposUpdated > 0 && (
                <span>{preview.cuposUpdated} cupo(s) actualizado(s)</span>
              )}
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

          <div className="admin-actions">
            <button
              type="button"
              className="admin-btn admin-btn--secondary"
              onClick={loadPreview}
              disabled={busy}
            >
              Actualizar lista
            </button>
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              onClick={handleImport}
              disabled={busy || !preview?.newCount}
            >
              {importing ? 'Importando...' : 'Importar nuevos a la BD'}
            </button>
            <button
              type="button"
              className="admin-btn admin-btn--warning"
              onClick={handleLiberarTodos}
              disabled={busy}
            >
              {liberatingAll ? 'Liberando...' : 'Liberar todos'}
            </button>
          </div>
        </section>

        <section className="admin-section">
          <h3>Liberar cupos</h3>
          <p className="admin-muted">
            Mentores con al menos un alumno asignado. <strong>Liberar</strong> resta 1 a la cantidad asignada.
          </p>

          {!loadingPreview && tutoresConAsignados.length === 0 && (
            <p className="admin-muted">Ningún mentor tiene alumnos asignados.</p>
          )}

          {!loadingPreview && tutoresConAsignados.length > 0 && (
            <div className="admin-cupos-table">
              <div className="admin-cupos-header">
                <span>Mentor</span>
                <span>Cupo</span>
                <span>Asignados</span>
                <span />
              </div>
              {tutoresConAsignados.map((t) => (
                <div className="admin-cupos-row" key={t.id}>
                  <span className="admin-cupos-name">{t.apellido}, {t.nombre}</span>
                  <span>{t.cupo}</span>
                  <span>{t.asignados}</span>
                  <button
                    type="button"
                    className="admin-btn admin-btn--secondary admin-btn--compact"
                    onClick={() => handleLiberar(t.id)}
                    disabled={busy}
                  >
                    {liberatingId === t.id ? '...' : 'Liberar'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {message && <p className="admin-success">{message}</p>}
        {error && <p className="admin-error">{error}</p>}
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
