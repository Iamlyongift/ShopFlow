require('dotenv').config();
const express = require('express');
const productRoutes = require('./routes/productRoutes');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());

// Routes
app.use('/api/products', productRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'up', service: 'product-service' });
});

app.listen(PORT, () => {
  console.log(`product-service running on port ${PORT}`);
});