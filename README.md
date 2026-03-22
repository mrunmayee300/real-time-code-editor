# Collaborative Code Editor

A real-time, room-based code editor with WebSocket sync, operational transformation, MongoDB persistence, and remote code execution via Judge0 (RapidAPI).

## Features

- Real-time collaborative editing with conflict handling (OT)
- Room-based sessions and live presence (cursors, join/leave)
- WebSocket communication (Socket.io)
- MongoDB persistence and autosave
- Run code through the backend (`POST /execute` → Judge0)

## Tech Stack

| Layer    | Technologies                          |
| -------- | ------------------------------------- |
| Frontend | React (TypeScript), Monaco, Tailwind  |
| Backend  | Node.js, Express, Socket.io           |
| Database | MongoDB (Mongoose)                    |

## Concepts

- WebSockets & event-driven sync  
- Operational Transformation (OT)  
- Real-time distributed editing  
- Client–server architecture  
- REST APIs  

## Folder Structure

```
editor/
├── client/
│   └── src/
│       ├── components/
│       ├── pages/
│       └── services/
└── server/
    └── src/
        ├── controllers/
        ├── models/
        ├── sockets/
        └── utils/
```

## Setup

1. **MongoDB** — running locally or Atlas URI in `server/.env` as `MONGO_URI`.

2. **Judge0** — set `RAPIDAPI_KEY` in `server/.env` (RapidAPI Judge0 CE).

3. **Server** — from `server/`:

   ```bash
   npm install && npm run dev
   ```

4. **Client** — from `client/`:

   ```bash
   npm install && npm run dev
   ```

5. Open the Vite URL (default `http://localhost:5173`) and create or join a room.

Copy `server/.env` from a template: `PORT`, `MONGO_URI`, `CLIENT_URL`, `RAPIDAPI_KEY`.
