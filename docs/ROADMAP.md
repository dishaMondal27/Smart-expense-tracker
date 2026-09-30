# Smart Expense Tracker - Project Roadmap

This document outlines the development phases, milestones, and architectural progression for the **Smart Expense Tracker** application.

---

## 📌 Development Phases

<!-- Paste your project phases below -->

### Phase 1: Environment Setup & Project Initialization
- [ ] Initialize React + Vite frontend with Material UI and base routing.
- [ ] Initialize Spring Boot application with Maven and required dependencies.
- [ ] Configure MySQL database connection and JPA entities.
- [ ] Set up environment configuration files (`.env`, `application.yml`).

### Phase 2: Database Design & Core Entities
- [ ] Design ER diagrams and schema for Users, Roles, Categories, Transactions, and Budgets.
- [ ] Create JPA Entities, Repositories, and migration scripts.
- [ ] Implement data validation and audit timestamps.

### Phase 3: Authentication & Authorization (Spring Security + JWT)
- [ ] Configure Spring Security with stateless session management.
- [ ] Implement user registration, login, and password hashing (BCrypt).
- [ ] Implement JWT generation, validation, and security filter chain.
- [ ] Secure REST API endpoints based on user roles and identity.

### Phase 4: Core Expense & Income APIs
- [ ] CRUD operations for transactions (income and expense).
- [ ] Category management (predefined & custom user categories).
- [ ] Budget setting and balance calculation services.
- [ ] Global exception handling and standardized API responses.

### Phase 5: Frontend UI & State Management
- [ ] Build responsive layout: App Bar, Sidebar navigation, and Theme provider (MUI).
- [ ] Authentication views (Login, Sign Up, Protected Routes).
- [ ] Dashboard layout with transaction summary cards (Total Income, Total Expense, Net Balance).
- [ ] Transaction tables with search, filter, pagination, and modal forms.

### Phase 6: Analytics & Data Visualization
- [ ] Integrate Chart.js / Recharts for expense breakdown by category (Pie/Doughnut charts).
- [ ] Implement monthly spending trend lines and budget vs. actual bar charts.
- [ ] Date-range filters for analytics reports.

### Phase 7: Testing, Polish & Deployment
- [ ] Backend unit & integration testing (JUnit 5, Mockito).
- [ ] Frontend component and workflow testing.
- [ ] Performance optimization, UI refinement, and accessibility.
- [ ] Production build and deployment preparation.
