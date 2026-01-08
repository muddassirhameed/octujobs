A NestJS backend application that scrapes jobs from multiple websites via Octoparse API, normalizes data, and stores it in MongoDB. Supports hourly automated scraping and manual triggers.

# Key Features:
Automated hourly scraping
Manual scraping trigger
Task synchronization
Data normalization and deduplication
Pagination support
REST API for data access

# System Architecture
SchedulerModule → TasksModule → OctoparseModule
       │                 │
       ▼                 ▼
   JobsModule ←───────────┘
       │
       ▼
    MongoDB


# Modules
Module	            Purpose
AppModule	        Root module, imports all modules
ConfigModule	    Global configuration via env variables
SchedulerModule	    Automated/manual scraping
TasksModule	        Manages scraping tasks and status
JobsModule	        Manages normalized job data
OctoparseModule	    Interacts with Octoparse API
AppController	    Basic health/status endpoints


