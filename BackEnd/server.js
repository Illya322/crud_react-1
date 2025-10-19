const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 45050;
const JWT_SECRET = 'WataSHi09'; // Cambia esto por una clave segura

// Middleware
app.use(cors());
app.use(express.json());

// Configuración de la base de datos
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // Cambia por tu contraseña
  database: 'crud_db'
};

// Conexión a la base de datos
let connection;

async function connectDB() {
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Conectado a MySQL');
  } catch (error) {
    console.error('Error conectando a MySQL:', error);
  }
}

// Registro de usuario
app.post('/api/register', async (req, res) => {
  const { nombre, email, password } = req.body;
  if (!nombre || !email || !password) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    await connection.execute(
      'INSERT INTO users (nombre, email, password) VALUES (?, ?, ?)',
      [nombre, email, hashedPassword]
    );
    res.status(201).json({ message: 'Usuario registrado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login de usuario
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña requeridos' });
  }
  try {
    const [rows] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }
    const usuario = rows[0];
    const valid = await bcrypt.compare(password, usuario.password);
    if (!valid) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }
    const token = jwt.sign({ id: usuario.id, email: usuario.email }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ token, usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Middleware de autenticación
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token requerido' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}

// CRUD protegido para users
app.get('/api/users', authMiddleware, async (req, res) => {
  try {
    const [rows] = await connection.execute('SELECT id, nombre, email FROM users');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await connection.execute(
      'SELECT id, nombre, email FROM users WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', authMiddleware, async (req, res) => {
  const { nombre, email, password } = req.body;
  if (!nombre || !email || !password) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const [result] = await connection.execute(
      'INSERT INTO users (nombre, email, password) VALUES (?, ?, ?)',
      [nombre, email, hashedPassword]
    );
    res.status(201).json({ 
      id: result.insertId, 
      nombre, 
      email,
      message: 'Usuario creado exitosamente' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/:id', authMiddleware, async (req, res) => {
  const { nombre, email, password } = req.body;
  const userId = req.params.id;
  if (!nombre || !email) {
    return res.status(400).json({ error: 'Nombre y email son requeridos' });
  }
  let query, params;
  if (password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    query = 'UPDATE users SET nombre = ?, email = ?, password = ? WHERE id = ?';
    params = [nombre, email, hashedPassword, userId];
  } else {
    query = 'UPDATE users SET nombre = ?, email = ? WHERE id = ?';
    params = [nombre, email, userId];
  }
  try {
    const [result] = await connection.execute(query, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ 
      id: parseInt(userId), 
      nombre, 
      email,
      message: 'Usuario actualizado exitosamente' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/users/:id', authMiddleware, async (req, res) => {
  try {
    const [result] = await connection.execute(
      'DELETE FROM users WHERE id = ?',
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Iniciar servidor
app.listen(PORT, async () => {
  await connectDB();
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});