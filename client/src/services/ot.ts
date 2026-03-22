export type Op = InsertOp | DeleteOp;

export interface InsertOp {
  type: "insert";
  pos: number;
  text: string;
  clientId: string;
}

export interface DeleteOp {
  type: "delete";
  pos: number;
  len: number;
  clientId: string;
}

export function applyOp(content: string, op: Op): string {
  if (op.type === "insert") {
    const p = Math.max(0, Math.min(op.pos, content.length));
    return content.slice(0, p) + op.text + content.slice(p);
  }
  const p = Math.max(0, Math.min(op.pos, content.length));
  const len = Math.min(op.len, content.length - p);
  return content.slice(0, p) + content.slice(p + len);
}
