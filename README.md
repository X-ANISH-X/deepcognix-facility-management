# Deepcognix Facility Management

A full-stack facility management platform consisting of:

- **Backend** — FastAPI + MySQL REST API
- **Admin Panel** — React + Vite + TypeScript web dashboard
- **User App** — Flutter mobile/web app for customers
- **Technician App** — Flutter mobile/web app for technicians

---

## Prerequisites

Before you start, install the following tools. Every step is covered — no prior setup is assumed.

### 1. Git

Download from https://git-scm.com/downloads and follow the installer for your OS.

Verify:
```bash
git --version
```

---

### 2. Python 3.11+

Download from https://www.python.org/downloads/ (choose Python 3.11 or 3.12).

On macOS you can also use Homebrew:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install python@3.12
```

Verify:
```bash
python3 --version
```

---

### 3. Node.js 18+ and npm

Download from https://nodejs.org/en/download (choose the LTS version).

Verify:
```bash
node --version
npm --version
```

---

### 4. MySQL 8.0+

**macOS (Homebrew):**
```bash
brew install mysql
brew services start mysql
```

**Windows / Linux:** Download the MySQL Community Installer from https://dev.mysql.com/downloads/installer/

Verify:
```bash
mysql --version
```

---

### 5. Flutter 3.x

**macOS (Homebrew Cask):**
```bash
brew install --cask flutter
```

**Manual (all platforms):** Download the Flutter SDK from https://docs.flutter.dev/get-started/install, extract it, and add the `flutter/bin` directory to your `PATH`.

Verify:
```bash
flutter --version
flutter doctor
```

> Run `flutter doctor` and resolve any issues it flags (Android toolchain warnings are fine if you only plan to run on Chrome/web).

---

## Cloning the Repository

```bash
git clone https://github.com/X-ANISH-X/deepcognix-facility-management.git
cd deepcognix-facility-management
```

---

## Database Setup

### 1. Log into MySQL as root

```bash
mysql -u root -p
```

Enter your root password when prompted (blank if none was set during install).

### 2. Create the database and user

Run the following SQL commands inside the MySQL shell:

```sql
CREATE DATABASE IF NOT EXISTS deepcognix_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'deepcognix'@'localhost' IDENTIFIED BY 'deepcognixai';

GRANT ALL PRIVILEGES ON deepcognix_db.* TO 'deepcognix'@'localhost';

FLUSH PRIVILEGES;

EXIT;
```

---

## Backend Setup

### 1. Create a Python virtual environment

```bash
cd backend
python3 -m venv .venv
```

### 2. Activate the virtual environment

**macOS / Linux:**
```bash
source .venv/bin/activate
```

**Windows (Command Prompt):**
```cmd
.venv\Scripts\activate.bat
```

**Windows (PowerShell):**
```powershell
.venv\Scripts\Activate.ps1
```

Your prompt should now show `(.venv)` at the beginning.

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Seed the database with tables and demo data

```bash
python -m app.seed_dummy_data
```

This creates all tables and inserts the demo accounts listed below.

### 5. Start the backend server

```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at http://localhost:8000

Interactive API docs (Swagger UI): http://localhost:8000/docs

> Leave this terminal running. Open a new terminal for the next steps.

---

## Admin Panel Setup

Open a new terminal:

```bash
cd frontend/admin-webpage
npm install
npm run dev
```

The admin panel will be available at http://localhost:5173

---

## User App Setup

Open a new terminal:

```bash
cd frontend/user-app
flutter pub get
flutter run -d chrome
```

The app will launch in Chrome. You can also run on a connected Android/iOS device or emulator.

---

## Technician App Setup

Open a new terminal:

```bash
cd frontend/technician-app
flutter pub get
flutter run -d chrome
```

---

## Demo Accounts

Use these credentials to log in to each part of the platform:

| Platform | Email | Password | Role |
|---|---|---|---|
| Admin Panel | `admin.demo@deepcognix.com` | `Admin@123` | Admin |
| User App | `user.demo@deepcognix.com` | `Admin@123` | Customer |
| Technician App | `technician.demo@deepcognix.com` | `Admin@123` | Technician |

Additional seeded accounts:

| Email | Password | Role |
|---|---|---|
| `aisha.demo@deepcognix.com` | `Customer@123` | Customer |
| `rohan.demo@deepcognix.com` | `Customer@123` | Customer |
| `sam123@gmail.com` | `test123` | Technician |
| `neeraj.tech@deepcognix.com` | `Tech@123` | Technician |
| `kavya.tech@deepcognix.com` | `Tech@123` | Technician |

---

## Project Structure

```
deepcognix-facility-management/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── core/               # Config, security, database
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── transport/          # API route handlers (auth, booking, etc.)
│   │   ├── init_db.py          # Table creation + default service seeding
│   │   ├── main.py             # App entry point, startup events
│   │   └── seed_dummy_data.py  # Demo accounts + services seeder
│   └── requirements.txt
│
├── frontend/
│   ├── admin-webpage/          # React + Vite + TypeScript admin dashboard
│   │   └── src/app/services/api.ts   # Real API client
│   │
│   ├── user-app/               # Flutter customer app
│   │   └── lib/
│   │       ├── main.dart       # App entry with named routes
│   │       └── src/
│   │           ├── controllers/    # GetX controllers (auth, booking, etc.)
│   │           ├── screens/        # UI screens
│   │           └── services/       # API client, auth service
│   │
│   └── technician-app/         # Flutter technician app
│       └── lib/
```

---

## Running Everything at Once

You need **4 separate terminals** running simultaneously:

| Terminal | Command | URL |
|---|---|---|
| 1 — Backend | `cd backend && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000` | http://localhost:8000 |
| 2 — Admin Panel | `cd frontend/admin-webpage && npm run dev` | http://localhost:5173 |
| 3 — User App | `cd frontend/user-app && flutter run -d chrome` | Opens Chrome |
| 4 — Technician App | `cd frontend/technician-app && flutter run -d chrome` | Opens Chrome |

> On Windows, replace `source .venv/bin/activate` with `.venv\Scripts\activate.bat`

---

## Environment Variables (Optional)

The backend reads its configuration from environment variables, with sensible defaults already set. If you want to use different database credentials, create a `.env` file inside the `backend/` folder:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=deepcognix_db
DB_USER=deepcognix
DB_PASSWORD=deepcognixai
SECRET_KEY=your-secret-key-here
```

If no `.env` file is present, the defaults above are used automatically.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.12, FastAPI, SQLAlchemy, PyMySQL, python-jose (JWT), bcrypt |
| Database | MySQL 8+ |
| Admin Panel | React 18, Vite 6, TypeScript, MUI, Radix UI, Tailwind CSS |
| User App | Flutter 3, Dart, GetX, get_storage, http |
| Technician App | Flutter 3, Dart, geolocator, http, shared_preferences |

---

## Troubleshooting

**`Access denied for user 'root'@'localhost'`**
The backend is using the wrong database credentials. Ensure you created the `deepcognix` MySQL user as shown above, and that `backend/app/core/config.py` defaults are `deepcognix / deepcognixai` (they should be already).

**`flutter doctor` shows issues**
For running on Chrome (web), only the **Chrome** and **Flutter** entries need to be OK. Android/iOS toolchain warnings can be ignored for web-only development.

**`npm install` fails**
Ensure you are using Node.js 18 or newer: `node --version`. If your version is older, download the latest LTS from https://nodejs.org.

**`flutter pub get` fails**
Ensure Flutter is correctly installed and on your PATH: `flutter --version`. If the command is not found, re-add the Flutter `bin` folder to your PATH.

**Backend returns 422 on booking**
Ensure the time slot sent is `morning`, `afternoon`, or `evening`. This is handled automatically by the user app — no manual action needed.

**Port 8000 already in use**
Find and kill the process using the port:
```bash
# macOS / Linux
lsof -ti:8000 | xargs kill -9

# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```
