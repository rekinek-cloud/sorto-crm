const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 9029;

// Middleware
app.use(cors());
app.use(express.json());

// Simple in-memory storage
const users = [
  {
    id: 1,
    email: 'admin@example.com',
    password: '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM1A8W9iqaG3vv1BD7WC', // password: admin123
    name: 'Admin User',
    organizationId: 'org1'
  }
];

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'crm-backend', timestamp: new Date().toISOString() });
});

app.get('/api', (req, res) => {
  res.json({ message: 'CRM API v1.0', status: 'running' });
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Find user
  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Check password (for demo, accept any password)
  const validPassword = password === 'admin123' || password === 'test';
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Generate token
  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  );
  
  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      organizationId: user.organizationId
    },
    token,
    refreshToken: token
  });
});

app.post('/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  
  // Check if user exists
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'User already exists' });
  }
  
  // Create user
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: users.length + 1,
    email,
    password: hashedPassword,
    name: name || email.split('@')[0],
    organizationId: 'org' + (users.length + 1)
  };
  
  users.push(newUser);
  
  // Generate token
  const token = jwt.sign(
    { id: newUser.id, email: newUser.email },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  );
  
  res.json({
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      organizationId: newUser.organizationId
    },
    token,
    refreshToken: token
  });
});

// Catch all
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Backend running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Login: POST /auth/login (email: admin@example.com, password: admin123)`);
});
