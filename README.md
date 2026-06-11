# Duty Helper

Duty Helper is an AI-powered productivity coach that helps students and workers organize tasks, schedule work by date, generate study notes from documents, and stay focused using Pomodoro and 24-hour clock focus modes.

## Elevator Pitch

An AI productivity coach that organizes tasks, schedules study plans by date, generates notes from documents, and helps users stay focused with Pomodoro and clock modes.

## Inspiration

Duty Helper was created to help students and workers stop feeling overwhelmed by long task lists. Many productivity tools only store tasks, but they do not help users decide what to do first, how long to focus, or how to plan work across different dates.

We wanted to build an AI-powered productivity coach that can organize tasks, study notes, and documents into a clear, actionable plan.

## What It Does

Duty Helper helps users manage tasks using the Eisenhower Matrix:

- Urgent & Important
- Urgent, Not Important
- Not Urgent, Important
- Not Urgent, Not Important

Users can manually choose a category or let AI classify tasks automatically. The app can also generate study notes from uploaded documents, split tasks into specific dates, show tasks on a calendar, and support both Pomodoro and 24-hour clock focus modes.

In focus mode, active tasks remain visible in a semi-transparent side panel. Users can still link tasks, update task status, and stay focused without losing task control.

## Key Features

- AI task classification using the Eisenhower Matrix
- Manual task category selection
- Task scheduling by specific date
- Calendar view for checking tasks by date
- AI-generated study notes from uploaded documents
- Pomodoro timer with adjustable focus and break duration
- 24-hour clock mode with focus mode
- Semi-transparent functional task list in focus mode
- Editable motivational quote
- Local task persistence
- Resizable task, Pomodoro, AI chat, completed, kanban, and calendar panels

## How We Built It

The frontend was built with React and JavaScript using a component-based layout for the task board, Pomodoro timer, calendar, AI chatbox, and focus mode.

The backend was built with Python and FastAPI. The AI assistant is connected through an API endpoint to classify tasks, generate structured study notes, and split work into scheduled task plans.

Local storage is used to persist user data, tasks, completed tasks, and custom quotes. MongoDB can be used for backend task storage.

## Tech Stack

- React
- JavaScript
- CSS
- Vite
- Python
- FastAPI
- MongoDB
- Google Cloud Vertex AI / Gemini
- Local Storage
- Markdown rendering

## Challenges We Ran Into

One challenge was balancing productivity features with a clean interface. We had to improve the layout so it works on smaller screens and allows users to resize task panels, Pomodoro sections, and calendar areas.

Another challenge was making AI-generated results structured enough to become usable tasks, especially when users asked for plans tied to specific dates.

We also improved focus mode so tasks remain functional while staying visually calm and semi-transparent.

## Accomplishments That We're Proud Of

We are proud that Duty Helper combines AI planning, task classification, study-note generation, calendar planning, Pomodoro timing, and focus mode in one workspace.

The app does not just store tasks. It actively helps users decide what to do, when to do it, and how to stay focused.

## What We Learned

We learned how important UI clarity is in productivity tools. Small details such as readable buttons, task labels, calendar dates, and focus mode layout can greatly affect the user experience.

We also learned how to design AI prompts so that AI output can be transformed into useful app data.

## What's Next

Future improvements may include:

- Better recurring task scheduling
- Google Calendar integration
- More file format support
- Better task analytics
- User accounts and cloud sync
- More personalized AI coaching for students, developers, and working professionals

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/duty-helper.git
cd duty-helper
```

### 2. Backend Setup

Install Python dependencies:

```bash
pip install fastapi uvicorn pymongo python-dotenv certifi google-genai pypdf python-docx python-pptx
```

Create a `.env` file based on `.env.example`.

Example `.env.example`:

```env
MONGO_URI=your_mongodb_connection_string
MONGO_DB=DutyHelperDB
MONGO_COLLECTION=Tasks
GOOGLE_CLOUD_PROJECT=your_google_cloud_project_id
GOOGLE_CLOUD_LOCATION=us-central1
```

Run the backend:

```bash
uvicorn main:app --reload
```

### 3. Frontend Setup

Go to the frontend folder:

```bash
cd my-frontend-app
```

Install dependencies:

```bash
npm install
```

Run the frontend:

```bash
npm run dev
```

## Important Security Note

Do not upload your real `.env` file to GitHub.

The `.env` file may contain private information such as database connection strings, passwords, or API keys. Instead, upload only `.env.example` with placeholder values.

Recommended `.gitignore`:

```gitignore
.env
__pycache__/
*.pyc
node_modules/
dist/
.DS_Store
*.log
```

## Project Status

Duty Helper is a hackathon project prototype. It demonstrates how AI can support productivity by turning tasks, documents, and study goals into structured plans.