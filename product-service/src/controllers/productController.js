// In-memory store for dev — swap for a real DB (MongoDB/PostgreSQL) in production
let products = [
  { id: 1, name: 'Wireless Headphones', price: 99.99, stock: 50 },
  { id: 2, name: 'Mechanical Keyboard', price: 149.99, stock: 30 },
  { id: 3, name: 'USB-C Hub',           price: 49.99,  stock: 100 },
];
let nextId = 4;

const getAllProducts = (req, res) => {
  res.json(products);
};

const getProductById = (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(product);
};

const createProduct = (req, res) => {
  const { name, price, stock } = req.body;
  const product = { id: nextId++, name, price, stock };
  products.push(product);
  res.status(201).json(product);
};

const updateProduct = (req, res) => {
  const index = products.findIndex(p => p.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ message: 'Product not found' });
  products[index] = { ...products[index], ...req.body };
  res.json(products[index]);
};

const deleteProduct = (req, res) => {
  const index = products.findIndex(p => p.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ message: 'Product not found' });
  products.splice(index, 1);
  res.status(204).send();
};

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct };