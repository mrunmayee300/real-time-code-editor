import type { Request, Response } from "express";
import { DocumentModel } from "../models/Document.js";

export async function getDocument(req: Request, res: Response) {
  try {
    const { roomId } = req.params;
    let doc = await DocumentModel.findOne({ roomId });
    if (!doc) {
      doc = await DocumentModel.create({ roomId, content: "", version: 0 });
    }
    res.json({
      roomId: doc.roomId,
      content: doc.content,
      version: doc.version,
    });
  } catch {
    res.status(500).json({ error: "failed_to_load" });
  }
}

export async function saveDocument(req: Request, res: Response) {
  try {
    const { roomId } = req.params;
    const { content, version } = req.body as {
      content?: string;
      version?: number;
    };
    if (typeof content !== "string" || typeof version !== "number") {
      res.status(400).json({ error: "invalid_body" });
      return;
    }
    const doc = await DocumentModel.findOneAndUpdate(
      { roomId },
      { $set: { content, version } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json({
      roomId: doc!.roomId,
      content: doc!.content,
      version: doc!.version,
    });
  } catch {
    res.status(500).json({ error: "failed_to_save" });
  }
}
