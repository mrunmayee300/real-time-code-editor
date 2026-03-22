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

export function transform(a: Op, b: Op): [Op, Op] {
  if (a.type === "insert" && b.type === "insert") {
    if (a.pos < b.pos) return [a, { ...b, pos: b.pos + a.text.length }];
    if (b.pos < a.pos) return [{ ...a, pos: a.pos + b.text.length }, b];
    if (a.clientId < b.clientId)
      return [a, { ...b, pos: b.pos + a.text.length }];
    return [{ ...a, pos: a.pos + b.text.length }, b];
  }
  if (a.type === "insert" && b.type === "delete") {
    const ai = a;
    const bd = b;
    if (ai.pos <= bd.pos)
      return [ai, { ...bd, pos: bd.pos + ai.text.length }];
    if (ai.pos >= bd.pos + bd.len) return [{ ...ai, pos: ai.pos - bd.len }, bd];
    const offset = ai.pos - bd.pos;
    return [
      { ...ai, pos: bd.pos },
      { ...bd, len: bd.len + ai.text.length },
    ];
  }
  if (a.type === "delete" && b.type === "insert") {
    const [b2, a2] = transform(b, a);
    return [a2, b2];
  }
  if (a.type !== "delete" || b.type !== "delete") {
    return [a, b];
  }
  const ad = a;
  const bd = b;
  const aStart = ad.pos;
  const aEnd = ad.pos + ad.len;
  const bStart = bd.pos;
  const bEnd = bd.pos + bd.len;
  if (aEnd <= bStart) return [ad, { ...bd, pos: bd.pos - ad.len }];
  if (bEnd <= aStart) return [{ ...ad, pos: ad.pos - bd.len }, bd];
  if (aStart < bStart) {
    if (aEnd < bEnd)
      return [
        ad,
        { ...bd, pos: bStart, len: bd.len - (aEnd - bStart) },
      ];
    return [ad, { ...bd, len: Math.max(0, bStart - bd.pos) }];
  }
  if (aStart > bStart) {
    if (aEnd > bEnd)
      return [
        { ...ad, pos: bStart, len: ad.len - (bEnd - aStart) },
        bd,
      ];
    return [{ ...ad, len: Math.max(0, ad.pos + ad.len - bEnd) }, bd];
  }
  if (aEnd === bEnd) {
    if (ad.clientId < bd.clientId) return [ad, { ...bd, len: 0 }];
    return [{ ...ad, len: 0 }, bd];
  }
  if (aEnd < bEnd) return [ad, { ...bd, pos: aStart, len: bd.len - ad.len }];
  return [{ ...ad, pos: bStart, len: ad.len - bd.len }, bd];
}
