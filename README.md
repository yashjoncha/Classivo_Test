# Classivo

A full-stack rich text editing platform built with Next.js and Django.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS, Plate.js |
| Backend | Django, Django REST Framework |
| Database | SQLite (dev) / PostgreSQL (prod) |

## Project Structure

```
├── frontend/          # Next.js application
│   ├── src/
│   │   ├── app/       # App Router pages & layouts
│   │   ├── components/# React components
│   │   └── lib/       # API client, types, utilities
│   └── package.json
├── backend/           # Django application
│   ├── config/        # Django settings & URL config
│   ├── apps/          # Django apps
│   ├── manage.py
│   └── requirements.txt
└── README.md
```

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 22+
- npm 10+

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/`.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:3000`.

### Verify Setup

With both servers running, visit `http://localhost:3000` — you should see "Backend connected" confirming the frontend can reach the Django API.
