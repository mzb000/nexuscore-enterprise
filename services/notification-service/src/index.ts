import Fastify from "fastify";
import { WebSocketServer, WebSocket } from "ws";
import Redis from "ioredis";
import { Kafka } from "kafkajs";
import dotenv from "dotenv";

dotenv.config();

const port = Number(process.env.PORT) || 4002;
const redisHost = process.env.REDIS_HOST || "localhost";
const redisPort = Number(process.env.REDIS_PORT) || 6379;
const kafkaBrokers = (process.env.KAFKA_BROKERS || "localhost:9092").split(",");

const fastify = Fastify({ logger: true });

// Redis Sub Client
const redisSub = new Redis({
  host: redisHost,
  port: redisPort,
  retryStrategy: (t) => Math.min(t * 100, 3000),
});

// Active WebSocket Clients
const clients = new Set<WebSocket>();

// Kafka Consumer
const kafka = new Kafka({
  clientId: "nexus-notification-service",
  brokers: kafkaBrokers,
});
const consumer = kafka.consumer({ groupId: process.env.KAFKA_GROUP_ID || "nexus-notification-group" });

async function start() {
  await fastify.listen({ port, host: "0.0.0.0" });
  fastify.log.info(`Notification Service listening on port ${port}`);

  // Create Standalone WebSocket Server on top of Fastify HTTP server
  const wss = new WebSocketServer({ server: fastify.server, path: "/ws" });

  wss.on("connection", (ws: WebSocket) => {
    clients.add(ws);
    fastify.log.info("New WebSocket client connected. Active: " + clients.size);

    ws.send(JSON.stringify({ type: "CONNECTED", message: "Connected to NexusCore Live Notification Stream" }));

    ws.on("close", () => {
      clients.delete(ws);
      fastify.log.info("Client disconnected. Active: " + clients.size);
    });
  });

  // Redis Pub/Sub listener
  await redisSub.subscribe("nexus.notifications.broadcast");
  redisSub.on("message", (channel, message) => {
    broadcast(message);
  });

  // Kafka Consumer Loop
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: process.env.KAFKA_TOPIC || "nexus.order.events", fromBeginning: false });
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const val = message.value?.toString();
        if (val) {
          fastify.log.info(`Kafka event received on ${topic}: broadcasting to ${clients.size} clients`);
          broadcast(JSON.stringify({ topic, payload: JSON.parse(val) }));
        }
      },
    });
  } catch (err) {
    fastify.log.warn("Kafka consumer offline (will retry): " + err);
  }
}

function broadcast(payload: string) {
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

start();
