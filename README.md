<div align="center">
<img width="1200" height="475" alt="MediMate Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# MediMate - Medical Escort Service Platform

A full-stack medical escort service platform connecting patients with professional escort services.

## Features

- **AI-Powered Triage** - Smart symptom analysis with Google Gemini
- **Multi-Role System** - Patients, Escorts, and Admin roles
- **Real-time Messaging** - Chat between patients and escorts
- **Order Management** - Complete booking workflow
- **Multi-language** - Chinese and English support
- **Mobile Ready** - Android APK via Capacitor

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite, TailwindCSS |
| Backend | NestJS, TypeScript, Prisma |
| Database | PostgreSQL |
| Auth | JWT + Refresh Token |
| AI | Google Gemini |
| Mobile | Capacitor |

## Getting Started

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (optional)

### Quick Start

1. **Start Database:**
   ```bash
   docker-compose up -d postgres
   ```

2. **Setup Backend:**
   ```bash
   cd server
   cp .env.example .env
   npm install
   npx prisma generate
   npx prisma migrate dev
   npm run start:dev
   ```

3. **Start Frontend:**
   ```bash
   npm install
   npm run dev
   ```

### Access Points

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001/api |
| API Docs | http://localhost:3001/api/docs |

## Project Structure

```
medimate/
├── client/                 # React frontend
│   ├── components/        # UI components
│   ├── services/          # API services
│   └── ...
├── server/                # NestJS backend
│   ├── src/
│   │   ├── modules/       # Feature modules
│   │   ├── prisma/        # Database service
│   │   └── main.ts        # Entry point
│   └── prisma/
│       └── schema.prisma  # Database schema
├── docker-compose.yml     # Docker services
├── SPEC.md               # Technical specification
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token

### Core
- `GET /api/hospitals` - List hospitals
- `GET /api/escorts` - List escorts
- `POST /api/orders` - Create order
- `GET /api/messages` - Get messages

See `SPEC.md` for complete API documentation.

## Environment Variables

**Server (.env):**
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/medimate
JWT_SECRET=your-secret-key
PORT=3001
```

**Client (.env):**
```env
VITE_API_URL=http://localhost:3001/api
VITE_GEMINI_API_KEY=your-gemini-key
```

## License

MIT
