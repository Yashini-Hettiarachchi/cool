/**
 * Express entry point.
 *
 * Serves:
 *   /api/*        — the REST API (business logic)
 *   /admin        — the React production build (whole app, root reserved for a
 *                   future showcase site)
 *   /             — redirects to /admin for now
 *
 * cPanel/Passenger injects the port via process.env.PORT — never hardcode it.
 */
require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');

const { ping } = require('./config/db');

const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const pricingRoutes = require('./routes/pricing.routes');
const customersRoutes = require('./routes/customers.routes');
const agreementsRoutes = require('./routes/agreements.routes');

const app = express();

// --- Core middleware ---
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || true,
    credentials: true,
  })
);

// --- Health check ---
app.get('/api/health', async (req, res) => {
  let db = false;
  try {
    db = await ping();
  } catch (err) {
    db = false;
  }
  res.json({ ok: true, db, time: new Date().toISOString() });
});

// --- API routes ---
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/agreements', agreementsRoutes);

// --- Static React build (production) ---
// Vite builds to client/dist; served under /admin.
const clientBuild = path.join(__dirname, '..', 'client', 'dist');
app.use('/admin', express.static(clientBuild));
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(clientBuild, 'index.html'), (err) => {
    if (err) res.status(404).send('Frontend build not found. Run `npm run build` in client/.');
  });
});

// Root reserved for future showcase site — redirect into the app for now.
app.get('/', (req, res) => res.redirect('/admin'));

// --- 404 for unknown API routes ---
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// --- Central error handler ---
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[error]', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`AC Service API listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
});

module.exports = app;
