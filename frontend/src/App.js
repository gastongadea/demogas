import React, { useEffect, useState, useRef } from 'react';
import './App.css';

const CARRERAS = [
  'Ing. Industrial',
  'Ing. Informática',
  'Ing. Biomédica',
  'Lic. Ciencias de Datos',
];

function App() {
  const [tutores, setTutores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [seleccion, setSeleccion] = useState(null);
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    anioCarrera: '',
    carrera: '',
    correo: '',
    celular: '',
    linkedin: '',
    sexo: '',
  });
  const [mensaje, setMensaje] = useState('');
  
  // Filtros
  const [filtros, setFiltros] = useState({
    carrera: '',
    sexo: '',
    anioMin: '',
    anioMax: ''
  });

  const alumnoFormRef = useRef(null);

  useEffect(() => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
    fetch(`${backendUrl}/tutores`)
      .then(res => res.json())
      .then(data => {
        setTutores(data);
        setLoading(false);
        // Log para depurar los valores de carrera y sexo
        console.log('Tutores cargados:', data);
        console.log('Valores únicos de Carrera:', [...new Set(data.map(t => t.Carrera))]);
        console.log('Valores únicos de Sexo:', [...new Set(data.map(t => t.Sexo))]);
      })
      .catch(() => {
        setError('No se pudo cargar la lista de tutores');
        setLoading(false);
      });
  }, []);

  // Función para filtrar tutores
  const tutoresFiltrados = tutores.filter(tutor => {
    if (filtros.carrera && tutor.Carrera !== filtros.carrera) return false;
    if (filtros.sexo && tutor.Sexo !== filtros.sexo) return false;
    if (filtros.anioMin && parseInt(tutor.Graduación) < parseInt(filtros.anioMin)) return false;
    if (filtros.anioMax && parseInt(tutor.Graduación) > parseInt(filtros.anioMax)) return false;
    return true;
  });

  const handleSelectTutor = (tutor) => {
    if (seleccion && seleccion.Nombre === tutor.Nombre && seleccion.Apellido === tutor.Apellido) {
      setSeleccion(null);
    } else {
      setSeleccion(tutor);
      setTimeout(() => {
        if (alumnoFormRef.current) {
          alumnoFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
    setMensaje('');
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFiltroChange = e => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  };

  const limpiarFiltros = () => {
    setFiltros({ carrera: '', sexo: '', anioMin: '', anioMax: '' });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMensaje('');
    if (!seleccion) {
      setMensaje('Por favor, selecciona un tutor.');
      return;
    }
    for (const campo of ['nombre','apellido','anioCarrera','carrera','correo','celular','sexo']) {
      if (!form[campo]) {
        setMensaje('Por favor, completa todos los campos.');
        return;
      }
    }
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
      const res = await fetch(`${backendUrl}/seleccionar-tutor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tutor: { Nombre: seleccion.Nombre, Apellido: seleccion.Apellido },
          alumno: form,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setMensaje('¡Selección exitosa! El tutor recibirá tus datos.');
        setSeleccion(null);
        setForm({ nombre: '', apellido: '', anioCarrera: '', carrera: '', correo: '', celular: '', linkedin: '', sexo: '' });
      } else {
        if (data.solicitudPrevia) {
          setMensaje(`Ya tienes una solicitud de tutor registrada el ${data.solicitudPrevia.fecha} con ${data.solicitudPrevia.tutor}. No puedes solicitar otro tutor.`);
        } else {
          setMensaje(data.error || 'Error al seleccionar tutor.');
        }
      }
    } catch (err) {
      setMensaje('Error de conexión con el servidor.');
    }
  };

  return (
    <div className="main-layout">
      <div className="tutores-list">
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <img 
            src="/logoFIhorizontal.png" 
            alt="Logo Facultad de Ingeniería - Universidad Austral"
            style={{ 
              maxWidth: '300px', 
              height: 'auto',
              marginBottom: '5px'
            }}
          />
        </div>
        <h1>Seleccioná tu Graduado-Mentor</h1>
        <p style={{ color: '#666', marginBottom: 20 }}>Haciendo click en la foto, verás su perfil de LinkedIn</p>
        {loading && <p>Cargando tutores...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {!loading && !error && (
          <>
            {/* Filtros */}
            <div style={{ 
              background: '#f5f5f5', 
              padding: 16, 
              borderRadius: 8, 
              marginBottom: 20,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              alignItems: 'end'
            }}>
              <div>
                <label>Carrera:<br/>
                  <select name="carrera" value={filtros.carrera} onChange={handleFiltroChange}>
                    <option value="">Todas</option>
                    {CARRERAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
              </div>
              <div>
                <label>Sexo:<br/>
                  <select name="sexo" value={filtros.sexo} onChange={handleFiltroChange}>
                    <option value="">Todos</option>
                    <option value="Varón">Varón</option>
                    <option value="Mujer">Mujer</option>
                  </select>
                </label>
              </div>
              <div>
                <label>Graduado desde:<br/>
                  <input 
                    name="anioMin" 
                    type="number" 
                    value={filtros.anioMin} 
                    onChange={handleFiltroChange}
                    placeholder="Ej: 2010"
                    style={{ width: 80 }}
                  />
                </label>
              </div>
              <div>
                <label>hasta:<br/>
                  <input 
                    name="anioMax" 
                    type="number" 
                    value={filtros.anioMax} 
                    onChange={handleFiltroChange}
                    placeholder="Ej: 2020"
                    style={{ width: 80 }}
                  />
                </label>
              </div>
              <div>
                <button onClick={limpiarFiltros} style={{ padding: '8px 16px' }}>
                  Limpiar filtros
                </button>
              </div>
            </div>
            {/* Lista de tutores */}
            <div className="tutores-grid">
              {tutoresFiltrados.length === 0 && <p style={{gridColumn: '1 / -1'}}>No hay tutores que coincidan con los filtros.</p>}
              {tutoresFiltrados.map((tutor, idx) => (
                <div
                  key={idx}
                  className={`tutor-card${seleccion && seleccion.Nombre === tutor.Nombre && seleccion.Apellido === tutor.Apellido ? ' seleccionado' : ''}`}
                  onClick={() => handleSelectTutor(tutor)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    background: '#fff',
                    border: '1px solid #ddd',
                    borderRadius: 8,
                    marginBottom: 0,
                    padding: 12,
                    cursor: 'pointer',
                    boxShadow: seleccion && seleccion.Nombre === tutor.Nombre && seleccion.Apellido === tutor.Apellido ? '0 0 0 2px #1976d2' : 'none',
                  }}
                >
                  <a href={tutor.Linkedin} target="_blank" rel="noopener noreferrer">
                    <img
                      src={tutor.Foto || '/logo192.png'}
                      alt={tutor.Nombre}
                      style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid #1976d2' }}
                    />
                  </a>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: 18 }}>{tutor.Nombre} {tutor.Apellido}</div>
                    <div style={{ color: '#555' }}>{tutor.Carrera}</div>
                    <div style={{ color: '#888', fontSize: 13 }}>Graduación: {tutor.Graduación}</div>
                    {tutor.Cargo && <div style={{ color: '#888', fontSize: 13 }}>Cargo: {tutor.Cargo}</div>}
                    {tutor.Empresa && <div style={{ color: '#888', fontSize: 13 }}>Empresa: {tutor.Empresa}</div>}
                    {tutor.Lugar && <div style={{ color: '#888', fontSize: 13 }}>Lugar: {tutor.Lugar}</div>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="alumno-form" ref={alumnoFormRef}>
        <h2>Datos del Alumno</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre" />
          <input name="apellido" value={form.apellido} onChange={handleChange} placeholder="Apellido" />
          <input name="anioCarrera" value={form.anioCarrera} onChange={handleChange} placeholder="Año de la carrera" type="number" min="1" max="7" />
          <select name="carrera" value={form.carrera} onChange={handleChange}>
            <option value="">Seleccioná tu carrera</option>
            {CARRERAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input name="correo" value={form.correo} onChange={handleChange} placeholder="Correo electrónico" type="email" />
          <input name="celular" value={form.celular} onChange={handleChange} placeholder="Celular" />
          <input name="linkedin" value={form.linkedin} onChange={handleChange} placeholder="LinkedIn (opcional)" />
          <select name="sexo" value={form.sexo} onChange={handleChange}>
            <option value="">Sexo</option>
            <option value="Varón">Varón</option>
            <option value="Mujer">Mujer</option>
          </select>
          <button type="submit" style={{ padding: '10px 0', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 'bold', fontSize: 16 }}>Enviar solicitud</button>
        </form>
        {seleccion && (
          <div style={{ marginTop: 16, background: '#e3f2fd', padding: 10, borderRadius: 8, color: '#1976d2', fontWeight: 'bold', textAlign: 'center' }}>
            Tutor seleccionado: {seleccion.Nombre} {seleccion.Apellido}
          </div>
        )}
        {mensaje && <div style={{ marginTop: 16, color: mensaje.includes('¡Selección exitosa!') ? 'green' : 'red' }}>{mensaje}</div>}
      </div>
    </div>
  );
}

export default App;
