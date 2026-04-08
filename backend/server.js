const express = require('express');
const cors = require('cors');
const path = require('path');
const productRoutes = require('./routes/products');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// API Routes
app.use('/api/products', productRoutes);

// Root route - serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`  REST API Server is running!`);
  console.log(`  Backend API:  http://localhost:${PORT}/api/products`);
  console.log(`  Frontend UI:  http://localhost:${PORT}`);
  console.log(`========================================\n`);
});
