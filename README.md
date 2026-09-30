# Smart Expense Tracker

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.4-brightgreen.svg?logo=springboot)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-blue.svg?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-purple.svg?logo=vite)](https://vitejs.dev/)
[![Material UI](https://img.shields.io/badge/Material--UI-v6-007FFF.svg?logo=mui)](https://mui.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange.svg?logo=mysql)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An enterprise-ready, full-stack personal finance and expense tracking web application. Designed to provide individuals and professionals with real-time financial oversight, intelligent rule-based spending insights, automated recurring transaction scheduling, category-based budgeting with active threshold alerts, smart receipt scanning, and professional report exports.

---

## 📸 Screenshots

> *Add application screenshots and demo GIFs here.*

| Dashboard & Insights | Analytics & Spending Breakdown |
| :---: | :---: |
| ![Dashboard Overview](docs/screenshots/dashboard.png)<br>*(Placeholder: Real-time KPIs, smart insights, and recent transactions)* | ![Analytics Breakdown](docs/screenshots/analytics.png)<br>*(Placeholder: Recharts spending trends & category distribution)* |

| Expense & Recurring Ledger | Budget Management & Alerts |
| :---: | :---: |
| ![Expense Management](docs/screenshots/expenses.png)<br>*(Placeholder: Paginated transaction table with filters and recurring schedules)* | ![Budget Tracking](docs/screenshots/budget.png)<br>*(Placeholder: Visual budget progress bars with 80% & 100% threshold notifications)* |

| Financial Reports (CSV & PDF) | Receipt OCR Scanning |
| :---: | :---: |
| ![Report Generation](docs/screenshots/reports.png)<br>*(Placeholder: Period financial summaries and PDF/CSV export downloads)* | ![Receipt Scanner](docs/screenshots/receipt-scan.png)<br>*(Placeholder: Automated merchant, date, and amount extraction)* |

---

## ✨ Features

### 💰 Core Financial Tracking
- **Income & Expense Management**: Record, categorize, and filter transactions with custom notes and dates.
- **Client-Side & Server-Side Pagination**: Efficiently browse transaction histories with configurable page sizes.
- **Custom Categories**: Manage hierarchical, color-coded categories with built-in delete protection for in-use records.

### 🧠 Intelligent Automation & Insights
- **Rule-Based Smart Insights**: Dynamic dashboard recommendations assessing month-over-month category spending changes, top expense drivers, weekend vs. weekday spending habits, and net savings ratios.
- **Smart Category Auto-Suggestion**: Instant keyword matching (e.g., *Uber*, *Zomato*, *Netflix*, *AWS*) pre-fills categories in real time as descriptions are typed.
- **Receipt OCR Scanning**: Upload photo or scanned receipts to automatically parse merchant name, transaction date, and currency amount directly into the expense form.
- **Recurring Transactions Engine**: Scheduled daily automated background runner (`@Scheduled`) to detect recurring bills and subscriptions, create ledger records, and advance due dates.

### 📊 Budgeting & Notification System
- **Category-Level Budget Limits**: Configure monthly limits per category with dynamic progress indicators.
- **Threshold Alerts**: Automatic notification triggers when spending crosses 80% warning and 100% exceeded thresholds.
- **In-App Notification Center**: Unread badge count, notification list, and one-click "mark as read" management.

### 📄 Export & Reporting
- **Multi-Format Export**: Generate and download financial summaries in both formatted **CSV** and styled **PDF** format (powered by OpenPDF) for weekly, monthly, quarterly, or yearly horizons.
- **Interactive Data Visualizations**: Area charts, bar charts, and radial donut charts built with Recharts.

### 🛡️ Enterprise Security & UX
- **Stateless JWT Authentication**: Secure login/registration flows with BCrypt password hashing.
- **Per-User Isolation**: Every database query is scoped strictly to the authenticated principal.
- **Production Performance**: Zero N+1 Hibernate query issues via eager join fetches; client-side route code-splitting with `React.lazy()` and `<Suspense>`.
- **Adaptive UI**: High-contrast Dark Mode / Light Mode with Material-UI tokens and responsive drawer layout.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/) with Rolldown-compatible vendor chunking
- **Component UI**: [Material UI (MUI v6)](https://mui.com/) & Emotion
- **State & Routing**: React Context API & [React Router v7](https://reactrouter.com/) (Lazy loaded routes)
- **Charts & Visualizations**: [Recharts](https://recharts.org/)
- **HTTP Client**: [Axios](https://axios-http.com/) (with in-memory JWT bearer interceptors)

### Backend
- **Platform**: Java 17 LTS
- **Framework**: [Spring Boot 3.3.4](https://spring.io/projects/spring-boot)
- **Security**: Spring Security 6 & JJWT (JSON Web Token 0.12.6)
- **Persistence**: Spring Data JPA & Hibernate 6 with HikariCP
- **Database**: MySQL 8.x
- **Reporting & Document Engine**: OpenPDF 2.0.3 & Commons CSV
- **OCR Engine**: Tesseract OCR / Java OCR integration

---

## 📁 Repository Structure

```text
Smart-expense-tracker/
├── backend/                              # Spring Boot REST API
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/smartexpense/
│   │   │   │   ├── config/              # Security, CORS, JPA configurations
│   │   │   │   ├── controller/          # REST endpoints (Expenses, Auth, Insights, etc.)
│   │   │   │   ├── dto/                 # Request & Response Data Transfer Objects
│   │   │   │   ├── entity/              # JPA domain entities (User, Expense, Budget, etc.)
│   │   │   │   ├── exception/           # Centralized GlobalExceptionHandler
│   │   │   │   ├── repository/          # Spring Data JPA repositories with custom queries
│   │   │   │   ├── scheduler/           # Background recurring expense cron runner
│   │   │   │   ├── security/            # JWT filter, token provider, auth entry point
│   │   │   │   └── service/             # Business logic & reporting services
│   │   │   └── resources/
│   │   │       ├── application.properties      # Local dev configuration
│   │   │       └── application-prod.properties # Strict env-var-driven prod profile
│   └── pom.xml                          # Maven build dependencies
│
├── frontend/                             # React + Vite Single Page Application
│   ├── src/
│   │   ├── components/                  # Reusable UI widgets, tables, pagination, charts
│   │   ├── context/                     # AuthContext and ThemeContext
│   │   ├── layouts/                     # MainLayout with App Bar, Sidebar, & Theme toggles
│   │   ├── pages/                       # Dashboard, Expenses, Income, Budgets, Reports, etc.
│   │   ├── services/                    # API client layer with Axios interceptors
│   │   └── theme/                       # Material-UI custom dark/light palettes
│   ├── public/                          # Static assets and SPA _redirects
│   ├── vite.config.js                   # Vite config with proxy & build chunking
│   ├── vercel.json                      # Vercel SPA routing rewrite rules
│   └── package.json                     # Frontend dependencies & scripts
│
└── docs/                                 # Project documentation
    ├── DEPLOYMENT.md                    # Production deployment guide (Vercel, Render, Railway)
    ├── DATABASE_SETUP.md                # Schema creation & MySQL setup instructions
    └── ROADMAP.md                       # Development milestones and release stages
```

---

## 🚀 Local Setup Instructions

### Prerequisites
- **Node.js**: v18.0+ and `npm`
- **Java Development Kit (JDK)**: JDK 17 or higher
- **Maven**: 3.8+ (or use included `mvnw`)
- **MySQL**: 8.0+ running locally on port 3306

---

### Step 1: Database Setup
1. Launch MySQL and create a database:
   ```sql
   CREATE DATABASE smart_expense_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. For schema guidelines and sample seed queries, refer to [docs/DATABASE_SETUP.md](docs/DATABASE_SETUP.md).

---

### Step 2: Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Configure credentials in environment variables or via CLI arguments:
   ```bash
   export DB_USERNAME=root
   export DB_PASSWORD=your_mysql_password
   # On Windows PowerShell:
   # $env:DB_USERNAME="root"; $env:DB_PASSWORD="your_mysql_password"
   ```
3. Run the Spring Boot application:
   ```bash
   mvn spring-boot:run
   ```
   *The backend will boot on `http://localhost:8080`. Verify health at `http://localhost:8080/api/health`.*

---

### Step 3: Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite local development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:5173](http://localhost:5173) in your browser. API calls to `/api` are automatically proxied to the backend on `http://localhost:8080`.

---

## 🔌 API Overview

All protected routes require an `Authorization: Bearer <token>` header returned from the login endpoint.

| Method | Endpoint | Description | Auth Required? |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Register a new user account | No |
| `POST` | `/api/auth/login` | Authenticate user and receive JWT | No |
| `GET` | `/api/health` | Health check probe | No |
| `GET` | `/api/dashboard` | Aggregated dashboard stats, balances, and trends | Yes |
| `GET` | `/api/expenses` | Get paginated list of expenses with filters | Yes |
| `POST` | `/api/expenses` | Create a new expense record | Yes |
| `POST` | `/api/expenses/suggest-category` | Suggest category from description keywords | Yes |
| `POST` | `/api/expenses/scan-receipt` | Upload receipt image for OCR draft parsing | Yes |
| `GET` | `/api/income` | Get paginated list of incomes | Yes |
| `POST` | `/api/income` | Create a new income record | Yes |
| `GET` | `/api/categories` | Retrieve all categories (system & user-defined) | Yes |
| `POST` | `/api/categories` | Create custom category | Yes |
| `GET` | `/api/budgets` | Get current monthly category budgets & usage | Yes |
| `POST` | `/api/budgets` | Set or update category budget | Yes |
| `GET` | `/api/recurring-expenses` | List scheduled recurring expenses | Yes |
| `POST` | `/api/recurring-expenses` | Register a new recurring expense rule | Yes |
| `GET` | `/api/insights` | Retrieve dynamic rule-based spending insights | Yes |
| `GET` | `/api/notifications` | Fetch alerts (e.g. 80%/100% budget thresholds) | Yes |
| `PUT` | `/api/notifications/{id}/read` | Mark alert notification as read | Yes |
| `GET` | `/api/reports?period=...` | Summary report data for specified time period | Yes |
| `GET` | `/api/export/csv?period=...` | Download CSV financial summary file | Yes |
| `GET` | `/api/export/pdf?period=...` | Download styled PDF financial summary document | Yes |

---

## 🚢 Deployment

Detailed production deployment guides (including Docker, Render, Railway, Vercel, Netlify, and managed MySQL configurations) are documented in **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
