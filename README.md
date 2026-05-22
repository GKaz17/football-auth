# Football Formation Authentication System

A visual-password authentication prototype where users register and log in by arranging 10 outfield football players on a pitch.

The project is separate from the Pass It On bartering app and uses its own frontend, backend, and database.

## Tech Stack

- Frontend: React, Vite, React Bootstrap, CSS
- Backend: Node.js, Express.js
- Database: MongoDB with Mongoose
- Auth: bcrypt password hashing and JWT tokens

## Project Structure

```text
football-auth/
  frontend/
    src/
      components/
      pages/
  backend/
    Models/
    Routes/
    middleware/
    utils/
```

## Coordinate System

Formation points are stored in a stable virtual pitch size of `720 x 460`, regardless of the browser size.

The backend compares each numbered player against the same numbered saved player with a default tolerance of `30` coordinate units.

## Setup

1. Install backend dependencies:

```bash
cd backend
npm install
```

2. Create `backend/.env` from `backend/.env.example` and set `MONGO_URI` and `JWT_SECRET`.

3. Install frontend dependencies:

```bash
cd ../frontend
npm install
```

4. Create `frontend/.env` from `frontend/.env.example` if your API is not on `http://localhost:5000`.

5. Start the backend:

```bash
cd ../backend
npm run dev
```

6. Start the frontend:

```bash
cd ../frontend
npm run dev
```

## API Endpoints

| Method | Route | Description |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Save user credentials and formation |
| `POST` | `/api/auth/login` | Verify credentials and formation |
| `GET` | `/api/auth/me` | Return the authenticated user |

## Formation Payload Example

```json
[
  { "x": 120, "y": 340 },
  { "x": 200, "y": 280 },
  { "x": 310, "y": 280 },
  { "x": 420, "y": 280 },
  { "x": 200, "y": 200 },
  { "x": 310, "y": 180 },
  { "x": 420, "y": 200 },
  { "x": 220, "y": 120 },
  { "x": 310, "y": 100 },
  { "x": 400, "y": 120 }
]
```

