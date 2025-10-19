import React, { useState, useEffect } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:5000/api/usuarios';

function App() {
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', email: '' });
  const [mensaje, setMensaje] = useState('');

  // Cargar usuarios al iniciar
  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      const response = await axios.get(API_URL);
      setUsuarios(response.data);
    } catch (error) {
      mostrarMensaje('Error al cargar usuarios: ' + error.message);
    }
  };

  const mostrarMensaje = (msg) => {
    setMensaje(msg);
    setTimeout(() => setMensaje(''), 3000);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.email) {
      mostrarMensaje('Por favor, completa todos los campos');
      return;
    }

    try {
      if (usuarioEditando) {
        // Actualizar usuario existente
        await axios.put(`${API_URL}/${usuarioEditando.id}`, formData);
        mostrarMensaje('Usuario actualizado exitosamente');
      } else {
        // Crear nuevo usuario
        await axios.post(API_URL, formData);
        mostrarMensaje('Usuario creado exitosamente');
      }
      
      // Limpiar formulario y recargar lista
      setFormData({ nombre: '', email: '' });
      setUsuarioEditando(null);
      cargarUsuarios();
    } catch (error) {
      mostrarMensaje('Error: ' + error.response?.data?.error || error.message);
    }
  };

  const editarUsuario = (usuario) => {
    setUsuarioEditando(usuario);
    setFormData({ nombre: usuario.nombre, email: usuario.email });
  };

  const eliminarUsuario = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/${id}`);
      mostrarMensaje('Usuario eliminado exitosamente');
      cargarUsuarios();
    } catch (error) {
      mostrarMensaje('Error al eliminar usuario: ' + error.message);
    }
  };

  const cancelarEdicion = () => {
    setUsuarioEditando(null);
    setFormData({ nombre: '', email: '' });
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Gestión de Usuarios</h1>
        <p>Sistema CRUD con React y MySQL</p>
      </header>

      <main className="app-main">
        {/* Formulario */}
        <section className="form-section">
          <h2>{usuarioEditando ? 'Editar Usuario' : 'Agregar Nuevo Usuario'}</h2>
          <form onSubmit={handleSubmit} className="usuario-form">
            <div className="form-group">
              <label htmlFor="nombre">Nombre:</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                placeholder="Ingresa el nombre"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Ingresa el email"
              />
            </div>
            
            <div className="form-buttons">
              <button type="submit" className="btn btn-primary">
                {usuarioEditando ? 'Actualizar' : 'Crear'} Usuario
              </button>
              {usuarioEditando && (
                <button type="button" onClick={cancelarEdicion} className="btn btn-secondary">
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Mensajes */}
        {mensaje && (
          <div className={`mensaje ${mensaje.includes('Error') ? 'error' : 'exito'}`}>
            {mensaje}
          </div>
        )}

        {/* Lista de usuarios */}
        <section className="lista-section">
          <h2>Lista de Usuarios ({usuarios.length})</h2>
          
          {usuarios.length === 0 ? (
            <p className="no-usuarios">No hay usuarios registrados</p>
          ) : (
            <div className="usuarios-grid">
              {usuarios.map(usuario => (
                <div key={usuario.id} className="usuario-card">
                  <div className="usuario-info">
                    <h3>{usuario.nombre}</h3>
                    <p>{usuario.email}</p>
                    <small>Creado: {new Date(usuario.fecha_creacion).toLocaleDateString()}</small>
                  </div>
                  
                  <div className="usuario-actions">
                    <button 
                      onClick={() => editarUsuario(usuario)}
                      className="btn btn-warning"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => eliminarUsuario(usuario.id)}
                      className="btn btn-danger"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
