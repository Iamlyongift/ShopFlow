require('dotenv').config();
const express = require('express');
const amqp = require('amqplib');

const app = express();
const PORT = process.env.PORT || 3004;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const QUEUE = 'order.placed';

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'up', service: 'notification-service' });
});

app.listen(PORT, () => {
  console.log(`notification-service running on port ${PORT}`);
  connectAndConsume();
});

// ─── RabbitMQ Consumer ────────────────────────────────────────────────────────

async function connectAndConsume() {
  // Retry loop — RabbitMQ may not be ready instantly on startup
  let retries = 10;
  while (retries > 0) {
    try {
      const connection = await amqp.connect(RABBITMQ_URL);
      const channel    = await connection.createChannel();

      await channel.assertQueue(QUEUE, { durable: true });
      console.log(`📥 Listening for messages on queue: ${QUEUE}`);

      channel.consume(QUEUE, (msg) => {
        if (!msg) return;

        try {
          const order = JSON.parse(msg.content.toString());
          handleOrderPlaced(order);
          channel.ack(msg);
        } catch (err) {
          console.error('Failed to process message:', err.message);
          channel.nack(msg, false, false); // discard bad message
        }
      });

      // Handle connection errors
      connection.on('error', (err) => {
        console.error('RabbitMQ connection error:', err.message);
        setTimeout(connectAndConsume, 5000);
      });

      return; // Connected successfully, exit retry loop
    } catch (err) {
      retries--;
      console.warn(`RabbitMQ not ready. Retrying... (${retries} left)`);
      await new Promise(res => setTimeout(res, 5000));
    }
  }
  console.error('Could not connect to RabbitMQ after multiple attempts.');
}

function handleOrderPlaced(order) {
  // In production: send email via SendGrid, Nodemailer, etc.
  console.log('─'.repeat(50));
  console.log('📧 NEW ORDER NOTIFICATION');
  console.log(`   Order ID  : ${order.id}`);
  console.log(`   User ID   : ${order.userId}`);
  console.log(`   Product ID: ${order.productId}`);
  console.log(`   Quantity  : ${order.quantity}`);
  console.log(`   Total     : $${order.totalPrice}`);
  console.log(`   Status    : ${order.status}`);
  console.log('─'.repeat(50));
  // TODO: integrate with email provider here
}