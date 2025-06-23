import React, { useEffect, useState } from 'react';
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
  });
  const [mensaje, setMensaje] = useState('');
  
  // Filtros
  const [filtros, setFiltros] = useState({
    carrera: '',
    sexo: '',
    anioMin: '',
    anioMax: ''
  });

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
    setSeleccion(tutor);
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
    for (const campo of ['nombre','apellido','anioCarrera','carrera','correo','celular']) {
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
        setForm({ nombre: '', apellido: '', anioCarrera: '', carrera: '', correo: '', celular: '', linkedin: '' });
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
    <div style={{ maxWidth: 900, margin: 'auto', padding: 20 }}>
      <h1>Seleccioná tu Graduado-Mentor</h1>
      <p style={{ color: '#666', marginBottom: 20 }}>Haciendo click en la foto, verás su perfil de LinkedIn</p>
      {loading && <p>Cargando tutores...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && (
        <div style={{ display: 'flex', gap: 40 }}>
          <div style={{ flex: 2 }}>
            <h2>Lista de tutores</h2>
            
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

            <div style={{ marginBottom: 10 }}>
              <strong>Tutores encontrados: {tutoresFiltrados.length}</strong>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              {tutoresFiltrados.map((t, i) => (
                <div key={i} style={{
                  border: '1px solid #ccc',
                  borderRadius: 8,
                  padding: 16,
                  background: seleccion && seleccion.Nombre === t.Nombre && seleccion.Apellido === t.Apellido ? '#e0f7fa' : '#fff',
                  boxShadow: '0 2px 8px #0001',
                  opacity: t['Cupo disponible'] <= 0 ? 0.5 : 1
                }}>
                  {t.Foto && (
                    <div style={{ textAlign: 'center', marginBottom: 10 }}>
                      <img 
                        src={t.Foto} 
                        alt={`${t.Nombre} ${t.Apellido}`}
                        style={{ 
                          width: 80, 
                          height: 80, 
                          borderRadius: '50%', 
                          objectFit: 'cover',
                          border: '2px solid #ddd',
                          cursor: t.Linkedin ? 'pointer' : 'default'
                        }}
                        onClick={() => t.Linkedin && window.open(t.Linkedin, '_blank')}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '8px' }}>
                    {t.Nombre} {t.Apellido} <span style={{ fontWeight: 'normal' }}>({t.Edad || '-'} años)</span>
                  </div>
                  <div style={{ marginBottom: '4px' }}>{t.Carrera || '-'} ({t.Graduación})</div>
                  {t.Cargo && <div style={{ marginBottom: '4px' }}><strong>Cargo:</strong> {t.Cargo}</div>}
                  {t.Empresa && <div style={{ marginBottom: '4px' }}><strong>Empresa:</strong> {t.Empresa}</div>}
                  <button
                    style={{ marginTop: 10 }}
                    onClick={() => handleSelectTutor(t)}
                    disabled={t['Cupo disponible'] <= 0}
                  >
                    Seleccionar
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <h2>Datos del alumno</h2>
            <form onSubmit={handleSubmit}>
              <div>
                <label>Nombre:<br/>
                  <input name="nombre" value={form.nombre} onChange={handleChange} />
                </label>
              </div>
              <div>
                <label>Apellido:<br/>
                  <input name="apellido" value={form.apellido} onChange={handleChange} />
                </label>
              </div>
              <div>
                <label>Año en la carrera:<br/>
                  <input name="anioCarrera" value={form.anioCarrera} onChange={handleChange} type="number" min="3" max="5" />
                </label>
              </div>
              <div>
                <label>Carrera:<br/>
                  <select name="carrera" value={form.carrera} onChange={handleChange}>
                    <option value="">Seleccionar</option>
                    {CARRERAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
              </div>
              <div>
                <label>Correo:<br/>
                  <input name="correo" value={form.correo} onChange={handleChange} type="email" />
                </label>
              </div>
              <div>
                <label>Celular:<br/>
                  <input name="celular" value={form.celular} onChange={handleChange} />
                </label>
              </div>
              <div>
                <label>LinkedIn (opcional):<br/>
                  <input name="linkedin" value={form.linkedin} onChange={handleChange} />
                </label>
              </div>
              <div style={{ marginTop: 10 }}>
                <button type="submit">Enviar solicitud</button>
              </div>
              {mensaje && <p style={{ color: mensaje.startsWith('¡') ? 'green' : 'red' }}>{mensaje}</p>}
            </form>
            {seleccion && (
              <div style={{ marginTop: 20, background: '#f1f8e9', padding: 10, borderRadius: 8 }}>
                <b>Tutor seleccionado:</b><br/>
                {seleccion.Nombre} {seleccion.Apellido}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
