# scalable-chat-app

## Kafka and WebSocket Integration for Scalable Chat Application

This document explains how Kafka can be integrated with WebSockets to build a scalable and efficient messaging system for a chat application. The focus is on the step-by-step process with relevant code snippets for better understanding.

### Overview
- **Kafka** is used for handling message delivery and persistence, ensuring reliable and scalable communication.
- **WebSocket** enables real-time communication between clients, creating an interactive chat experience.

### Steps for Integration

#### 1. Setting Up Kafka
- **Install and Configure Kafka:** Ensure Kafka is installed and running locally or on a server. Configure brokers and zookeepers as needed.
- **Admin Connection:** Use Kafka's admin client to connect to the broker and manage topics.

##### Creating Topics
- Before producing or consuming messages, ensure the required topic exists.

**Example Code:**
```typescript
import { kafka } from "./kafka.config.js";

export async function createTopicIfNotExists(topicName: string) {
  const admin = kafka.admin();
  await admin.connect();
  console.log("Admin connected for topic creation...");

  const topics = await admin.listTopics();
  if (!topics.includes(topicName)) {
    console.log(`Creating topic: ${topicName}`);
    await admin.createTopics({
      topics: [{ topic: topicName, numPartitions: 1 }],
    });
    console.log(`Topic "${topicName}" created successfully.`);
  } else {
    console.log(`Topic "${topicName}" already exists.`);
  }
  await admin.disconnect();
}
```

#### 2. Kafka Producer and Consumer
- **Producer:** Responsible for sending messages to Kafka topics.
  - Logic: Create a producer instance, connect it, and send messages to the desired topic.
- **Consumer:** Reads messages from Kafka topics.
  - Logic: Create a consumer instance, subscribe to the topic, and process incoming messages.

**Example Code:**
```typescript
import { Kafka, logLevel } from "kafkajs";

const kafka = new Kafka({ brokers: ["localhost:9092"], logLevel: logLevel.ERROR });
export const producer = kafka.producer();
export const consumer = kafka.consumer({ groupId: "chats" });

export const connectKafkaProducer = async () => {
  await producer.connect();
  console.log("Kafka Producer connected...");
};
```

#### 3. Starting Kafka Services During Server Initialization
- When starting the server, ensure:
  1. Kafka topics are created (if not already existing).
  2. The producer is connected and ready to send messages.
  3. The consumer is subscribed and ready to handle incoming messages.

**Example Code:**
```typescript
(async () => {
  try {
    await createTopicIfNotExists("chats");
  } catch (error) {
    console.error("Error while creating topic:", error);
  }
})();

connectKafkaProducer().catch((err) => {
  console.log("Something went wrong in connecting with Kafka", err);
});
```

#### 4. WebSocket Server Setup
- **Initialize WebSocket Server:** Set up WebSocket to allow clients to connect and communicate.
- **Room Management:** Authenticate users and assign them to specific chat rooms.
- **Message Handling:**
  - On receiving a message from a client, produce it to the Kafka topic.
  - Broadcast the message to other clients in the same room.

**Example Code:**
```typescript
import { Server } from "socket.io";
import { produceMessage } from "./kafka-producer";

export function setupSocket(io: Server) {
  io.use((socket, next) => {
    const room = socket.handshake.auth.room || socket.handshake.headers.room;
    if (!room) {
      return next(new Error("Invalid room id"));
    }
    socket.room = room;
    next();
  });

  io.on("connection", (socket) => {
    socket.join(socket.room);
    console.log("Socket connected...", socket.id);

    socket.on("message", async (data) => {
      console.log("Received message", data);
      await produceMessage("chats", data);
      socket.to(socket.room).emit("message", data);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected...", socket.id);
    });
  });
}
```

#### 5. Producing Messages to Kafka
- Messages sent by WebSocket clients are passed to Kafka using the producer.
- Logic: Serialize the message and produce it to the specified Kafka topic.

**Example Code:**
```typescript
export const produceMessage = async (topic: string, message: any) => {
  try {
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
    console.log("Message sent to Kafka:", message);
  } catch (error) {
    console.error("Error sending message to Kafka:", error);
  }
};
```

#### 6. Broadcasting Messages with WebSocket
- The WebSocket server listens to messages from Kafka (via a consumer).
- Broadcast these messages to other connected clients in the appropriate room.

### Advantages of This Integration
- **Scalability:** Kafka handles large-scale message processing efficiently.
- **Reliability:** Messages are persisted in Kafka, reducing the chance of data loss.
- **Real-Time Communication:** WebSocket ensures instant delivery to connected clients.

### Summary
By combining Kafka and WebSocket, the system achieves reliable, real-time, and scalable communication. Kafka ensures message durability and processing, while WebSocket manages live interactions. This integration is ideal for chat applications requiring high availability and responsiveness.

