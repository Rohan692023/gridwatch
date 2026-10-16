# GridWatch — Microgrid Load-Shedding Dispatcher

GridWatch is a full-stack simulation of a real-time power grid dispatch system. It models a microgrid with multiple demand zones (hospitals, residential sectors, industrial parks, etc.), simulates live demand, and — when demand exceeds available supply — automatically decides which zones to shed using a custom optimization algorithm, while keeping critical infrastructure online.

Built to combine an electrical engineering problem (load shedding / demand response) with a full MERN stack implementation, including a hand-written combinatorial optimizer instead of a black-box solver library.

## Why this exists

Utilities and campuses/small grids with unstable supply often shed load manually and without a consistent, auditable policy. GridWatch explores what a lightweight, transparent, data-driven dispatcher could look like: every automatic decision is explainable (it's the output of a deterministic algorithm, not a black box) and every action — automatic or manual — is logged permanently.

## Core features

- **Real-time telemetry simulation** — a time-of-day-aware demand curve per zone, streamed live over WebSockets.
- **Custom optimization engine** — a 0/1 knapsack dynamic-programming solver (written from scratch, no LP library) that decides which non-critical zones stay on when supply is short, weighted by priority tier and fairness history. See [`backend/services/optimizationEngine.js`](backend/services/optimizationEngine.js).
- **Fairness/rotation logic** — zones that have already absorbed more downtime are favored to stay on in future shortages.
- **Role-based access control** — Admin / Operator / Viewer roles enforced on both API and UI.
- **Manual override** — operators can force a zone on/off, with a mandatory logged reason (critical zones cannot be manually shed).
- **Append-only audit log** — every automatic and manual shed/restore event, filterable by zone, action, and date range.
- **Live dashboard** — zone status grid, demand-vs-supply chart, shortage/critical alerts.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), Tailwind CSS, Recharts, Socket.io-client, React Router |
| Backend | Node.js, Express, Socket.io |
| Database | MongoDB (Mongoose) |
| Auth | JWT (access + refresh tokens), bcrypt |
| Deployment | Docker, docker-compose, nginx (frontend), any Node host (backend) |

## Architecture

```
┌─────────────┐      REST + WebSocket      ┌─────────────┐
│   React SPA │ ─────────────────────────▶ │  Express API │
│  (Vite/nginx)│ ◀───────────────────────── │  + Socket.io │
└─────────────┘                             └──────┬───────┘
                                                     │
                                        ┌────────────┼────────────┐
                                        │            │            │
                                 Demand Simulator  Optimization  MongoDB
                                 (services/)        Engine       (Mongoose)
                                                     (services/)
```

Every few seconds, the backend's dispatch tick:
1. Simulates fresh demand per zone.
2. Compares total demand to the admin-configured supply capacity.
3. If there's a shortfall, runs the knapsack optimizer to choose which zones stay on.
4. Persists status changes and audit log entries.
5. Broadcasts the new grid state to all connected clients over Socket.io.

## Getting started (local development)

### Prerequisites
- Node.js 18+
- MongoDB running locally, or a MongoDB Atlas connection string

### 1. Backend

```bash
cd backend
cp .env.example .env    # fill in MONGO_URI, JWT secrets, etc.
npm install
npm run seed             # creates a demo admin user + demo zones
npm run dev
```

Set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in the backend environment before running the seed command. The seed script does not use a default password.

### 2. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Visit `http://localhost:5173`.

### 3. Or run everything with Docker Compose

```bash
cp .env.example .env    # set production secrets and public URLs
docker compose up --build
```

To create the initial admin inside the backend container:

```bash
docker compose run --rm backend npm run seed
```

## Deployment

This is deployable as two independent services plus a database:

- **Database**: MongoDB Atlas (free tier is enough for a demo). Use the standard `mongodb://` connection string, not `mongodb+srv://`, if you're behind a network that blocks SRV DNS lookups.
- **Backend**: Render, Railway, or Fly.io — deploy the `backend/` folder (or the provided `Dockerfile`), set the environment variables from `.env.example`.
- **Frontend**: Vercel, Netlify, or the provided `Dockerfile` (nginx) behind Render/Railway — set `VITE_API_URL` and `VITE_SOCKET_URL` to your deployed backend's URL.
- Update `CLIENT_ORIGIN` on the backend to your deployed frontend's URL (for CORS) and the Socket.io CORS config in `server.js`.

## Security notes

- Passwords hashed with bcrypt (cost factor 12), never stored or logged in plain text.
- JWT access tokens are short-lived; refresh tokens are used to silently re-issue them.
- All state-changing routes are behind `protect` (auth) and `authorize` (role) middleware.
- `express-mongo-sanitize` strips `$`/`.` operators from user input to prevent NoSQL injection.
- `helmet` sets standard security headers; CORS is locked to a configured origin.
- Rate limiting on all `/api` routes, with tighter limits on auth endpoints and manual overrides.
- Public registration always creates a `viewer` — role escalation requires an existing admin.
- The audit log is append-only at the application layer: no route ever updates or deletes an entry.
- Socket.io connections require a valid JWT at handshake time — no anonymous access to live grid data.

## Possible extensions

- PDF/CSV export of audit logs and downtime reports.
- Email/SMS alerting on critical overload.
- Multi-grid support (one admin account managing several independent microgrids).
- Swap the demand simulator for real smart-meter data ingestion.

## License

MIT — see [LICENSE](LICENSE).
