# Project Structure Documentation

## Overview
This is a **Facility Management Service Application** - a React-based dashboard built with Vite, TypeScript, Tailwind CSS, and Radix UI components. It provides real-time facility service management including work order tracking, technician management, and revenue analytics.

---

## Root Level Files

### Configuration Files

| File | Purpose |
|------|---------|
| **package.json** | Node.js project manifest with dependencies (React, Vite, UI libraries, Tailwind CSS) and build scripts |
| **vite.config.ts** | Vite bundler configuration with React and Tailwind plugins for development/production builds |
| **postcss.config.mjs** | PostCSS configuration (uses Tailwind v4 auto-setup via @tailwindcss/vite) |
| **tsconfig.json** | TypeScript compiler configuration |

### Documentation & Assets

| File | Purpose |
|------|---------|
| **README.md** | Main project documentation and setup instructions |
| **ATTRIBUTIONS.md** | Credits and attribution information for dependencies and libraries |
| **info.txt** | Project overview and functional requirements (business context) |
| **index.html** | Main HTML entry point for the React application |

### Guidelines

| File | Purpose |
|------|---------|
| **guidelines/Guidelines.md** | Project guidelines and best practices for development |

---

## Source Code (`src/`)

### Main Entry Point

| File | Purpose |
|------|---------|
| **main.tsx** | React application entry point - initializes the root React component |

### Application Root (`src/app/`)

| File | Purpose |
|------|---------|
| **App.tsx** | Main application component with routing logic, authentication state, sidebar navigation, and layout structure. Handles login page display and dashboard navigation |

### Components (`src/app/components/`)

#### Main Views

| Component | Purpose |
|-----------|---------|
| **DashboardView.tsx** | Mission Control dashboard showing KPI metrics (active work orders, revenue, completion rates), weekly performance charts, service distribution, recent work orders, and revenue trends |
| **LoginPage.tsx** | Teal-themed authentication page with email/password login, social login options (Google/GitHub), theme toggle, light/dark mode support, and remember me functionality |
| **DashboardView.tsx** | Mission Control dashboard showing KPI metrics (active work orders, revenue, completion rates), weekly performance charts, service distribution, recent work orders, and revenue trends |
| **TechnicianMapView.tsx** | Real-time technician tracking with mock map display, technician status (available/on-job/offline), contact information, location data, active jobs counter, completion rates, and specialty badges |
| **WorkOrdersView.tsx** | Work order management displaying pending/assigned/in-progress/completed service requests with priority levels, technician assignments, scheduling information, and cost tracking |
| **ServicesView.tsx** | Service catalog and pricing management showing available services, categories, base pricing, duration estimates, descriptions, and active status toggles |
| **ReportsView.tsx** | Analytics and reporting dashboard (ignored per request) |

#### Sub-Components

| Component | Purpose |
|-----------|---------|
| **figma/ImageWithFallback.tsx** | Utility component for displaying images with fallback handling when images fail to load |

### Context (`src/app/context/`)

| File | Purpose |
|------|---------|
| **ThemeContext.tsx** | React Context for managing light/dark mode theme state, including theme persistence to localStorage and smooth theme transition animations |

### Services (`src/app/services/`)

| File | Purpose |
|------|---------|
| **mockApi.ts** | Mock API service providing simulated backend data and interfaces. Includes: <ul><li>Data type definitions (Technician, WorkOrder, Service, KPIData, etc.)</li><li>Mock data generators for testing and development</li><li>API endpoint simulators (getKPIs, getWorkOrders, getTechnicians, getServices, etc.)</li><li>Structured to allow easy replacement with real API calls</li></ul> |

### Styles (`src/styles/`)

| File | Purpose |
|------|---------|
| **index.css** | Main CSS entry point that imports all style modules in correct order |
| **fonts.css** | Custom font definitions and typography setup (currently empty, available for custom fonts) |
| **tailwind.css** | Tailwind CSS framework directives and core utility setup |
| **theme.css** | Custom theme configuration including: <ul><li>CSS custom properties (variables) for teal/green color palette</li><li>Light and dark mode color definitions</li><li>Theme transition animations</li><li>Custom variants for theme-aware styling</li></ul> |

---

## UI Components Library (`src/app/components/ui/`)

**Note:** All UI component files are auto-generated Radix UI + Shadcn/ui components and are ignored in this documentation. These provide reusable styled components including:
- Form elements (input, button, checkbox, textarea)
- Containers (card, dialog, drawer, sheet)
- Display (badge, avatar, table, tabs)
- Navigation (breadcrumb, menubar, pagination)
- Data visualization (chart)
- And many more...

---

## Technology Stack

### Core
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server

### Styling
- **Tailwind CSS v4** - Utility-first CSS framework
- **Dark mode support** - Via CSS custom properties and theme context

### UI Libraries
- **Radix UI** - Headless component primitives
- **shadcn/ui** - Component library built on Radix
- **Lucide React** - Icon library
- **Recharts** - Chart and graph library

### State Management
- **React Context API** - Theme management
- **React Hooks** - Local component state

---

## Key Features

1. **Authentication** - Login page with email/password and social login
2. **Dashboard** - Real-time KPI metrics and performance charts
3. **Work Order Management** - Track service requests and assignments
4. **Technician Tracking** - Real-time location and status monitoring
5. **Service Management** - Pricing and service catalog
6. **Reporting** - Analytics and business intelligence
7. **Theme Support** - Light and dark mode with persistence
8. **Responsive Design** - Flexbox-based layouts for mobile to desktop

---

## File Organization Principles

- **Separation of Concerns** - Views handle UI logic, Context handles state, Services handle data
- **Reusable Components** - UI components are modular and composable
- **Type Safety** - TypeScript interfaces for all data structures
- **Mock API Pattern** - Easy transition to real backend without code changes
- **Styling Strategy** - Tailwind utilities with custom theme variables and CSS modules
