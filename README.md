# OctoJobs - Job Scraping API

A NestJS-based job scraping application that fetches jobs from Octoparse or mock JSON data, stores them in MongoDB, and provides RESTful APIs for job management.

---

## 📋 Table of Contents

- [Application Structure](#application-structure)
- [Application Flow](#application-flow)
- [API Endpoints](#api-endpoints)
- [MongoDB Collections](#mongodb-collections)
- [Data Source Configuration](#data-source-configuration)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)

---

## 🏗️ Application Structure

### Project Architecture

```
OctoJobs Application
│
├── Controllers (REST API Layer)
│   ├── AppController          → Health & root endpoints
│   ├── JobsController          → Job CRUD operations
│   ├── TasksController         → Task management
│   └── SchedulerController     → Scheduler control
│
├── Services (Business Logic)
│   ├── JobsService             → Job business logic
│   ├── TasksService            → Task business logic
│   └── SchedulerService        → Automated scraping
│
├── Data Source Integration
│   ├── DataSourceFactory       → Switches between sources
│   ├── MockDataSource          → Mock JSON data (dev/test)
│   └── OctoparseDataSource     → Octoparse API (production)
│
└── Database (MongoDB)
    ├── tasks collection        → Task metadata & status
    └── jobs collection         → Scraped job data
```

### Key Components

- **Controllers**: Handle HTTP requests and responses
- **Services**: Contain business logic and data processing
- **Data Source Factory**: Dynamically selects Mock or Octoparse based on config
- **Scheduler**: Automatically runs scraping jobs at intervals
- **MongoDB**: Persistent storage for tasks and jobs

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

### Step-by-Step Flow

#### 1. **Application Startup**
   - Loads configuration from `.env` file
   - Establishes MongoDB connection
   - Initializes Data Source Factory (Mock or Octoparse based on `DATA_SOURCE`)
   - Starts automated scheduler (runs every hour by default)

#### 2. **Task Synchronization** 
   - **Trigger**: `POST http://localhost:5000/tasks/sync`
   - Fetches task groups from data source (Octoparse API or Mock)
   - Retrieves tasks for each group
   - Creates or updates tasks in MongoDB `tasks` collection
   - Returns list of synced tasks

#### 3. **Job Scraping Process**
   - **Trigger**: Automated scheduler OR `POST http://localhost:5000/scheduler/run`
   - Retrieves active tasks from MongoDB
   - For each active task:
     - Fetches job data from data source (with pagination using `lastOffset`)
     - Normalizes job data (title, description, salary, date)
     - Stores jobs in MongoDB `jobs` collection (prevents duplicates)
     - Updates task `lastOffset` and `status` fields

#### 4. **API Data Access**
   - Clients query jobs via REST APIs
   - Supports pagination, filtering, and full CRUD operations
   - **Important**: All data comes from MongoDB (never directly from source)
   - Data flow: `Data Source → MongoDB → API → Client`

---

## 🌐 API Endpoints

**Base URL:** `http://localhost:5000`

---

### Health & Status Endpoints

| Method | Full URL | Description |
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

| Method | Full URL | Description |
|--------|----------|-------------|
| `POST` | `http://localhost:5000/scheduler/run` | Manually trigger scraping job |
| `GET` | `http://localhost:5000/scheduler/status` | Get scheduler status |

**POST `http://localhost:5000/scheduler/run`**
```json
Response:
{
  "message": "Scraping job triggered successfully"
}
```

**GET `http://localhost:5000/scheduler/status`**
```json
Response:
{
  "isRunning": false,
  "message": "Scheduler is idle"
}
```

---

### Tasks Endpoints

| Method | Full URL | Description |
|--------|----------|-------------|
| `GET` | `http://localhost:5000/tasks` | Get all tasks |
| `GET` | `http://localhost:5000/tasks?status=active` | Get active tasks only |
| `POST` | `http://localhost:5000/tasks/sync` | Sync tasks from data source |
| `GET` | `http://localhost:5000/tasks/{taskId}` | Get task by ID (replace `{taskId}` with actual ID) |
| `GET` | `http://localhost:5000/tasks/{taskId}/jobs` | Get all jobs for a task (replace `{taskId}` with actual ID) |
| `PATCH` | `http://localhost:5000/tasks/{taskId}/reset` | Reset task offset & status (replace `{taskId}` with actual ID) |

**Example:**
- `http://localhost:5000/tasks/mock-task-001`
- `http://localhost:5000/tasks/mock-task-001/jobs`
- `http://localhost:5000/tasks/mock-task-001/reset`

**GET `http://localhost:5000/tasks`**
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

**POST `http://localhost:5000/tasks/sync`**
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

**GET `http://localhost:5000/tasks/{taskId}/jobs`**
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

| Method | Full URL | Description |
|--------|----------|-------------|
| `GET` | `http://localhost:5000/jobs` | Get paginated jobs (default: page=1, limit=20) |
| `GET` | `http://localhost:5000/jobs?page=1&limit=20` | Get jobs with custom pagination |
| `GET` | `http://localhost:5000/jobs/count` | Get total job count |
| `GET` | `http://localhost:5000/jobs/{id}` | Get job by ID (replace `{id}` with actual ID) |
| `POST` | `http://localhost:5000/jobs` | Create new job |
| `PUT` | `http://localhost:5000/jobs/{id}` | Update job (full update, replace `{id}` with actual ID) |
| `PATCH` | `http://localhost:5000/jobs/{id}` | Update job (partial update, replace `{id}` with actual ID) |
| `DELETE` | `http://localhost:5000/jobs/{id}` | Delete job (replace `{id}` with actual ID) |

**Example:**
- `http://localhost:5000/jobs/65a1b2c3d4e5f6g7h8i9j0k2`
- `http://localhost:5000/jobs/65a1b2c3d4e5f6g7h8i9j0k2` (PUT/PATCH/DELETE)

**GET `http://localhost:5000/jobs?page=1&limit=20`**
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

**GET `http://localhost:5000/jobs/count`**
```json
Response:
{
  "total": 25
}
```

**POST `http://localhost:5000/jobs`**
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

**PUT `http://localhost:5000/jobs/{id}`**
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

**PATCH `http://localhost:5000/jobs/{id}`**
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

**DELETE `http://localhost:5000/jobs/{id}`**
```json
Response (204 No Content):
{
  "success": true
}
```

---

## 🗄️ MongoDB Collections

### Collection: `tasks`

**Purpose:** Stores task metadata, status, and pagination offset information.

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
- `taskId` (unique index)

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

**Purpose:** Stores scraped job data with normalized fields and original raw data.

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
- `sourceTaskId` + `jobTitle` (compound unique index - prevents duplicates)
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
- **File Location**: `src/domains/jobs/mock/mock-jobs.json`
- **Use Case**: Testing and development
- **Advantages**: No external API calls required, fast testing
- **When to Use**: Development, testing, CI/CD pipelines

### Octoparse Data Source (`DATA_SOURCE=octoparse`)
- **API Base**: `https://openapi.octoparse.com`
- **Use Case**: Production job scraping
- **Requirements**: Valid Octoparse credentials (`OCTOPARSE_USERNAME`, `OCTOPARSE_PASSWORD`)
- **When to Use**: Production environment, real-time job scraping

**How It Works:**
1. Factory pattern selects data source at runtime based on `DATA_SOURCE` env variable
2. Controllers and services are unaware of which source is active
3. Same APIs work seamlessly with both sources
4. Data is always stored in MongoDB first (never served directly from source)

**External Octoparse API Endpoints:**
- **Authentication**: `POST https://openapi.octoparse.com/token`
- **List Task Groups**: `GET https://openapi.octoparse.com/taskGroup`
- **List Tasks**: `GET https://openapi.octoparse.com/task/search?taskGroupId={taskGroupId}`
- **Get Task Data**: `GET https://dataapi.octoparse.com/api/alldata/GetDataOfTaskByOffset?taskId={taskId}&offset={offset}&size={size}`

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
- Node.js (v18 or higher)
- MongoDB (local installation or cloud instance)
- npm or yarn package manager

### Installation

```bash
# Install dependencies
npm install

# Copy environment file template
cp .env.example .env

# Edit .env with your configuration
# - Set MongoDB connection string
# - Set Octoparse credentials (if using octoparse data source)
# - Configure data source (mock or octoparse)
```

### Running the Application

```bash
# Development mode (with hot reload)
npm run start:dev

# Production build
npm run build
npm run start:prod
```

### Testing the API

```bash
# Health check
curl http://localhost:5000/health

# Sync tasks from data source
curl -X POST http://localhost:5000/tasks/sync

# Manually trigger scraping job
curl -X POST http://localhost:5000/scheduler/run

# Get paginated jobs
curl http://localhost:5000/jobs?page=1&limit=10

# Get task by ID
curl http://localhost:5000/tasks/mock-task-001

# Get jobs for a specific task
curl http://localhost:5000/tasks/mock-task-001/jobs
```

---

## 📝 Important Notes

- **Scheduler**: Runs automatically every hour (configurable via `SCRAPE_INTERVAL_SECONDS` env variable)
- **Pagination**: Jobs endpoint supports `page` and `limit` query parameters (max 100 per page)
- **Duplicate Prevention**: Jobs are deduplicated based on `sourceTaskId` + `jobTitle` compound index
- **Data Flow**: Always follows `Data Source → MongoDB → API → Client` (never serves directly from source)
- **Type Safety**: Full TypeScript support with proper type checking throughout
- **Task Status**: Tasks can be `idle`, `running`, `completed`, or `error`
- **Job Processing**: Use `processed` flag to track which jobs have been processed by downstream systems

---

## 📄 License

Private - All rights reserved
