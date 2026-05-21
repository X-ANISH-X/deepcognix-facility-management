
  # Smart Facility Management Platform

  This admin web app is the operations console for the Smart Facility Management Platform. It is used to monitor bookings, manage technicians, review reports, maintain services and packages, and send operational updates from a single dashboard.

  ## Running the app

  Install dependencies:

  ```bash
  npm i
  ```

  Start the admin dashboard:

  ```bash
  npm run dev
  ```

  ## Dashboard Pages

  The admin sidebar exposes the main operational pages below.

  | Page | Use |
  |------|-----|
  | Login | Authenticates the admin user before opening the dashboard. |
  | Dashboard | Gives a high-level view of live operations, KPIs, recent activity, and queue status. |
  | Technician Tracking | Shows technicians and customer bookings on the live map, with filters, status legends, and side panels for assignment tracking. |
  | Technician Registry | Lets admins register technicians, edit profile details, disable or reinstate accounts, and review a technician's order history. |
  | Work Orders | Provides the main booking management view for assigning technicians, reviewing order details, and updating workflow status. |
  | Services & Pricing | Manages the service catalog, service details, pricing, and availability shown to customers. |
  | Service Packages | Manages package bundles, their included services, checklist items, pricing, and display state. |
  | Reports | Summarizes operational trends, booking volume, status distribution, revenue, and completion metrics. |
  | Settings | Controls theme, brightness, language, and customer notification tools for the admin workspace. |

  ## Notes

  - The app is a React + TypeScript project built with Vite.
  - Tailwind CSS and Radix/shadcn-style primitives provide the UI layer.
  - The dashboard is designed to work with both the backend API and the local mock API adapter.
  - Real-time admin actions such as notifications and technician updates are surfaced through the shared app shell.
  