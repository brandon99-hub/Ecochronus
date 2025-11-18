# Mission Game Backend

Pure backend-only REST API for a mobile game that performs real-world missions and earns rewards.

## Tech Stack

- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (Access + Refresh tokens)
- **Storage**: Google Cloud Storage or AWS S3
- **Hosting**: Render or any cloud platform

## Project Structure

```
/src
  /config          # Configuration files (database, JWT, storage)
  /database        # Database connection setup
  /modules
    /auth          # Authentication module (signup, login, refresh)
    /users         # User management (profile, device tracking)
    /missions      # Mission tracking (list, start, progress, complete)
    /proofs        # Proof upload and verification
    /rewards       # Reward issuance and tracking
  /utils           # Utility functions (response, JWT, storage, replay protection)
  /middlewares     # Express middlewares (auth, error handling)
  /app.ts          # Express app setup
  /server.ts       # Server entry point
```

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://postgres:Exlifes_6969@db.gxhaydtuwgmbtwnrhfwf.supabase.co:5432/postgres"

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Google OAuth (for Google Sign-In)
GOOGLE_CLIENT_ID=your-google-oauth-client-id

# Cloud Storage (Google Cloud)
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_KEYFILE=path/to/keyfile.json
GOOGLE_CLOUD_BUCKET_NAME=your-bucket-name

# Cloud Storage (AWS S3 - alternative)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket-name

# Storage Provider (google or aws)
STORAGE_PROVIDER=google
```

### 3. Database Setup

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio to view data
npm run prisma:studio
```

### 4. Run Development Server

```bash
npm run dev
```

### 5. Build for Production

```bash
npm run build
npm start
```

## API Endpoints

All endpoints return JSON with the following format:
```json
{
  "success": boolean,
  "data": any,
  "error": string
}
```

### Authentication (`/api/auth`)

- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login and get tokens
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout (requires auth)

### Users (`/api/users`)

- `GET /api/users/profile` - Get user profile (requires auth)
- `PATCH /api/users/profile` - Update user profile (requires auth)
- `POST /api/users/device` - Update device info (requires auth)

### Missions (`/api/missions`)

- `GET /api/missions` - List all missions (requires auth)
- `POST /api/missions/:missionId/start` - Start a mission (requires auth)
- `PATCH /api/missions/:missionId/progress` - Update mission progress (requires auth)
- `POST /api/missions/:missionId/complete` - Complete a mission (requires auth)

### Proofs (`/api/proofs`)

- `POST /api/proofs/upload-url` - Get signed upload URL (requires auth)
- `POST /api/proofs/:proofId/verify` - Verify uploaded proof (requires auth)
- `GET /api/proofs/:proofId/status` - Get proof status (requires auth)

### Rewards (`/api/rewards`)

- `GET /api/rewards` - List user rewards (requires auth)
- `GET /api/rewards/history` - Get reward history (requires auth)

## Security Features

- **JWT Authentication**: Access and refresh token pattern
- **Replay Attack Protection**: Nonce-based request validation for state-changing operations
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Helmet**: Security headers
- **CORS**: Configurable cross-origin resource sharing

## Database Schema

The Prisma schema includes:
- `User` - User accounts with device tracking
- `RefreshToken` - JWT refresh token storage
- `Mission` - Mission definitions
- `MissionProgress` - User progress on missions
- `Proof` - Uploaded proof files with anti-cheat scores
- `Reward` - Issued rewards
- `Voucher` - Redeemable vouchers

## Development Notes

- All controller functions are stubbed with TODO comments
- Implement business logic in each controller as needed
- Storage utilities support both Google Cloud Storage and AWS S3
- Replay protection uses in-memory nonce storage (consider Redis for production)

## License

ISC

