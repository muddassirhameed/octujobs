# API Endpoints

# Base URL: http://localhost:5000

Health & Status
Endpoint	Method	            Description
http://localhost:5000/health	        GET	                Hello message


# Scheduler
Endpoint	        Method	    Description
/scheduler/run	    POST	    Manually trigger scraping
/scheduler/status	GET	        Get current scheduler status


# Tasks
Endpoint	             Method	        Description
/tasks	                GET	                List all tasks (optional status=active)
/tasks/sync         	POST	            Sync tasks from Octoparse
/tasks/:taskId	         GET	                 Get a task by ID
/tasks/:taskId/jobs	    GET	                Get all jobs for a task
/tasks/:taskId/reset	PATCH	    Reset task offset & status

# Jobs
Endpoint	        Method	        Description
/jobs	             GET	        Paginated job list (page, limit)
/jobs/count	         GET	        Total job count


# Database Schemas
# Task
{
  taskId: string,
  name: string,
  lastOffset: number,
  status: 'idle' | 'running' | 'completed' | 'error',
  lastRun?: Date,
  createdAt: Date,
  updatedAt: Date
}

# Job
{
  sourceTaskId: string,
  jobTitle: string,
  jobDescription: string,
  jobSalary: string | null,
  datePosted: Date | null,
  rawData?: object,
  processed: boolean,
  createdAt: Date,
  updatedAt: Date
}

# External APIs
Octoparse API
 # Auth: POST: https://openapi.octoparse.com/token  

1. List Task Groups
Method: GET
URL: https://openapi.octoparse.com/taskGroup

2. List Tasks in a Group
Method: GET
URL: https://openapi.octoparse.com/task/search?taskGroupId=1711147

3. Get Data of a Task (with Offset)
Method: GET
URL: https://dataapi.octoparse.com/api/alldata/GetDataOfTaskByOffset?taskId=554e9f2c-867e-8778-d691-9f4e50823549&offset=0&size=100

