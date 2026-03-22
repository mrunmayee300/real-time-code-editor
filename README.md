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

---

## Deployment

Deploy the **API** and **static frontend** separately. Use **MongoDB Atlas** for production.

### Backend (e.g. Render, Railway, Fly.io)

1. Create a Web Service; **root directory** `server`.
2. **Build:** `npm install && npm run build`
3. **Start:** `npm start` (runs `node dist/index.js`)
4. **Environment variables:**

   | Variable        | Description                          |
   | --------------- | ------------------------------------ |
   | `MONGO_URI`     | Atlas connection string              |
   | `RAPIDAPI_KEY`  | RapidAPI key for Judge0 CE           |
   | `PORT`          | Usually set by the host (e.g. Render) |

5. The server listens on `0.0.0.0` and the URL you get (e.g. `https://…onrender.com`) is your **API base URL**.

### Frontend (e.g. Vercel, Netlify, Cloudflare Pages)

1. **Root directory** `client`.
2. **Build:** `npm install && npm run build`
3. **Output directory:** `dist`
4. **API URL at build time** — either:
   - Set **`VITE_BACKEND_URL`** in the host’s env (Vercel → Settings → Environment Variables), **or**
   - Edit **`client/.env.production`** (tracked in git) to your API origin, no trailing slash.

5. Redeploy after changing the API URL.

6. Socket.io and `/execute` must target the **Render (or other) API**, not the Vercel domain — otherwise `wss://…vercel.app/socket.io` will fail.

### Local vs production

- **Local:** leave `VITE_BACKEND_URL` unset in `client/.env` so Vite proxies to `localhost:3001`.
- **Production:** `client/.env.production` supplies `VITE_BACKEND_URL` for `vite build`, or override with the host’s env.

See `client/.env.example`.
