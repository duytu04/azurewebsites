# Sales Frontend (React)

React + Vite + TypeScript dashboard for managing customers, products, and orders against the Sales API.

## Prerequisites

- Node.js 18+
- npm (ships with Node)

## Setup

```bash
cd frontend
npm install
cp .env.example .env.local # update API base URL as needed
npm run dev
```

By default the app calls the backend at `http://localhost:5000`. Override via `VITE_API_BASE_URL` in `.env.local` (e.g. `https://<your-backend>.azurewebsites.net`).

## Available scripts

- `npm run dev` – start Vite dev server (http://localhost:5173)
- `npm run build` – build production bundle into `dist/`
- `npm run preview` – preview the production build locally

## Features

- JWT authentication (register + login)
- Customer CRUD: create, list, search by email (backend endpoint)
- Product management: create, adjust stock (with validation)
- Order creation: validates inventory, calculates totals, shows detail view

## Deployment (Azure)

1. **Build** the app locally or in your pipeline: `npm ci && npm run build`.
2. **Static Web Apps**: point the deploy step to `dist/`.
3. **App Service**: deploy the `dist/` folder, configure a static site (or use the Node runtime with `npm run build` in startup command).
4. Set environment variable `VITE_API_BASE_URL` (for SWA use configuration settings; for App Service set `VITE_API_BASE_URL` in Application Settings) so the frontend targets the deployed backend.
5. Update the backend CORS (`Cors:AllowedOrigins`) to include the frontend domain.

## Testing walkthrough

1. Register a user or login with the seeded admin.
2. Create a couple of products and adjust stock.
3. Add a customer.
4. Create an order with multiple items and confirm total + inventory adjustments.
5. Use the order lookup box to fetch the same order via API.

> Add deployment screenshots (Azure SQL, App Service, frontend pages) once the services are live.
