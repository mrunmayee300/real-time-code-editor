import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function App() {
  const [roomId, setRoomId] = useState("demo-room");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Collaborative Editor</h1>
      <form
        className="flex flex-col gap-3 w-full max-w-sm"
        onSubmit={(e) => {
          e.preventDefault();
          const id = roomId.trim() || "demo-room";
          navigate(`/room/${encodeURIComponent(id)}`);
        }}
      >
        <label className="text-sm text-zinc-400">Room ID</label>
        <input
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-600/60"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />
        <button
          type="submit"
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500"
        >
          Open room
        </button>
      </form>
    </div>
  );
}
