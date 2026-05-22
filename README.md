# Football Formation Authentication System

## Overview

This is a creative authentication system built with the MERN stack. Users register and log in using a football formation as a visual password.

The goalkeeper is fixed as player `1`. The user arranges the 10 outfield players, numbered `2` to `11`, on the pitch. During login, the user recreates the same formation. If the entered formation matches the saved formation within a tolerance radius, access is granted.

## Demo Video

[Google Drive demo video]https://drive.google.com/file/d/1WsUSdCjFvHtMbnE4VnMS_haXnqIzf3wG/view?usp=sharing

## Research
https://docs.google.com/document/d/1TJKJbku6cf592QrorZFxKFlFcH0MRhWyIE8u_Wn7XoQ/edit?usp=sharing

## Creative Authentication Method

This system adds a visual authentication step to a normal username, email, and password login.

Registration:

- The user enters account details.
- The user chooses or creates a football formation.
- The 10 outfield player coordinates are saved as the visual password.

Login:

- The user enters their username/email and password.
- The user recreates the saved football formation.
- The backend compares the login coordinates against the saved coordinates.
- If the password is correct and all 10 player positions match within tolerance, the user is authenticated.

## Core Requirements Covered

- User registration and login
- Password hashing with bcrypt
- JWT token-based authentication
- Creative visual authentication using football formations
- React frontend
- Node.js and Express backend
- MongoDB database integration with Mongoose
- Local file database fallback for testing when MongoDB Atlas is unavailable

## Tech Stack

- Frontend: React, Vite, React Bootstrap, CSS
- Backend: Node.js, Express.js
- Database: MongoDB with Mongoose
- Authentication: bcrypt and JWT

## How The Formation Matching Works

The pitch uses a stable `720 x 460` coordinate system.

Each outfield player has an `{ x, y }` position. During login, the backend compares each saved player coordinate with the matching login coordinate.

The system uses a tolerance radius of `30`, so the user does not need to click the exact same pixel.

```js
distance = Math.sqrt((loginX - savedX) ** 2 + (loginY - savedY) ** 2)
```

If all 10 outfield players are within the tolerance radius, the formation is accepted.

## Project Structure

```text
football-auth/
  frontend/
    src/
      components/
      data/
      pages/
  backend/
    Models/
    Routes/
    data/
    middleware/
    utils/
```

## Setup Instructions

Install backend dependencies:

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
CLIENT_ORIGIN=http://localhost:5173
FORMATION_TOLERANCE=30
USE_FILE_DB=false
```

If MongoDB Atlas is blocked during local testing, set:

```env
USE_FILE_DB=true
```

Start the backend:

```bash
npm run dev
```

Install frontend dependencies:

```bash
cd ../frontend
npm install
```

Start the frontend:

```bash
npm run dev
```

## API Endpoints

| Method | Route | Description |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Saves user credentials and formation |
| `POST` | `/api/auth/login` | Verifies credentials and formation |
| `GET` | `/api/auth/me` | Returns the authenticated user using the JWT token |

## Demo Notes

For a simple demo, choose the same formation template during registration and login, such as `4-3-3 Holding`.

If `USE_FILE_DB=true`, registered users are stored locally in:

```text
backend/data/users.json
```

