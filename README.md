# Football Formation Authentication System

## Overview

This is a creative authentication system built with the MERN stack. Users register and log in using a football formation as a visual password.

The goalkeeper is fixed as player `1`. The user arranges the 10 outfield players, numbered `2` to `11`, on the pitch. During login, the user recreates the same formation. If the entered formation matches the saved formation within a tolerance radius, access is granted.

## Demo Video

[Google Drive demo video](https://drive.google.com/file/d/1WsUSdCjFvHtMbnE4VnMS_haXnqIzf3wG/view?usp=sharing)

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

Use Node.js 22. From the repository root, install both applications:

```bash
npm run setup
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

For Atlas, copy the current connection string from the cluster's **Connect > Drivers** panel, include the `football-auth` database name, and use a database user with read/write access. Resume the cluster if it is paused and add your current public IP under **Network Access**. Percent-encode special characters in the database password. Keep the real URI in `.env`, which Git ignores.

Check the actual MongoDB connection before starting the app:

```bash
npm run check:db
```

This command always tests MongoDB, even when the local demo fallback is enabled. It prints a database ping result without exposing the URI or password.

If Atlas is unavailable and you only need an offline local demo, set:

```env
USE_FILE_DB=true
```

Start the backend:

```bash
npm run dev
```

In a second terminal at the repository root, start the frontend:

```bash
npm run dev:frontend
```

Open `http://localhost:5173`. Vite forwards `/api` requests to Express on port 5000. In production, React uses the same origin as Express; `VITE_API_URL` can be left blank.

## Heroku Deployment

The root `package.json` and `Procfile` allow Heroku to build the React frontend and run the Express backend in one web dyno. Express serves `frontend/dist`, and listens on Heroku's assigned `PORT`.

1. Push the project to GitHub. Add teammates under the repository's **Settings > Collaborators**.
2. Create a Heroku app using the Node.js buildpack. Connect `GKaz17/football-auth` under **Deploy > GitHub**, or use the Heroku CLI with this repository.
3. Under **Settings > Config Vars**, set:

| Variable | Value |
| --- | --- |
| `MONGO_URI` | Your current Atlas URI with the `football-auth` database name |
| `JWT_SECRET` | A new random secret of at least 32 characters |
| `USE_FILE_DB` | `false` |
| `NODE_ENV` | `production` |
| `FORMATION_TOLERANCE` | `30` |
| `CLIENT_ORIGIN` | Your actual Heroku app URL, including `https://` and without a trailing slash |

Generate a JWT secret locally with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. Paste it into Heroku Config Vars, never into GitHub. Replace any Atlas password that was previously shared in chat. Do not set `PORT` yourself or use a localhost `VITE_API_URL` for the deployed build.

4. Allow the deployment's outbound traffic in Atlas **Network Access**. Standard Heroku dynos do not have a fixed outbound IP; use a static outbound IP service for a restricted allowlist. If your class uses temporary access from anywhere (`0.0.0.0/0`), use a dedicated database user restricted to `football-auth` and remove the broad rule after the demo.
5. Deploy `main`, then open `/health`. A working MERN deployment returns `{"status":"ok","database":"mongodb"}`. Test registration, sign out, log in, restart the dyno, and log in again with the same account.

The app refuses to start with file storage in production. Heroku's filesystem is temporary, so `users.json` is only a local demo option. Previous JSON demo accounts are not automatically copied to MongoDB; register them again after switching storage.

Official references: [MongoDB connection troubleshooting](https://www.mongodb.com/docs/atlas/troubleshoot-connection/), [Heroku Node.js deployment](https://devcenter.heroku.com/articles/deploying-nodejs), and [Heroku outbound IP addresses](https://help.heroku.com/VKVCYAQU/why-is-my-app-s-ip-address-being-blocked-by-third-parties).

## Verification

```bash
npm run build
npm test
npm start
```

The automated tests run a real temporary MongoDB process, verify password hashing, unique accounts, JWT protection and formation matching, and confirm that an account still works after reconnecting and restarting the backend process. They never use your Atlas accounts. The first test run downloads the MongoDB test binary.

GitHub runs these tests and the production build under the repository's **Actions > MERN checks** tab. On Windows, the MongoDB test download is large; the GitHub Linux runner avoids downloading that Windows binary to your laptop.

After building, open `http://localhost:5000` to check the same combined frontend/backend arrangement used on Heroku.

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

## Development Support Log

This project was developed with Codex support during the final build and presentation-preparation phase.

Support covered:

- React/Vite frontend setup and explanation.
- Node.js/Express backend setup and explanation.
- Register, login, and current-user API routes.
- bcrypt password hashing.
- JWT token creation, browser localStorage session handling, and protected `/me` verification.
- Football pitch coordinate storage and tolerance-based formation matching.
- Fixed goalkeeper logic and outfield player numbering from 2 to 11.
- Formation templates to make authentication repeatable during the demo.
- CTA feedback fixes for registration and login usability.
- Dashboard page to show successful authentication.
- MongoDB Atlas troubleshooting and local file database fallback for demo reliability.
- README updates for assessment submission.

Key clarification: the React frontend calls the Express backend with `fetch`; the backend does not call the frontend.

GitHub/version-control note: GitHub Desktop was used for repository publishing. Secrets and local runtime data should remain ignored: `.env`, `node_modules/`, `dist/`, and `backend/data/users.json`.

A fuller project-context note is stored in the Jarvis Knowledge Hub Drive reference packet for DV200.
