# Admin Webpage Startup Guide

This document is only for the admin webpage operation. The user app and technician app keep their own README files.

## Admin Backend

Path: `backend/`

### Prerequisites

- Python 3.11+.
- MySQL 8.0+.

### Configuration

The backend reads settings from `backend/.env` through `backend/app/core/config.py`.

Required values:

- `DB_HOST` - MySQL host, usually `localhost`
- `DB_USER` - MySQL user, default `deepcognix`
- `DB_PASSWORD` - MySQL password, default `deepcognixai`
- `DB_NAME` - Database name, default `deepcognix_db`
- `DB_PORT` - MySQL port, default `3306`
- `SECRET_KEY` - JWT signing secret
- `ALGORITHM` - JWT algorithm, default `HS256`
- `ACCESS_TOKEN_EXPIRE_MINUTES` - Token lifetime, default `30`

### Start Commands

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m app.seed_dummy_data
uvicorn app.main:app --reload --port 8000
```

### Backend URLs

- API: `http://localhost:8000`
- Swagger UI: `http://localhost:8000/docs`

## Admin Frontend

Path: `frontend/admin-webpage/`

### Configuration

Copy `frontend/admin-webpage/.env.example` to `frontend/admin-webpage/.env` and update the local values as needed.

Required value:

- `VITE_API_URL` - backend base URL, usually `http://localhost:8000`

### Start Commands

```powershell
cd frontend/admin-webpage
npm install
npm run dev
```

### Admin URL

- Admin dashboard: `http://localhost:5173`

## Run Order

1. Start MySQL.
2. Configure `backend/.env`.
3. Start the backend API.
4. Configure `frontend/admin-webpage/.env` from `.env.example`.
5. Start the admin frontend.

## Notes

- The backend auto-creates or updates schema objects on startup through `app.main` and `app.init_db`.
- The admin frontend talks to the backend through `VITE_API_URL`.
- For Windows PowerShell, script execution may require `Set-ExecutionPolicy` changes if virtualenv activation is blocked.