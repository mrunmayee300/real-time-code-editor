import "dotenv/config";
import cors from "cors";
import express from "express";
import { createServer } from "http";
import mongoose from "mongoose";
import { Server } from "socket.io";
import { executeCode } from "./controllers/executeController.js";
import { getDocument, saveDocument } from "./controllers/documentController.js";
import { registerCollab } from "./sockets/collab.js";

const PORT = Number(process.env.PORT) || 3001;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/collab-editor";

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "2mb" }));

app.get("/api/documents/:roomId", getDocument);
app.put("/api/documents/:roomId", saveDocument);
app.post("/execute", executeCode);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: true, credentials: true },
});

registerCollab(io);

async function main() {
  await mongoose.connect(MONGO_URI);
  httpServer.listen(PORT, () => {
    console.log(`server ${PORT}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
