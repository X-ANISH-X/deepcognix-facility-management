# DeepCognix Admin Panel - Backend Requirements

**Project**: DeepCognix Facility Management  
**Component**: Admin Webpage Backend API  
**Last Updated**: January 22, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Core Requirements](#core-requirements)
4. [API Endpoints](#api-endpoints)
5. [Data Models](#data-models)
6. [Database Schema](#database-schema)
7. [Security Requirements](#security-requirements)
8. [Performance & Scalability](#performance--scalability)
9. [Error Handling](#error-handling)
10. [Deployment & Configuration](#deployment--configuration)

---

## Overview

The backend API serves the DeepCognix Admin Panel, which provides facility managers with comprehensive oversight of:
- **Work Orders**: Manage customer service requests
- **Technician Management**: Track technician availability and assignments
- **Service & Pricing Management**: Define and manage services offered
- **Real-time Dashboard**: Monitor KPIs and operational metrics
- **Reports & Analytics**: Generate insights on revenue and performance
- **Location Tracking**: Monitor technician locations on interactive maps

---

## Technology Stack

### Core Framework
- **FastAPI** - Modern Python web framework for building APIs
- **Uvicorn[standard]** - ASGI server for FastAPI
- **Pydantic** - Data validation and serialization
- **SQLAlchemy** - ORM for database operations

### Database
- **MySQL Server** - Relational database (primary)
- **MySQL Connector Python** - Python MySQL driver
- **PyMySQL** - Pure Python MySQL client

### Security & Authentication
- **python-jose[cryptography]** - JWT token generation and verification
- **Passlib[bcrypt]** - Password hashing and verification
- **email-validator** - Email address validation

### Additional
- **python-multipart** - Multipart form data handling

---

## Core Requirements

### 1. Authentication & Authorization
- **User Registration**: Support admin account creation with role-based validation
- **User Login**: JWT-based authentication with email and password
- **Role-Based Access Control (RBAC)**: Admin role enforcement
- **Token Management**: 30-minute expiration tokens with refresh capability
- **Session Management**: Track active sessions for audit trails

### 2. Dashboard & KPIs
- **Real-time KPI Calculation**:
  - Active work orders count
  - Total revenue (weekly aggregation)
  - Average completion rate across technicians
  - Maintenance cost per GSF (Gross Square Footage)
  - Total active technicians count
  - Completed work orders (daily)
- **Historical Data**: Support for daily, weekly, monthly, and yearly revenue calculations
- **Work Order Summary**: Display recent work orders with status breakdown

### 3. Work Order Management
- **Create Work Orders**: Allow manual creation with customer info, service type, location
- **Assign Technicians**: Intelligently assign work orders to available technicians
- **Track Status**: Support multiple statuses (pending, assigned, in-progress, completed, rejected)
- **Priority Management**: Handle priority levels (low, medium, high, urgent)
- **Update Status**: Allow status transitions with automatic timestamp tracking
- **View Work Orders**: List with filtering by status, priority, date range
- **Cost Tracking**: Estimate and actual cost recording

### 4. Technician Management
- **View Technician Roster**: Display all technicians with their availability
- **Track Status**: Monitor technician status (available, on-job, offline)
- **Location Tracking**: Store and retrieve real-time GPS coordinates
- **Specialty Management**: Track technician specializations
- **Performance Metrics**: Calculate and display completion rates
- **Current Jobs Count**: Track active assignments per technician
- **Profile Management**: Store contact information, email, phone

### 5. Service & Pricing Management
- **Service Catalog**: CRUD operations for services
- **Category Management**: Organize services by category (HVAC, Plumbing, Electrical, Cleaning, Security, etc.)
- **Pricing Management**: Set base prices and manage pricing changes
- **Service Duration**: Define standard service duration in minutes
- **Activation/Deactivation**: Toggle service availability
- **Service Descriptions**: Store detailed service information

### 6. Reports & Analytics
- **Revenue Reports**: Time-series data for daily/weekly/monthly/yearly periods
- **Service Distribution**: Breakdown of work orders by service type
- **Technician Performance**: Individual and team performance metrics
- **Priority Analysis**: Work order distribution by priority level
- **Export Capability**: Support data export for further analysis

### 7. Map & Location Services
- **Technician Location**: Provide GPS coordinates (latitude, longitude)
- **Address Information**: Store readable addresses for locations
- **Map Integration Support**: Ensure data format compatible with mapping libraries (Google Maps, Mapbox, etc.)

---

## API Endpoints

### Authentication Endpoints

#### `POST /auth/register`
Register a new admin user

**Request Body**:
```json
{
  "full_name": "Admin Name",
  "email": "admin@facility.com",
  "password": "securePassword123",
  "phone_number": "+1-555-0000",
  "role": "admin"
}
```

**Response** (201):
```json
{
  "message": "User registered successfully",
  "user_id": 1
}
```

**Errors**:
- 400: Email already registered
- 500: Internal server error

---

#### `POST /auth/login`
Admin login with email and password

**Request Body**:
```json
{
  "email": "admin@facility.com",
  "password": "securePassword123"
}
```

**Response** (200):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user_id": 1,
  "role": "admin",
  "full_name": "Admin Name"
}
```

**Errors**:
- 400: Incorrect email or password
- 400: User account is inactive

---

### Technician Endpoints

#### `GET /technicians`
Retrieve all technicians

**Response** (200):
```json
[
  {
    "id": "tech-001",
    "name": "John Mitchell",
    "email": "john.mitchell@facility.com",
    "phone": "+1-555-0101",
    "specialty": ["Plumbing", "HVAC"],
    "status": "on-job",
    "location": {
      "lat": 40.7128,
      "lng": -74.0060,
      "address": "123 Main St, New York"
    },
    "currentJobs": 2,
    "completionRate": 94.5,
    "avatar": "JM"
  }
]
```

---

#### `GET /technicians/{id}`
Get specific technician details

**Response** (200): Single technician object

---

#### `PUT /technicians/{id}/status`
Update technician status

**Request Body**:
```json
{
  "status": "available"
}
```

**Response** (200): Updated technician object

---

### Work Order Endpoints

#### `GET /work-orders`
Retrieve all work orders with optional filtering

**Query Parameters**:
- `status`: Filter by status (pending, assigned, in-progress, completed, rejected)
- `priority`: Filter by priority (low, medium, high, urgent)
- `date_from`: Start date for filtering
- `date_to`: End date for filtering
- `skip`: Pagination offset (default: 0)
- `limit`: Pagination limit (default: 50)

**Response** (200):
```json
[
  {
    "id": "WO-2026-001",
    "customerId": "cust-001",
    "customerName": "Acme Corporation",
    "serviceType": "HVAC Repair",
    "priority": "urgent",
    "status": "assigned",
    "technicianId": "tech-001",
    "technicianName": "John Mitchell",
    "scheduledDate": "2026-01-15",
    "scheduledTime": "10:00",
    "location": "100 Business Park, Suite 200",
    "description": "AC unit not cooling properly, urgent repair needed",
    "estimatedCost": 450,
    "actualCost": null,
    "createdAt": "2026-01-15T08:30:00Z",
    "completedAt": null
  }
]
```

---

#### `GET /work-orders/{id}`
Get specific work order details

**Response** (200): Single work order object

---

#### `POST /work-orders`
Create a new work order

**Request Body**:
```json
{
  "customerId": "cust-001",
  "customerName": "Acme Corporation",
  "serviceType": "HVAC Repair",
  "priority": "urgent",
  "scheduledDate": "2026-01-15",
  "scheduledTime": "10:00",
  "location": "100 Business Park, Suite 200",
  "description": "AC unit not cooling properly",
  "estimatedCost": 450
}
```

**Response** (201): Created work order object

---

#### `PUT /work-orders/{id}/status`
Update work order status

**Request Body**:
```json
{
  "status": "in-progress"
}
```

**Response** (200): Updated work order object

---

#### `POST /work-orders/{id}/assign`
Assign a work order to a technician

**Request Body**:
```json
{
  "technicianId": "tech-001"
}
```

**Response** (200): Updated work order object with technician assigned

**Errors**:
- 400: Technician not available
- 404: Work order or technician not found

---

### Service Endpoints

#### `GET /services`
Retrieve all services

**Query Parameters**:
- `category`: Filter by category
- `active_only`: Boolean to show only active services

**Response** (200):
```json
[
  {
    "id": "srv-001",
    "name": "AC Repair",
    "category": "HVAC",
    "basePrice": 450,
    "duration": 120,
    "description": "Air conditioning unit repair and diagnostics",
    "isActive": true
  }
]
```

---

#### `GET /services/{id}`
Get specific service details

---

#### `POST /services`
Create a new service

**Request Body**:
```json
{
  "name": "New Service",
  "category": "HVAC",
  "basePrice": 500,
  "duration": 120,
  "description": "Service description"
}
```

**Response** (201): Created service object

---

#### `PUT /services/{id}`
Update service details

**Request Body**:
```json
{
  "basePrice": 550,
  "isActive": true
}
```

**Response** (200): Updated service object

---

### Category Endpoints

#### `GET /categories`
Retrieve all service categories

**Response** (200):
```json
[
  {
    "id": 1,
    "name": "HVAC",
    "icon_url": "https://...",
    "is_active": true
  }
]
```

---

#### `POST /categories`
Create a new category

**Request Body**:
```json
{
  "name": "New Category",
  "icon_url": "https://..."
}
```

---

### Dashboard & KPI Endpoints

#### `GET /dashboard/kpis`
Retrieve KPI metrics for dashboard

**Response** (200):
```json
{
  "activeWorkOrders": 12,
  "totalRevenue": 45000,
  "avgCompletionRate": 94.5,
  "maintenanceCostPerGSF": 2.34,
  "totalTechnicians": 5,
  "completedToday": 8
}
```

---

### Reports Endpoints

#### `GET /reports/revenue`
Retrieve revenue data for specified period

**Query Parameters**:
- `period`: day, week, month, or year
- `date`: Reference date for the period

**Response** (200):
```json
[
  {
    "date": "2026-01-15",
    "revenue": 5000,
    "orderCount": 10
  }
]
```

---

#### `GET /reports/service-distribution`
Get work order distribution by service type

**Response** (200):
```json
[
  {
    "service": "HVAC",
    "count": 35,
    "percentage": 35
  }
]
```

---

#### `GET /reports/technician-performance`
Get performance metrics for all technicians

**Response** (200):
```json
[
  {
    "technicianId": "tech-001",
    "name": "John Mitchell",
    "completionRate": 94.5,
    "jobsCompleted": 50,
    "totalRevenue": 15000,
    "avgRating": 4.8
  }
]
```

---

## Data Models

### User Model
```python
{
  "id": int,
  "full_name": str,
  "email": str,
  "password_hash": str,
  "phone_number": str,
  "role": "admin" | "customer" | "technician",
  "profile_picture_url": str,
  "is_active": bool,
  "created_at": datetime,
  "updated_at": datetime
}
```

### Technician Model
```python
{
  "id": str,
  "userId": int,
  "specialty": List[str],
  "status": "available" | "on-job" | "offline",
  "location": {
    "lat": float,
    "lng": float,
    "address": str
  },
  "currentJobs": int,
  "completionRate": float,
  "created_at": datetime,
  "updated_at": datetime
}
```

### Work Order Model
```python
{
  "id": str,
  "customerId": str,
  "customerName": str,
  "serviceType": str,
  "priority": "low" | "medium" | "high" | "urgent",
  "status": "pending" | "assigned" | "in-progress" | "completed" | "rejected",
  "technicianId": str | None,
  "technicianName": str | None,
  "scheduledDate": str,
  "scheduledTime": str,
  "location": str,
  "description": str,
  "estimatedCost": float,
  "actualCost": float | None,
  "createdAt": datetime,
  "completedAt": datetime | None
}
```

### Service Model
```python
{
  "id": str,
  "categoryId": int,
  "name": str,
  "description": str,
  "basePrice": float,
  "durationMinutes": int,
  "isActive": bool,
  "created_at": datetime
}
```

### Category Model
```python
{
  "id": int,
  "name": str,
  "icon_url": str,
  "is_active": bool,
  "created_at": datetime
}
```

### KPI Model
```python
{
  "activeWorkOrders": int,
  "totalRevenue": float,
  "avgCompletionRate": float,
  "maintenanceCostPerGSF": float,
  "totalTechnicians": int,
  "completedToday": int
}
```

---

## Database Schema

### Users Table
```sql
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    role ENUM('admin', 'customer', 'technician') NOT NULL DEFAULT 'customer',
    profile_picture_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Categories Table
```sql
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    icon_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Services Table
```sql
CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    base_price DECIMAL(10, 2) NOT NULL,
    duration_minutes INT DEFAULT 60,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);
```

### Bookings/Work Orders Table
```sql
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    service_id INT NOT NULL,
    technician_id INT,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    status ENUM('pending', 'assigned', 'in-progress', 'completed', 'rejected') DEFAULT 'pending',
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    location VARCHAR(255) NOT NULL,
    description TEXT,
    estimated_cost DECIMAL(10, 2),
    actual_cost DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (customer_id) REFERENCES users(id),
    FOREIGN KEY (service_id) REFERENCES services(id),
    FOREIGN KEY (technician_id) REFERENCES users(id)
);
```

### Technicians Table
```sql
CREATE TABLE IF NOT EXISTS technicians (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    specialties JSON,
    status ENUM('available', 'on-job', 'offline') DEFAULT 'offline',
    current_latitude DECIMAL(10, 8),
    current_longitude DECIMAL(11, 8),
    current_address VARCHAR(255),
    current_jobs_count INT DEFAULT 0,
    completion_rate DECIMAL(5, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Audit Log Table (Recommended)
```sql
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100),
    entity_id INT,
    changes JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id)
);
```

---

## Security Requirements

### 1. Authentication
- ✅ JWT-based token authentication (30-minute expiration)
- ✅ Secure password hashing using bcrypt
- ✅ Email validation for all accounts
- ✅ Password strength validation (minimum 8 characters recommended)

### 2. Authorization
- ✅ Admin role validation on sensitive endpoints
- ✅ Role-based access control (RBAC)
- ✅ User activation/deactivation capability

### 3. Data Protection
- ✅ HTTPS only (enforce in production)
- ✅ CORS middleware configured
- ✅ SQL injection prevention via parameterized queries
- ✅ Sensitive data logging prevention

### 4. Production Recommendations
- ⚠️ Change `CORS allow_origins` from `["*"]` to specific frontend URL
- ⚠️ Use environment variables for all sensitive configuration
- ⚠️ Implement rate limiting on auth endpoints
- ⚠️ Add request logging and monitoring
- ⚠️ Implement token refresh mechanism
- ⚠️ Add audit logging for admin actions

---

## Performance & Scalability

### Recommendations
1. **Database Optimization**
   - Add indexes on frequently queried columns (email, status, priority)
   - Implement database connection pooling
   - Archive old booking records periodically

2. **API Optimization**
   - Implement pagination for list endpoints (default limit: 50)
   - Add response caching for KPI data (5-10 minute TTL)
   - Optimize queries to reduce N+1 problems

3. **Scalability Considerations**
   - Implement async processing for heavy computations
   - Use background workers for report generation
   - Consider caching layer (Redis) for frequently accessed data
   - Implement message queues for notifications

4. **Monitoring**
   - API response time tracking
   - Database query performance monitoring
   - Error rate tracking and alerting
   - User activity auditing

---

## Error Handling

### Standard HTTP Status Codes
- `200`: Successful GET/PUT/DELETE
- `201`: Successful POST (resource created)
- `400`: Bad request (validation error)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not found
- `409`: Conflict (duplicate email, etc.)
- `500`: Internal server error
- `503`: Service unavailable

### Error Response Format
```json
{
  "detail": "Error message description",
  "error_code": "ERROR_CODE",
  "timestamp": "2026-01-22T10:30:00Z"
}
```

### Common Errors to Handle
- Invalid JWT tokens or expired tokens
- Database connection failures
- Resource not found scenarios
- Validation errors (missing required fields)
- Business logic violations (duplicate email, technician unavailable)
- File upload errors
- External API failures

---

## Deployment & Configuration

### Environment Variables
```bash
# Database Configuration
DB_HOST=localhost
DB_USER=deepcognix
DB_PASSWORD=deepcognixai
DB_NAME=deepcognix_db
DB_PORT=3306

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# Environment
ENVIRONMENT=production
DEBUG=false

# Logging
LOG_LEVEL=INFO
```

### Docker Setup (Recommended)
- Backend containerization with FastAPI
- MySQL container for database
- Docker Compose for orchestration

### Testing Requirements
- Unit tests for business logic
- Integration tests for API endpoints
- Load testing for performance validation
- Security testing (OWASP Top 10)

### Deployment Checklist
- [ ] Database migrations executed
- [ ] Environment variables configured
- [ ] CORS settings updated for production
- [ ] SSL/TLS certificates installed
- [ ] Database backups configured
- [ ] Logging and monitoring enabled
- [ ] Rate limiting enabled
- [ ] API documentation generated (/docs)

---

## Additional Notes

### Frontend Integration
The admin panel frontend (built with React/TypeScript) expects all endpoints documented above. The frontend uses:
- Real-time KPI updates for dashboard
- Work order filtering and pagination
- Technician location tracking
- Multi-language support (Arabic/English)
- Dark/Light theme compatibility

### Future Enhancements
1. Real-time notifications using WebSockets
2. Advanced analytics and predictive maintenance
3. Integration with external payment gateways
4. SMS/Email notifications for technicians and customers
5. Mobile app support
6. Advanced reporting with custom date ranges
7. Machine learning for technician assignment optimization
8. Video call support for consultations

---

**Document Version**: 1.0  
**Status**: Ready for Development  
**Last Reviewed**: January 22, 2026
