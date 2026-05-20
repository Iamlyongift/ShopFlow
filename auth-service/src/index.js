require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3005;

// In production this comes from environment variable / secrets manager
// Never hardcode in real apps
const JWT_SECRET = process.env.JWT_SECRET || 'shopflow-secret-key';

app.use(express.json());

// ─── Health Check ──────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'up', service: 'auth-service' });
});

// ─── Login → issues a JWT token ───────────────────────────────────────────
// In production: look up user in DB, verify hashed password
// For now: hardcoded users to focus on the JWT flow
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  // Hardcoded users — we'll replace with DB lookup when we add PostgreSQL
  const users = {
    'admin': { id: 1, password: 'admin123', role: 'ADMIN' },
    'user':  { id: 2, password: 'user123',  role: 'USER'  }
  };

  const user = users[username];

  // Check user exists and password matches
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  // Build the token payload — this data is readable by anyone
  // Never put sensitive data (passwords) in here
  const payload = {
    userId: user.id,
    username: username,
    role: user.role
  };

  // Sign the token — expires in 24 hours
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

  res.json({
    message: 'Login successful',
    token: token,
    user: { id: user.id, username, role: user.role }
  });
});

// ─── Validate → called internally by Nginx auth_request ───────────────────
// Nginx calls this before forwarding any protected request
// Must return 200 (valid) or 401 (invalid) — nothing else matters to Nginx
app.get('/api/auth/validate', (req, res) => {
  // Token comes in the Authorization header as: "Bearer <token>"
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1]; // extract token after "Bearer "

  try {
    // verify() throws if token is expired or signature doesn't match
    const decoded = jwt.verify(token, JWT_SECRET);

    // Pass user info to downstream services via headers
    res.set('X-User-Id', decoded.userId);
    res.set('X-User-Role', decoded.role);
    res.status(200).json({ valid: true });

  } catch (err) {
    // Token expired or tampered with
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

app.listen(PORT, () => {
  console.log(`auth-service running on port ${PORT}`);
});