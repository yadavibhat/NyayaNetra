const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const router = require('./routes.cjs');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Attach API Router with '/api' prefix
app.use('/api', router);

// Serve React app static files in production
app.use(express.static(path.join(__dirname, '..', 'dist')));

// SPA Router Fallback Middleware (path-to-regexp v10 safe)
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    } else {
      return res.send('NyayaNetra Server Backend Operational. Start Vite Client on port 3000.');
    }
  }
  next();
});

module.exports = app;
