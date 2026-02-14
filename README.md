# Shop Finance System

Full-stack mobile-first app for small shop/salon/local service owners to:
- register/login with password or PIN
- record daily sales
- view daily total and monthly income

## Tech
- Frontend (mobile): Expo + React Native
- Backend: Node.js + Express
- Database: SQLite

## Project Structure
- `server/` backend API + SQLite DB
- `app/` Expo mobile app

## Requirements
- Node.js 18.x or 20.x
- npm 9+

## 1) Install Dependencies
From project root:
```bash
npm run install:all
```

Or install separately in `server` and `app`.

## 2) Run Backend
```bash
cd server
copy .env.example .env
npm run dev
```

Backend tries `PORT` from `.env` (default `5000`).
If that port is busy, it auto-starts on the next free port (`5001`, `5002`, ...).

## 3) Run Mobile App
```bash
cd app
npm run start
```

Open with Expo Go (Android/iOS) or run web.

## Run From Root (Optional)
```bash
npm run start:server
npm run start
```

## Deploy On Render
1. Push code to GitHub (already done).
2. Open Render dashboard and click `New` -> `Blueprint`.
3. Select this repository: `MeenakshiSharma101/Shop-finance`.
4. Render will detect `render.yaml` and create `shop-finance-api`.
5. After deploy, copy backend URL (example: `https://shop-finance-api.onrender.com`).
6. Update app API URL in `app/.env`:
```bash
EXPO_PUBLIC_API_BASE_URL=https://shop-finance-api.onrender.com
```
7. Restart Expo:
```bash
cd app
npm run start -c
```

Note: Render free plan may sleep after inactivity.

## API URL Configuration
Create `app/.env` from `app/.env.example` and set:
```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000
```

For physical phone testing on same Wi-Fi, use your LAN IP:
```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:5000
```

For Android emulator, `10.0.2.2` is used by default when no env var is set.

## Important
- Run Expo commands inside `app` (or use root scripts). Avoid `npx expo start` from root.

## Features
- Auth: register, login (password or PIN), JWT session
- Dashboard summary:
  - Today sales total
  - Current month income
  - Last 30 days daily graph data
- Add sale entries
- Recent sales list
- Responsive glassmorphism + gradient finance-style UI
