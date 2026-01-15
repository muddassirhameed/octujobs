# OctoJobs - Job Scraping API

A NestJS-based job scraping application that fetches jobs from Octoparse or mock JSON data, stores them in MongoDB, and provides RESTful APIs for job management.

---

## 📋 Table of Contents

- [Application Flow](#application-flow)
- [API Endpoints](#api-endpoints)
- [MongoDB Collections](#mongodb-collections)
- [Data Source Configuration](#data-source-configuration)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)

---

## 🔄 Application Flow

### High-Level Architecture

```
┌─────────────┐
│   Client    │
│  (Frontend) │
└──────┬──────┘
       │ HTTP Requests
       ▼
┌─────────────────────────────────────────────────┐
│           NestJS Application                     │
│  ┌──────────────┐  ┌──────────────┐            │
│  │  Controllers │  │   Services    │            │
│  │  (REST API)  │→ │ (Business    │            │
│  │              │  │   Logic)      │            │
│  └──────┬───────┘  └──────┬───────┘            │
│         │                 │                     │
│         │                 ▼                     │
│         │      ┌──────────────────────┐        │
│         │      │  Data Source Factory │        │
│         │      │  (Switches Source)   │        │
│         │      └──────┬───────────────┘        │
│         │             │                        │
│         │      ┌──────┴───────┐                │
│         │      │             │                │
│         │      ▼             ▼                │
│         │  ┌─────────┐  ┌──────────┐        │
│         │  │  Mock   │  │ Octoparse │        │
│         │  │ Service │  │  Service  │        │
│         │  └────┬────┘  └─────┬─────┘        │
│         │       │             │               │
│         └───────┴─────────────┘               │
│                   │                            │
└───────────────────┼────────────────────────────┘
                    │
                    ▼
         ┌──────────────────┐
         │    MongoDB       │
         │  - tasks         │
         │  - jobs          │
         └──────────────────┘
```

### Detailed Flow

1. **Application Startup**
   - Reads `.env` file for configuration
   - Connects to MongoDB
   - Initializes data source factory (Mock or Octoparse based on `DATA_SOURCE`)
   - Starts scheduler (runs every hour by default)

2. **Task Synchronization** (`POST /tasks/sync`)
   - Fetches task groups from data source (Octoparse API or Mock)
   - Fetches tasks for each group
   - Creates/updates tasks in MongoDB
   - Returns synced tasks

3. **Job Scraping** (Scheduler or `POST /scheduler/run`)
   - Gets active tasks from MongoDB
   - For each task:
     - Fetches job data from data source (with pagination)
     - Normalizes job data (title, description, salary, date)
     - Stores jobs in MongoDB (prevents duplicates)
     - Updates task offset and status

4. **API Access**
   - Clients can query jobs via REST APIs
   - Supports pagination, filtering, and CRUD operations
   - All data comes from MongoDB (never directly from source)

---

## 🌐 API Endpoints

**Base URL:** `http://localhost:5000`

### Health & Status

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `http://localhost:5000/` | Returns hello message |
| `GET` | `http://localhost:5000/health` | Health check status |

**Example Response:**
```json
{
  "status": "ok",
  "message": "Hello from OctoJobs API!"
}
```

---

### Scheduler Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `http://localhost:5000/scheduler/run` | Manually trigger scraping job |
| `GET` | `http://localhost:5000/scheduler/status` | Get scheduler status |

**POST /scheduler/run**
```json
Response:
{
  "message": "Scraping job triggered successfully"
}
```

**GET /scheduler/status**
```json
Response:
{
  "isRunning": false,
  "message": "Scheduler is idle"
}
```

---

### Tasks Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `http://localhost:5000/tasks` | Get all tasks |
| `GET` | `http://localhost:5000/tasks?status=active` | Get active tasks only |
| `POST` | `http://localhost:5000/tasks/sync` | Sync tasks from data source |
| `GET` | `http://localhost:5000/tasks/:taskId` | Get task by ID |
| `GET` | `http://localhost:5000/tasks/:taskId/jobs` | Get all jobs for a task |
| `PATCH` | `http://localhost:5000/tasks/:taskId/reset` | Reset task offset & status |

**GET /tasks**
```json
Response:
[
  {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "taskId": "mock-task-001",
    "name": "Mock Job Scraping Task",
    "lastOffset": 25,
    "status": "idle",
    "lastRun": "2026-01-13T12:00:00.000Z",
    "createdAt": "2026-01-13T10:00:00.000Z",
    "updatedAt": "2026-01-13T12:00:00.000Z"
  }
]
```

**POST /tasks/sync**
```json
Response:
[
  {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "taskId": "mock-task-001",
    "name": "Mock Job Scraping Task",
    "status": "idle",
    "lastOffset": 0,
    "createdAt": "2026-01-13T10:00:00.000Z",
    "updatedAt": "2026-01-13T10:00:00.000Z"
  }
]
```

**GET /tasks/:taskId/jobs**
```json
Response:
{
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
      "sourceTaskId": "mock-task-001",
      "jobTitle": "Angular Developer",
      "jobDescription": "Location : Noida\nApply at: https://www.techasoft.com/jobs/angular-developer-jobs-in-noida",
      "jobSalary": null,
      "datePosted": null,
      "processed": false,
      "createdAt": "2026-01-13T11:00:00.000Z",
      "updatedAt": "2026-01-13T11:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

### Jobs Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `http://localhost:5000/jobs` | Get paginated jobs |
| `GET` | `http://localhost:5000/jobs?page=1&limit=20` | Get jobs with pagination |
| `GET` | `http://localhost:5000/jobs/count` | Get total job count |
| `GET` | `http://localhost:5000/jobs/:id` | Get job by ID |
| `POST` | `http://localhost:5000/jobs` | Create new job |
| `PUT` | `http://localhost:5000/jobs/:id` | Update job (full) |
| `PATCH` | `http://localhost:5000/jobs/:id` | Update job (partial) |
| `DELETE` | `http://localhost:5000/jobs/:id` | Delete job |

**GET /jobs?page=1&limit=20**
```json
Response:
{
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
      "sourceTaskId": "mock-task-001",
      "jobTitle": "Angular Developer",
      "jobDescription": "Location : Noida\nApply at: https://www.techasoft.com/jobs/angular-developer-jobs-in-noida",
      "jobSalary": null,
      "datePosted": null,
      "rawData": {
        "Job_Title": "Angular Developer",
        "Job_location": "Location : Noida",
        "btn_URL": "https://www.techasoft.com/jobs/angular-developer-jobs-in-noida"
      },
      "processed": false,
      "createdAt": "2026-01-13T11:00:00.000Z",
      "updatedAt": "2026-01-13T11:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 25
  }
}
```

**GET /jobs/count**
```json
Response:
{
  "total": 25
}
```

**POST /jobs**
```json
Request Body:
{
  "sourceTaskId": "mock-task-001",
  "jobTitle": "React Developer",
  "jobDescription": "Full stack React developer needed",
  "jobSalary": "50k-80k",
  "datePosted": "2026-01-13T00:00:00.000Z",
  "processed": false
}

Response:
{
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
    "sourceTaskId": "mock-task-001",
    "jobTitle": "React Developer",
    "jobDescription": "Full stack React developer needed",
    "jobSalary": "50k-80k",
    "datePosted": "2026-01-13T00:00:00.000Z",
    "processed": false,
    "createdAt": "2026-01-13T13:00:00.000Z",
    "updatedAt": "2026-01-13T13:00:00.000Z"
  }
}
```

**PUT /jobs/:id**
```json
Request Body:
{
  "jobTitle": "Senior React Developer",
  "jobDescription": "Updated description",
  "jobSalary": "80k-120k",
  "processed": true
}

Response:
{
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
    "sourceTaskId": "mock-task-001",
    "jobTitle": "Senior React Developer",
    "jobDescription": "Updated description",
    "jobSalary": "80k-120k",
    "datePosted": "2026-01-13T00:00:00.000Z",
    "processed": true,
    "updatedAt": "2026-01-13T14:00:00.000Z"
  }
}
```

**PATCH /jobs/:id**
```json
Request Body:
{
  "processed": true
}

Response:
{
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
    "processed": true,
    "updatedAt": "2026-01-13T15:00:00.000Z"
  }
}
```

**DELETE /jobs/:id**
```json
Response (204 No Content):
{
  "success": true
}
```

---

## 🗄️ MongoDB Collections

### Collection: `tasks`

**Schema:**
```typescript
{
  taskId: string;              // Unique identifier from Octoparse
  name: string;                 // Task name
  lastOffset: number;           // Last fetched offset (for pagination)
  status: 'idle' | 'running' | 'completed' | 'error';
  lastRun?: Date;               // Last execution time
  createdAt: Date;              // Auto-generated
  updatedAt: Date;              // Auto-generated
}
```

**Indexes:**
- `taskId` (unique)

**Example Document:**
```json
{
  "_id": ObjectId("65a1b2c3d4e5f6g7h8i9j0k1"),
  "taskId": "mock-task-001",
  "name": "Mock Job Scraping Task",
  "lastOffset": 25,
  "status": "idle",
  "lastRun": ISODate("2026-01-13T12:00:00.000Z"),
  "createdAt": ISODate("2026-01-13T10:00:00.000Z"),
  "updatedAt": ISODate("2026-01-13T12:00:00.000Z")
}
```

---

### Collection: `jobs`

**Schema:**
```typescript
{
  sourceTaskId: string;         // Reference to task.taskId
  jobTitle: string;             // Normalized job title
  jobDescription: string;        // Normalized job description
  jobSalary: string | null;      // Salary information (if available)
  datePosted: Date | null;       // Posted date (if available)
  rawData?: Record<string, unknown>;  // Original raw data from source
  processed: boolean;           // Processing flag
  createdAt: Date;              // Auto-generated
  updatedAt: Date;              // Auto-generated
}
```

**Indexes:**
- `sourceTaskId` + `jobTitle` (compound, prevents duplicates)
- `sourceTaskId` + `createdAt` (for sorting)
- `datePosted` (for date filtering)

**Example Document:**
```json
{
  "_id": ObjectId("65a1b2c3d4e5f6g7h8i9j0k2"),
  "sourceTaskId": "mock-task-001",
  "jobTitle": "Angular Developer",
  "jobDescription": "Location : Noida\nApply at: https://www.techasoft.com/jobs/angular-developer-jobs-in-noida",
  "jobSalary": null,
  "datePosted": null,
  "rawData": {
    "Job_Title": "Angular Developer",
    "Job_location": "Location : Noida",
    "btn_URL": "https://www.techasoft.com/jobs/angular-developer-jobs-in-noida"
  },
  "processed": false,
  "createdAt": ISODate("2026-01-13T11:00:00.000Z"),
  "updatedAt": ISODate("2026-01-13T11:00:00.000Z")
}
```

---

## ⚙️ Data Source Configuration

The application supports two data sources controlled by the `DATA_SOURCE` environment variable:

### Mock Data Source (`DATA_SOURCE=mock`)
- Reads from `src/domains/jobs/mock/mock-jobs.json`
- Used for testing and development
- No external API calls required

### Octoparse Data Source (`DATA_SOURCE=octoparse`)
- Fetches data from Octoparse API
- Requires valid Octoparse credentials
- Real-time job scraping

**How It Works:**
1. Factory pattern selects data source at runtime
2. Controllers/services don't know which source is active
3. Same APIs work with both sources
4. Data is always stored in MongoDB first

---

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
# Application Info
APP_NAME=octojobs
APP_ENV=development
PORT=5000

# Database
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# Octoparse API Credentials
OCTOPARSE_USERNAME=your_username
OCTOPARSE_PASSWORD=your_password

# Data Source Configuration
# Options: 'mock' (for testing) or 'octoparse' (for production)
DATA_SOURCE=mock

# Scheduler
SCRAPE_INTERVAL_SECONDS=3600

# Logging
LOG_LEVEL=debug
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (local or cloud)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
```

### Running the Application

```bash
# Development mode
npm run start:dev

# Production build
npm run build
npm run start:prod
```

### Testing the API

```bash
# Health check
curl http://localhost:5000/health

# Sync tasks
curl -X POST http://localhost:5000/tasks/sync

# Trigger scraping
curl -X POST http://localhost:5000/scheduler/run

# Get jobs
curl http://localhost:5000/jobs?page=1&limit=10
```

---

## 📝 Notes

- **Scheduler:** Runs automatically every hour (configurable via `SCRAPE_INTERVAL_SECONDS`)
- **Pagination:** Jobs endpoint supports `page` and `limit` query parameters (max 100 per page)
- **Duplicate Prevention:** Jobs are deduplicated based on `sourceTaskId` + `jobTitle`
- **Data Flow:** Always Mock/Octoparse → MongoDB → API (never direct from source)
- **Type Safety:** Full TypeScript support with proper type checking

---

## 📄 License

Private - All rights reserved
