# EcoChronos: Wrath of Zeus - Backend API

A pure backend-only REST API for **EcoChronos**, an educational adventure game where players restore balance to Earth as the chosen Avatar of the gods. Built with TypeScript and Express, featuring JWT authentication, mission tracking, learning hub, god selection, corruption system, badges, and reward management.

## 🚀 Features

### Core Features
- ✅ **User Authentication** - Email/password and Google OAuth sign-in
- ✅ **Mission System** - Create, track, and complete missions with corruption clearing
- ✅ **Proof Verification** - Upload and verify mission proof (photos/videos)
- ✅ **Anti-Cheat System** - Basic validation with extensible architecture
- ✅ **Reward Management** - Automatic reward issuance with duplicate prevention
- ✅ **Replay Attack Protection** - Nonce-based request validation

### EcoChronos Game Features
- ✅ **God Selection** - Choose your divine patron (Zeus, Athena, Artemis, Persephone)
- ✅ **Learning Hub** - Educational lessons and quiz battles
- ✅ **Map & Corruption System** - Track corruption levels across regions
- ✅ **XP & Leveling** - Progressive leveling system with XP rewards
- ✅ **Badge System** - Earn achievements and rewards
- ✅ **Eco-Karma** - Track environmental impact and rewards
- ✅ **Mission Filtering** - Filter by category, god, or region

### Technical Features
- ✅ **RESTful API** - Clean JSON-only endpoints
- ✅ **Type Safety** - Full TypeScript support with Drizzle ORM

## 🛠 Tech Stack

- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT (Access + Refresh tokens)
- **OAuth**: Google Sign-In support
- **Storage**: Google Cloud Storage
- **Validation**: Zod schema validation
- **Hosting**: Render or any cloud platform

## 📁 Project Structure

```
/src
  /config          # Configuration files (database, JWT, storage, OAuth)
  /database        # Drizzle ORM schema, migrations, and connection
    - schema.ts    # Database schema definitions
    - index.ts     # Database client initialization
    - generate.ts  # Table generation script
    - seed.ts      # Database seeding script
  /modules
    /auth          # Authentication (signup, login, Google OAuth, refresh, logout)
    /users         # User management (profile, device tracking, stats)
    /missions      # Mission tracking (list, start, progress, complete with filtering)
    /proofs        # Proof upload (signed URLs) and verification with anti-cheat
    /rewards       # Reward issuance and tracking (duplicate prevention)
    /gods          # God selection (list, select, get selected god)
    /learning      # Learning hub (lessons, quizzes, progress tracking)
    /map           # Map state and corruption system (regions, corruption clearing)
    /badges        # Badge system (list, claim, auto-awarding)
  /utils           # Utilities (response formatting, JWT, storage, anti-cheat, password hashing)
  /middlewares     # Express middlewares (auth, error handling, replay protection)
  /app.ts          # Express app setup and route registration
  /server.ts       # Server entry point and graceful shutdown
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

# Google Cloud Storage
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_KEYFILE=path/to/keyfile.json
GOOGLE_CLOUD_BUCKET_NAME=your-bucket-name
```

### 3. Database Setup

```bash
# Create database tables
npm run db:generate

# (Optional) Seed database with test missions
npm run db:seed
```

The `db:generate` command will create all required tables including:
- Core tables: `users`, `missions`, `mission_progress`, `proofs`, `rewards`, `vouchers`, `refresh_tokens`
- EcoChronos tables: `lessons`, `quiz_questions`, `learning_progress`, `badges`, `user_badges`, `map_regions`
- Enums: `progress_status`, `proof_status`

**Note**: The seed script checks for existing data before inserting, so it's safe to run multiple times without creating duplicates.

To seed the database with EcoChronos missions, lessons, quizzes, and badges, run `npm run db:seed`.

### 4. Run Development Server

```bash
npm run dev
```

### 5. Build for Production

```bash
npm run build
npm start
```

## 📡 API Endpoints

All endpoints return JSON with the following standardized format:
```json
{
  "success": boolean,
  "data": any,      // Present when success is true
  "error": string   // Present when success is false
}
```

### 🔐 Authentication (`/api/auth`)

All authentication endpoints require replay protection headers (`X-Nonce` and `X-Timestamp`) for POST requests.

#### `POST /api/auth/signup`
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "username"
    },
    "accessToken": "jwt-token",
    "refreshToken": "jwt-refresh-token"
  }
}
```

#### `POST /api/auth/login`
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "deviceId": "optional-device-id",
  "deviceInfo": { "os": "iOS", "version": "16.0" }
}
```

**Response:** Same as signup

#### `POST /api/auth/google`
Sign in with Google OAuth.

**Request Body:**
```json
{
  "idToken": "google-id-token",
  "deviceId": "optional-device-id",
  "deviceInfo": { "os": "Android", "version": "13" }
}
```

**Response:** Same as signup

#### `POST /api/auth/refresh`
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "jwt-refresh-token"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "new-jwt-token"
  }
}
```

#### `POST /api/auth/logout`
Logout and invalidate refresh token. Requires authentication.

**Request Body:**
```json
{
  "refreshToken": "jwt-refresh-token"
}
```

### 👤 Users (`/api/users`)

All endpoints require authentication via `Authorization: Bearer <accessToken>` header.

#### `GET /api/users/profile`
Get current user's profile.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "deviceId": "device-id",
    "deviceInfo": { "os": "iOS", "version": "16.0" },
    "selectedGod": "zeus",
    "xp": 250,
    "level": 2,
    "totalEcoKarma": 50,
    "corruptionCleared": 20,
    "createdAt": "2025-11-18T09:00:00Z",
    "updatedAt": "2025-11-18T09:00:00Z"
  }
}
```

#### `GET /api/users/stats`
Get user statistics including XP, level, badges, and completion stats.

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "level": 5,
      "xp": 1250,
      "xpProgress": {
        "currentLevelXP": 1000,
        "nextLevelXP": 1500,
        "progressPercent": 50
      },
      "totalEcoKarma": 500,
      "corruptionCleared": 100,
      "selectedGod": "artemis",
      "missionsCompleted": 10,
      "lessonsCompleted": 4,
      "badgesEarned": 3
    }
  }
}
```

#### `PATCH /api/users/profile`
Update user profile.

**Request Body:**
```json
{
  "username": "newusername",
  "email": "newemail@example.com"
}
```

#### `POST /api/users/device`
Update device information.

**Request Body:**
```json
{
  "deviceId": "device-id",
  "deviceInfo": { "os": "iOS", "version": "16.0", "model": "iPhone 14" }
}
```

### 🎯 Missions (`/api/missions`)

All endpoints require authentication.

#### `GET /api/missions`
List all active missions with user progress.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `category` (optional): Filter by category (e.g., "forest", "river", "urban", "quiz")
- `god` (optional): Filter by god (e.g., "zeus", "athena", "artemis", "persephone")
- `region` (optional): Filter by region (e.g., "forest_restoration", "river_cleanup", "urban_pollution")

**Response:**
```json
{
  "success": true,
  "data": {
    "missions": [
      {
        "id": "uuid",
        "title": "Complete First Mission",
        "description": "Complete your first mission",
        "type": "action",
        "category": "forest",
        "god": "artemis",
        "region": "forest_restoration",
        "corruptionLevel": 20,
        "isCorruptionMission": true,
        "rewardAmount": 100,
        "requirements": { "minLevel": 1 },
        "isUnlocked": true,
        "progress": {
          "id": "uuid",
          "status": "IN_PROGRESS",
          "progress": 50,
          "startedAt": "2025-11-18T09:00:00Z",
          "completedAt": null
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 10,
      "totalPages": 1
    }
  }
}
```

#### `POST /api/missions/:missionId/start`
Start a mission. Creates or updates mission progress.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "missionId": "uuid",
    "status": "IN_PROGRESS",
    "progress": 0,
    "startedAt": "2025-11-18T09:00:00Z",
    "mission": {
      "id": "uuid",
      "title": "Mission Title",
      "description": "Mission description",
      "type": "action",
      "rewardAmount": 100
    }
  }
}
```

#### `PATCH /api/missions/:missionId/progress`
Update mission progress (0-100%).

**Request Body:**
```json
{
  "progress": 75
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "missionId": "uuid",
    "status": "IN_PROGRESS",
    "progress": 75,
    "mission": { ... }
  }
}
```

#### `POST /api/missions/:missionId/complete`
Complete a mission and automatically issue rewards.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "missionId": "uuid",
    "status": "COMPLETED",
    "progress": 100,
    "completedAt": "2025-11-18T09:30:00Z",
    "mission": {
      "id": "uuid",
      "title": "Mission Title",
      "rewardAmount": 100
    }
  }
}
```

### 📸 Proofs (`/api/proofs`)

All endpoints require authentication. POST endpoints require replay protection headers.

#### `POST /api/proofs/upload-url`
Get a signed URL for uploading proof (photo/video).

**Request Body:**
```json
{
  "missionProgressId": "uuid",
  "type": "photo"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "proofId": "uuid",
    "uploadUrl": "https://storage.googleapis.com/...",
    "expiresAt": "2025-11-18T10:00:00Z",
    "storageKey": "proofs/1234567890-abc.jpg"
  }
}
```

#### `POST /api/proofs/:proofId/verify`
Verify uploaded proof and run anti-cheat checks.

**Response:**
```json
{
  "success": true,
  "data": {
    "proofId": "uuid",
    "status": "APPROVED",
    "antiCheatScore": 0.85,
    "verifiedAt": "2025-11-18T09:35:00Z",
    "checks": [
      { "name": "file_size", "passed": true, "score": 1.0 },
      { "name": "content_type", "passed": true, "score": 1.0 },
      { "name": "advanced_analysis", "passed": true, "score": 0.8 }
    ]
  }
}
```

#### `GET /api/proofs/:proofId/status`
Get proof verification status.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "photo",
    "status": "APPROVED",
    "antiCheatScore": 0.85,
    "verifiedAt": "2025-11-18T09:35:00Z",
    "createdAt": "2025-11-18T09:30:00Z",
    "missionProgress": {
      "id": "uuid",
      "status": "PENDING_REVIEW",
      "mission": {
        "id": "uuid",
        "title": "Photo Challenge",
        "type": "photo"
      }
    }
  }
}
```

### ⚡ Gods (`/api/gods`)

#### `GET /api/gods/list`
List all available gods (public endpoint).

**Response:**
```json
{
  "success": true,
  "data": {
    "gods": [
      {
        "id": "zeus",
        "name": "Zeus",
        "description": "God of Sky and Thunder. Commands lightning and storms.",
        "power": "Thunder Strike",
        "color": "#FFD700"
      },
      {
        "id": "athena",
        "name": "Athena",
        "description": "Goddess of Wisdom and Strategy. Master of tactical thinking.",
        "power": "Wisdom Shield",
        "color": "#4169E1"
      },
      {
        "id": "artemis",
        "name": "Artemis",
        "description": "Goddess of Nature and Hunting. Protector of forests and wildlife.",
        "power": "Nature's Blessing",
        "color": "#228B22"
      },
      {
        "id": "persephone",
        "name": "Persephone",
        "description": "Goddess of Spring and Renewal. Brings life back to corrupted lands.",
        "power": "Spring Renewal",
        "color": "#FF69B4"
      }
    ]
  }
}
```

#### `GET /api/gods/selected`
Get currently selected god (requires authentication).

**Response:**
```json
{
  "success": true,
  "data": {
    "selectedGod": {
      "id": "zeus",
      "name": "Zeus",
      "description": "God of Sky and Thunder. Commands lightning and storms.",
      "power": "Thunder Strike",
      "color": "#FFD700"
    }
  }
}
```

#### `POST /api/gods/select`
Select a god (requires authentication, can only be done once). Requires replay protection headers.

**Request Body:**
```json
{
  "god": "zeus"
}
```

**Response:** Same as `/api/gods/selected`

### 📚 Learning Hub (`/api/learning`)

All endpoints require authentication.

#### `GET /api/learning/lessons`
List all available lessons with user progress.

**Response:**
```json
{
  "success": true,
  "data": {
    "lessons": [
      {
        "id": "uuid",
        "title": "Introduction to Environmental Protection",
        "description": "Learn the basics of protecting our planet",
        "god": "zeus",
        "order": 1,
        "unlocked": true,
        "completed": false,
        "quizScore": null,
        "quizAttempts": 0
      }
    ]
  }
}
```

#### `GET /api/learning/lessons/:lessonId`
Get lesson details with content.

**Response:**
```json
{
  "success": true,
  "data": {
    "lesson": {
      "id": "uuid",
      "title": "Introduction to Environmental Protection",
      "description": "Learn the basics",
      "content": {
        "slides": [
          { "type": "text", "content": "Welcome to EcoChronos!" }
        ]
      },
      "god": "zeus",
      "order": 1,
      "progress": {
        "completed": false,
        "quizScore": null,
        "quizAttempts": 0
      }
    }
  }
}
```

#### `POST /api/learning/lessons/:lessonId/complete`
Mark a lesson as completed (requires authentication).

#### `GET /api/learning/quizzes/:quizId`
Get quiz questions for a lesson (requires authentication).

**Response:**
```json
{
  "success": true,
  "data": {
    "quiz": {
      "lessonId": "uuid",
      "questions": [
        {
          "id": "uuid",
          "question": "Who has summoned you to restore balance?",
          "options": ["Poseidon", "Zeus", "Artemis", "Athena"],
          "order": 1
        }
      ]
    }
  }
}
```

#### `POST /api/learning/quizzes/:quizId/submit`
Submit quiz answers (requires authentication). Requires replay protection headers.

**Request Body:**
```json
{
  "answers": [1, 1, 0, 2]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "score": 75,
    "passed": true,
    "results": [
      {
        "questionId": "uuid",
        "isCorrect": true,
        "correctAnswer": 1,
        "explanation": "Zeus is the king of gods"
      }
    ]
  }
}
```

#### `GET /api/learning/progress`
Get learning hub progress statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "progress": {
      "completedLessons": 3,
      "totalLessons": 4,
      "completionPercent": 75,
      "averageQuizScore": 85
    }
  }
}
```

### 🗺️ Map & Corruption (`/api/map`)

All endpoints require authentication.

#### `GET /api/map/regions`
Get all regions with corruption status.

**Response:**
```json
{
  "success": true,
  "data": {
    "regions": [
      {
        "id": "forest_restoration",
        "name": "Forest Restoration",
        "description": "Ancient forests corrupted by waste",
        "corruptionLevel": 80,
        "isUnlocked": true,
        "missionsCompleted": 2,
        "totalMissions": 5,
        "lastCleared": "2025-11-18T09:00:00Z"
      }
    ]
  }
}
```

#### `GET /api/map/state`
Get full map state overview.

**Response:**
```json
{
  "success": true,
  "data": {
    "mapState": {
      "averageCorruption": 75,
      "totalRegions": 3,
      "regions": [...]
    }
  }
}
```

#### `POST /api/map/regions/:region/clear-corruption`
Clear corruption from a region (requires authentication). Requires replay protection headers.

**Request Body:**
```json
{
  "corruptionCleared": 25
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "region": "forest_restoration",
    "corruptionLevel": 55,
    "cleared": 25
  }
}
```

### 🏆 Badges (`/api/badges`)

#### `GET /api/badges`
List all available badges (requires authentication).

**Response:**
```json
{
  "success": true,
  "data": {
    "badges": [
      {
        "id": "uuid",
        "code": "first_steps",
        "name": "First Steps",
        "description": "Complete your first mission",
        "icon": "first_steps",
        "requirementType": "mission_complete",
        "requirementValue": 1,
        "rewardAmount": 50
      }
    ]
  }
}
```

#### `GET /api/badges/user`
Get user's earned badges (requires authentication).

**Response:**
```json
{
  "success": true,
  "data": {
    "badges": [
      {
        "id": "uuid",
        "code": "first_steps",
        "name": "First Steps",
        "description": "Complete your first mission",
        "earnedAt": "2025-11-18T09:00:00Z"
      }
    ]
  }
}
```

#### `POST /api/badges/:badgeId/claim`
Claim a badge reward (requires authentication). Requires replay protection headers.

**Response:**
```json
{
  "success": true,
  "data": {
    "badge": {
      "id": "uuid",
      "code": "first_steps",
      "name": "First Steps",
      "earnedAt": "2025-11-18T09:00:00Z"
    }
  }
}
```

### 🎁 Rewards (`/api/rewards`)

All endpoints require authentication.

#### `GET /api/rewards`
List user's rewards.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `type` (optional): Filter by reward type (e.g., "coins")

**Response:**
```json
{
  "success": true,
  "data": {
    "rewards": [
      {
        "id": "uuid",
        "userId": "uuid",
        "missionProgressId": "uuid",
        "amount": 100,
        "type": "coins",
        "metadata": null,
        "issuedAt": "2025-11-18T09:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

#### `GET /api/rewards/history`
Get reward history with filters.

**Query Parameters:**
- `page`, `limit`: Pagination (same as above)
- `type` (optional): Filter by reward type
- `startDate` (optional): Start date filter (ISO 8601)
- `endDate` (optional): End date filter (ISO 8601)

**Response:** Same format as `/api/rewards` but includes user information in each reward.

## 🔒 Security Features

- **JWT Authentication**: Access token (15 min) + Refresh token (7 days) pattern
- **Password Hashing**: bcrypt with 10 salt rounds
- **Replay Attack Protection**: Nonce + timestamp validation for POST/PUT/PATCH/DELETE requests
- **Rate Limiting**: 100 requests per 15 minutes per IP address
- **Helmet**: Security headers for XSS, clickjacking, and other attacks
- **CORS**: Configurable cross-origin resource sharing
- **Input Validation**: Zod schema validation for all request bodies
- **Anti-Cheat System**: Basic validation with extensible architecture for advanced checks

## 🗄️ Database Schema

The database schema includes the following tables:

### Tables
- **`users`** - User accounts with email, username, password hash, and device tracking
- **`refresh_tokens`** - JWT refresh token storage with expiration tracking
- **`missions`** - Mission definitions with title, description, type, reward amount, and requirements
- **`mission_progress`** - User progress on missions (status, progress percentage, timestamps)
- **`proofs`** - Uploaded proof files (photos/videos) with anti-cheat scores and verification status
- **`rewards`** - Issued rewards with duplicate prevention
- **`vouchers`** - Redeemable vouchers/codes
- **`lessons`** - Educational lessons in the learning hub
- **`quiz_questions`** - Quiz questions for lessons
- **`learning_progress`** - User progress through lessons and quizzes
- **`badges`** - Badge definitions with requirements
- **`user_badges`** - User-earned badges with timestamps
- **`map_regions`** - Map region state and corruption levels per user

### Enums
- **`progress_status`**: `NOT_STARTED`, `IN_PROGRESS`, `PENDING_REVIEW`, `COMPLETED`, `FAILED`
- **`proof_status`**: `PENDING`, `APPROVED`, `REJECTED`

## 🧪 Testing

### Quick Test Script

A PowerShell test script is included for easy API testing:

```powershell
.\test-api.ps1
```

This script automatically tests:
1. Health check endpoint
2. User signup (falls back to login if user exists)
3. User profile retrieval
4. User stats
5. Mission listing and operations
6. God selection endpoints
7. Learning hub (lessons, progress)
7. Map state and regions
8. Badge listing and user badges
9. Mission filtering by category
10. Reward listing

**Note**: Make sure to run `npm run db:seed` before testing to populate the database with EcoChronos data.

### Manual Testing

You can also use:
- **VS Code REST Client**: Use `test-api.http` file
- **Postman/Insomnia**: Import endpoints from API documentation
- **curl/HTTPie**: Manual command-line testing

### Important Notes for Testing

**Replay Protection**: All POST/PUT/PATCH/DELETE requests require:
- `X-Nonce`: Unique nonce string (e.g., `"1234567890-abc123"`)
- `X-Timestamp`: Current timestamp in milliseconds (e.g., `"1234567890000"`)

The test script automatically generates these headers. For manual testing:
```powershell
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$nonce = "$timestamp-$([System.Guid]::NewGuid())"
$headers = @{
    "X-Nonce" = $nonce
    "X-Timestamp" = $timestamp.ToString()
    "Content-Type" = "application/json"
}
```

**Authentication**: Protected endpoints require:
```powershell
$headers = @{
    "Authorization" = "Bearer <your-access-token>"
}
```

## 📝 Development Notes

- **Database**: Uses Drizzle ORM for type-safe database operations
- **Type Safety**: Full TypeScript support throughout the codebase
- **Error Handling**: Standardized error responses with proper HTTP status codes
- **Storage**: Google Cloud Storage with signed URLs for secure file uploads
- **Replay Protection**: Uses in-memory nonce storage (consider Redis for production scaling)
- **Anti-Cheat**: Comprehensive validation checks for file size, content type, and file age
- **Reward Duplication**: Prevents duplicate rewards per mission progress using database checks

## 🚀 Deployment

### Build for Production

```bash
npm run build
npm start
```

### Environment Variables for Production

Ensure all environment variables are set:
- Database connection string with SSL (`?sslmode=require`)
- Strong JWT secrets (use `crypto.randomBytes(64).toString('hex')`)
- Cloud storage credentials
- Google OAuth client ID (if using Google Sign-In)
- `NODE_ENV=production`

### Recommended Hosting

- **Render**: Easy PostgreSQL + Node.js hosting
- **Railway**: Simple deployment with database
- **Fly.io**: Global edge deployment
- **Google Cloud**: Enterprise-grade hosting with Google Cloud Storage

## 📚 Additional Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Express.js Documentation](https://expressjs.com/)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly using the test script
4. Ensure all endpoints return proper error codes
5. Submit a pull request

## 📄 License

ISC

