require('dotenv').config();
const express = require('express');
const { Kafka } = require('kafkajs');

const app = express();
const PORT = process.env.PORT || 3004;

// Kafka connects using the container name "kafka" on port 9092
// This works because all services share the same Docker network
const kafka = new Kafka({
  clientId: 'notification-service',
  brokers: [process.env.KAFKA_BROKER || 'kafka:9092'],
  retry: {
    retries: 10,          // retry connecting up to 10 times
    initialRetryTime: 3000 // wait 3 seconds between retries
  }
});

// A "consumer" is what reads messages from Kafka
// groupId groups multiple instances together — Kafka delivers each message to only one instance in the group
const consumer = kafka.consumer({ groupId: 'notification-group' });

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'up', service: 'notification-service' });
});

app.listen(PORT, () => {
  console.log(`notification-service running on port ${PORT}`);
  connectAndConsume();
});

// ─── Kafka Consumer ────────────────────────────────────────────────────────────

async function connectAndConsume() {
  try {
    await consumer.connect();
    console.log('✅ Connected to Kafka');

    // Subscribe to the topic order-service will publish to
    await consumer.subscribe({ topic: 'order.placed', fromBeginning: false });
    console.log('📥 Listening for messages on topic: order.placed');

    // This runs continuously — every message that arrives triggers this callback
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const order = JSON.parse(message.value.toString());
          handleOrderPlaced(order);
        } catch (err) {
          console.error('Failed to process message:', err.message);
        }
      }
    });

  } catch (err) {
    console.error('Kafka connection failed:', err.message);
    // Wait 5 seconds and retry — Kafka may still be starting up
    setTimeout(connectAndConsume, 5000);
  }
}

// ─── Notification Handler ──────────────────────────────────────────────────────

function handleOrderPlaced(order) {
  console.log('─'.repeat(50));
  console.log('📧 NEW ORDER NOTIFICATION');
  console.log(`   Order ID  : ${order.id}`);
  console.log(`   User ID   : ${order.userId}`);
  console.log(`   Product ID: ${order.productId}`);
  console.log(`   Quantity  : ${order.quantity}`);
  console.log(`   Total     : $${order.totalPrice}`);
  console.log(`   Status    : ${order.status}`);
  console.log('─'.repeat(50));
}