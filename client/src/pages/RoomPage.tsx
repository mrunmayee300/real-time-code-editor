import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CollabEditor } from "../components/CollabEditor";
import { getSocket } from "../services/socket";

export function RoomPage() {
  const { roomId: raw } = useParams();
  const roomId = raw ?? "demo-room";
  const clientIdRef = useRef(crypto.randomUUID());
  const [log, setLog] = useState<string[]>([]);
  const [version, setVersion] = useState(0);
  const [cursors, setCursors] = useState<
    Record<string, { line: number; column: number }>
  >({});

  const pushLog = useCallback((m: string) => {
    setLog((prev) => [...prev.slice(-50), m]);
  }, []);

  useEffect(() => {
    setCursors({});
    setLog([]);
    setVersion(0);
    const s = getSocket();
    const cid = clientIdRef.current;
    const join = () => {
      s.emit("join_room", { roomId, clientId: cid });
    };
    if (s.connected) join();
    else s.on("connect", join);
    const onJoined = (p: { roomId: string; clientId: string }) => {
      if (p.roomId !== roomId) return;
      if (p.clientId !== cid) pushLog(`joined: ${p.clientId.slice(0, 8)}…`);
    };
    const onLeft = (p: { roomId: string; clientId: string }) => {
      if (p.roomId !== roomId) return;
      pushLog(`left: ${p.clientId.slice(0, 8)}…`);
    };
    const onState = (p: { roomId: string; version: number }) => {
      if (p.roomId !== roomId) return;
      setVersion(p.version);
    };
    const onCode = (p: { roomId: string; version?: number }) => {
      if (p.roomId !== roomId) return;
      if (typeof p.version === "number") setVersion(p.version);
    };
    const onCursor = (p: {
      roomId: string;
      clientId: string;
      line: number;
      column: number;
    }) => {
      if (p.roomId !== roomId) return;
      if (p.clientId === cid) return;
      setCursors((prev) => ({
        ...prev,
        [p.clientId]: { line: p.line, column: p.column },
      }));
    };
    s.on("user_joined", onJoined);
    s.on("user_left", onLeft);
    s.on("room_state", onState);
    s.on("code_change", onCode);
    s.on("cursor_move", onCursor);
    return () => {
      s.emit("leave_room", { roomId, clientId: cid });
      s.off("connect", join);
      s.off("user_joined", onJoined);
      s.off("user_left", onLeft);
      s.off("room_state", onState);
      s.off("code_change", onCode);
      s.off("cursor_move", onCursor);
    };
  }, [roomId, pushLog]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between gap-4 border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link className="text-sm text-zinc-400 hover:text-zinc-200" to="/">
            ← Home
          </Link>
          <span className="text-sm text-zinc-300 truncate font-mono">{roomId}</span>
        </div>
        <span className="text-xs text-zinc-500 font-mono">v{version}</span>
      </header>
      <div className="flex flex-1 min-h-0">
        <aside className="w-56 shrink-0 border-r border-zinc-800 p-3 text-xs text-zinc-400 space-y-4 overflow-auto">
          <div>
            <div className="text-zinc-500 uppercase tracking-wide mb-2">Cursors</div>
            <ul className="space-y-1 font-mono">
              {Object.entries(cursors).map(([id, pos]) => (
                <li key={id}>
                  {id.slice(0, 8)}… L{pos.line}:{pos.column}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-zinc-500 uppercase tracking-wide mb-2">Activity</div>
            <ul className="space-y-1 font-mono">
              {log.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
          </div>
        </aside>
        <main className="flex-1 p-3 min-h-0">
          <CollabEditor roomId={roomId} clientId={clientIdRef.current} />
        </main>
      </div>
    </div>
  );
}
