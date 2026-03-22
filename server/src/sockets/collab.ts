import type { Server, Socket } from "socket.io";
import { DocumentModel } from "../models/Document.js";
import type { Op } from "../utils/ot.js";
import { applyOp, transform } from "../utils/ot.js";

interface CursorPayload {
  roomId: string;
  clientId: string;
  line: number;
  column: number;
  selectionEndLine?: number;
  selectionEndColumn?: number;
}

interface CodeChangePayload {
  roomId: string;
  clientId: string;
  op: Op;
}

const roomContent = new Map<string, string>();
const roomVersion = new Map<string, number>();
const appliedOpQueues = new Map<string, Op[]>();

function getQueue(roomId: string): Op[] {
  if (!appliedOpQueues.has(roomId)) appliedOpQueues.set(roomId, []);
  return appliedOpQueues.get(roomId)!;
}

async function persistRoom(roomId: string, content: string, version: number) {
  await DocumentModel.findOneAndUpdate(
    { roomId },
    { $set: { content, version } },
    { upsert: true, setDefaultsOnInsert: true }
  );
}

const saveTimers = new Map<string, ReturnType<typeof setTimeout>>();

function scheduleSave(roomId: string, content: string, version: number) {
  const t = saveTimers.get(roomId);
  if (t) clearTimeout(t);
  saveTimers.set(
    roomId,
    setTimeout(() => {
      saveTimers.delete(roomId);
      void persistRoom(roomId, content, version);
    }, 800)
  );
}

export function registerCollab(io: Server) {
  io.on("connection", (socket: Socket) => {
    socket.on("join_room", async (payload: { roomId: string; clientId: string }) => {
      const { roomId, clientId } = payload;
      if (!roomId || !clientId) return;
      await socket.join(roomId);
      let doc = await DocumentModel.findOne({ roomId });
      if (!doc) {
        doc = await DocumentModel.create({ roomId, content: "", version: 0 });
      }
      roomContent.set(roomId, doc.content);
      roomVersion.set(roomId, doc.version);
      socket.data.roomId = roomId;
      socket.data.clientId = clientId;
      socket.emit("room_state", {
        roomId,
        content: doc.content,
        version: doc.version,
        clientId,
      });
      io.to(roomId).emit("user_joined", { roomId, clientId });
    });

    socket.on("leave_room", (payload: { roomId: string; clientId: string }) => {
      const { roomId, clientId } = payload;
      if (!roomId) return;
      void socket.leave(roomId);
      io.to(roomId).emit("user_left", { roomId, clientId });
    });

    socket.on("code_change", (payload: CodeChangePayload) => {
      const { roomId, clientId, op } = payload;
      if (!roomId || !clientId || !op || op.clientId !== clientId) return;
      let content = roomContent.get(roomId) ?? "";
      const queue = getQueue(roomId);
      let transformed: Op = op;
      for (const applied of queue) {
        const [, inc] = transform(applied, transformed);
        transformed = inc;
      }
      content = applyOp(content, transformed);
      roomContent.set(roomId, content);
      queue.push(transformed);
      if (queue.length > 256) queue.splice(0, queue.length - 256);
      const prevV = roomVersion.get(roomId) ?? 0;
      const version = prevV + 1;
      roomVersion.set(roomId, version);
      io.to(roomId).emit("code_change", {
        roomId,
        clientId,
        op: transformed,
        version,
      });
      scheduleSave(roomId, content, version);
    });

    socket.on("cursor_move", (payload: CursorPayload) => {
      const { roomId, clientId, line, column } = payload;
      if (!roomId || !clientId) return;
      socket.broadcast.to(roomId).emit("cursor_move", {
        roomId,
        clientId,
        line,
        column,
        selectionEndLine: payload.selectionEndLine,
        selectionEndColumn: payload.selectionEndColumn,
      });
    });

    socket.on("disconnect", () => {
      const roomId = socket.data.roomId as string | undefined;
      const clientId = socket.data.clientId as string | undefined;
      if (roomId && clientId) {
        io.to(roomId).emit("user_left", { roomId, clientId });
      }
    });
  });
}
