# AI Mystery Room

A full-stack detective mystery game built with React, Vite, Express, MongoDB/Mongoose, and Gemini. Read [SPEC.md](./SPEC.md) for the product and API requirements.

## Run locally

1. Install Node.js 20 or newer.
2. Copy `server/.env.example` to `server/.env`; set `MONGODB_URI` and `GEMINI_API_KEY`. Gemini needs working internet access from the backend. If the key is absent or Gemini cannot be reached, the app labels the case as local and uses a varied, premise-aware case library rather than returning the same demo every time.
3. Install and run from the repository root:

   ```sh
   npm install
   npm install --prefix client
   npm install --prefix server
   npm run dev
   ```

   The client runs on `http://localhost:5173` and the API on `http://localhost:5000`.

4. Create a case, examine evidence, request a hint, accuse a suspect, and read the final report. Memory mode loses cases when the server restarts.

## Configuration

Backend variables are shown in `server/.env.example`. `GEMINI_MODEL` can select a supported Gemini model. The frontend can target a hosted API with `VITE_API_URL` (for example, `https://your-api.example.com/api`). Never put the Gemini key in client configuration.

## Deployment

Deploy `server` as a Node web service and `client` as a static Vite site. Provision MongoDB Atlas, set backend `MONGODB_URI`, `GEMINI_API_KEY`, and `CLIENT_URL` to the deployed frontend origin, then set frontend `VITE_API_URL` to the deployed API `/api` URL and run `npm run build --prefix client`. Hosting accounts, secrets, and production URLs must be supplied by the project owner; deployment is not performed by the local build.
