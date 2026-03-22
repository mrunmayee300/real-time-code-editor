import Editor from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { debounce } from "../services/debounce";
import type { Op } from "../services/ot";
import { applyOp } from "../services/ot";
import { getSocket } from "../services/socket";

type Props = {
  roomId: string;
  clientId: string;
};

export function CollabEditor({ roomId, clientId }: Props) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const ignoreChange = useRef(false);
  const [value, setValue] = useState("");
  const [ready, setReady] = useState(false);
  const [running, setRunning] = useState(false);
  const [runOut, setRunOut] = useState("");

  const runCode = useCallback(async () => {
    const code = editorRef.current?.getModel()?.getValue() ?? value;
    setRunning(true);
    setRunOut("");
    try {
      const res = await fetch("/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_code: code, language: "python" }),
      });
      const data = (await res.json()) as {
        output?: string;
        error?: string;
        detail?: string;
      };
      if (!res.ok) {
        setRunOut(
          [data.error, data.detail].filter(Boolean).join("\n") || `HTTP ${res.status}`
        );
        return;
      }
      setRunOut(data.output ?? "(no output)");
    } catch {
      setRunOut("Request failed");
    } finally {
      setRunning(false);
    }
  }, [value]);

  const emitCursor = useMemo(
    () =>
      debounce(
        (
          line: number,
          column: number,
          el?: number,
          ec?: number
        ) => {
          getSocket().emit("cursor_move", {
            roomId,
            clientId,
            line,
            column,
            selectionEndLine: el,
            selectionEndColumn: ec,
          });
        },
        40
      ),
    [roomId, clientId]
  );

  const emitOps = useMemo(
    () =>
      debounce((ops: Op[]) => {
        for (const op of ops) {
          getSocket().emit("code_change", { roomId, clientId, op });
        }
      }, 80),
    [roomId, clientId]
  );

  useEffect(() => {
    const s = getSocket();
    const onRoomState = (p: {
      roomId: string;
      content: string;
      version: number;
    }) => {
      if (p.roomId !== roomId) return;
      ignoreChange.current = true;
      setValue(p.content);
      setReady(true);
      requestAnimationFrame(() => {
        ignoreChange.current = false;
      });
    };
    const onCode = (p: {
      roomId: string;
      clientId: string;
      op: Op;
    }) => {
      if (p.roomId !== roomId) return;
      if (p.clientId === clientId) return;
      const ed = editorRef.current;
      if (!ed) return;
      const model = ed.getModel();
      if (!model) return;
      ignoreChange.current = true;
      const cur = model.getValue();
      const next = applyOp(cur, p.op);
      if (next !== cur) {
        ed.executeEdits("remote", [
          {
            range: model.getFullModelRange(),
            text: next,
            forceMoveMarkers: true,
          },
        ]);
        setValue(next);
      }
      requestAnimationFrame(() => {
        ignoreChange.current = false;
      });
    };
    s.on("room_state", onRoomState);
    s.on("code_change", onCode);
    return () => {
      s.off("room_state", onRoomState);
      s.off("code_change", onCode);
    };
  }, [clientId, roomId]);

  const onMount = useCallback(
    (ed: editor.IStandaloneCodeEditor) => {
      editorRef.current = ed;
      ed.onDidChangeCursorSelection(() => {
        const sel = ed.getSelection();
        if (!sel) return;
        const p = sel.getStartPosition();
        const e = sel.getEndPosition();
        emitCursor(
          p.lineNumber,
          p.column,
          e.lineNumber,
          e.column
        );
      });
      ed.onDidChangeModelContent((e) => {
        if (ignoreChange.current) return;
        const model = ed.getModel();
        if (!model) return;
        const ops: Op[] = [];
        for (const c of e.changes) {
          const start = model.getOffsetAt({
            lineNumber: c.range.startLineNumber,
            column: c.range.startColumn,
          });
          const end = model.getOffsetAt({
            lineNumber: c.range.endLineNumber,
            column: c.range.endColumn,
          });
          const delLen = end - start;
          if (delLen > 0) {
            ops.push({
              type: "delete",
              pos: start,
              len: delLen,
              clientId,
            });
          }
          if (c.text.length > 0) {
            ops.push({
              type: "insert",
              pos: start,
              text: c.text,
              clientId,
            });
          }
        }
        if (ops.length) emitOps(ops);
      });
    },
    [clientId, emitCursor, emitOps]
  );

  return (
    <div className="flex flex-col gap-2 h-full min-h-0 w-full">
      <div className="shrink-0">
        <button
          type="button"
          onClick={runCode}
          disabled={running || !ready}
          className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50 disabled:pointer-events-none"
        >
          Run Code
        </button>
      </div>
      <div className="relative flex-1 min-h-[280px] rounded-lg border border-zinc-800 overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage="typescript"
          theme="vs-dark"
          value={value}
          onChange={(v) => setValue(v ?? "")}
          onMount={onMount}
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            scrollBeyondLastLine: false,
          }}
        />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80 text-sm text-zinc-400">
            Loading…
          </div>
        )}
      </div>
      <pre className="shrink-0 min-h-[120px] max-h-48 overflow-auto rounded-md border border-zinc-800 bg-black px-3 py-2 font-mono text-xs text-green-400 whitespace-pre-wrap">
        {running ? "Running…" : runOut}
      </pre>
    </div>
  );
}
