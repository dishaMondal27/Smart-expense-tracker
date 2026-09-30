# Smart Expense Tracker — Production Deployment Guide

This guide covers everything required to deploy the **Smart Expense Tracker** application to production:
- **Frontend**: React 19 + Vite SPA (Vercel, Netlify, or static web host)
- **Backend**: Spring Boot 3.3.4 (Render, Railway, Fly.io, AWS, or Docker)
- **Database**: Managed MySQL 8.x instance (Railway, PlanetScale, AWS RDS, Aiven, or Render MySQL)

---

## Architecture Overview

```text
┌───────────────────────────┐         HTTPS / REST API         ┌───────────────────────────┐
│     Frontend (Vite/React) │ ───────────────────────────────> │  Backend (Spring Boot)    │
│  Deployed on:             │   (JWT Bearer Auth Header)       │  Deployed on:             │
│  Vercel / Netlify / Cloud │                                  │  Render / Railway / VM    │
└───────────────────────────┘                                  └─────────────┬─────────────┘
                                                                             │
                                                                             │ JDBC (TLS/SSL)
                                                                             ▼
                                                               ┌───────────────────────────┐
                                                               │  Managed MySQL 8.x DB     │
                                                               └───────────────────────────┘
```

---

## 1. Environment Variables Reference

### Backend (`application-prod.properties`)

The production profile (`SPRING_PROFILES_ACTIVE=prod`) strictly loads all credentials and sensitive parameters from environment variables with **no hardcoded fallbacks**:

| Variable | Required? | Example Value | Description |
| :--- | :---: | :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | **Yes** | `prod` | Activates `application-prod.properties`. |
| `DB_URL` | **Yes** | `jdbc:mysql://db.host.com:3306/expense_db?useSSL=true&requireSSL=true` | Full JDBC connection string for production MySQL. |
| `DB_USERNAME` | **Yes** | `db_user` | MySQL user with read/write privileges on the database. |
| `DB_PASSWORD` | **Yes** | `StrongSecretPassword123!` | MySQL user password. |
| `JWT_SECRET` | **Yes** | `64_char_hex_or_base64_string...` | Secret key for signing/verifying JWTs (minimum 256 bits). |
| `JWT_EXPIRATION_MS` | No | `86400000` | Token expiration in ms (defaults to 24 hours). |
| `CORS_ALLOWED_ORIGINS` | **Yes** | `https://your-expense-app.vercel.app` | Comma-separated allowed frontend origins. |
| `PORT` | No | `8080` (or injected by platform) | HTTP port the backend binds to. Platforms like Render/Railway set this automatically. |
| `HIBERNATE_DDL_AUTO` | No | `update` (or `validate`) | Hibernate schema strategy (`update` for auto-table generation). |

#### Generating a Strong JWT Secret
Generate a cryptographically secure 256-bit or 512-bit hex secret:
```bash
# Using OpenSSL:
openssl rand -hex 64
```

---

### Frontend (`frontend/.env.production`)

| Variable | Required? | Example Value | Description |
| :--- | :---: | :--- | :--- |
| `VITE_API_BASE_URL` | **Yes** (in prod) | `https://smartexpense-api.onrender.com` | Base URL of the deployed backend (omit trailing slash). |

> In local development, leaving `VITE_API_BASE_URL` empty automatically proxies calls to `http://localhost:8080/api` via Vite's dev server.

---

## 2. Database Setup (MySQL)

1. Provision a MySQL 8.x instance on your cloud provider (e.g., Railway MySQL, Aiven, AWS RDS, or Render PostgreSQL/MySQL).
2. Create an empty database:
   ```sql
   CREATE DATABASE smart_expense_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Copy the database connection details:
   - Host, Port (default 3306), Database name, Username, Password.
4. Construct your JDBC connection URL:
   ```text
   jdbc:mysql://<HOST>:<PORT>/<DATABASE>?useSSL=true&serverTimezone=UTC&allowPublicKeyRetrieval=true
   ```

---

## 3. Backend Deployment

### Option A: Railway

1. **Create New Project** on [Railway](https://railway.app) and select **Deploy from GitHub repo**.
2. Point Railway to the `/backend` subdirectory:
   - Set **Root Directory** in project settings to `/backend`.
3. Set **Build Command**:
   ```bash
   mvn clean package -DskipTests
   ```
4. Set **Start Command**:
   ```bash
   java -Dspring.profiles.active=prod -jar target/smartexpense-0.0.1-SNAPSHOT.jar
   ```
5. Add the required Environment Variables in the Railway Dashboard:
   - `SPRING_PROFILES_ACTIVE`: `prod`
   - `DB_URL`: `${{MySQL.MYSQL_URL}}` or explicit JDBC URL
   - `DB_USERNAME`: `${{MySQL.MYSQLUSER}}`
   - `DB_PASSWORD`: `${{MySQL.MYSQLPASSWORD}}`
   - `JWT_SECRET`: *(your generated 64-char hex secret)*
   - `CORS_ALLOWED_ORIGINS`: `https://your-frontend-domain.vercel.app`
6. Deploy and copy the assigned Railway backend URL (e.g. `https://smartexpense-api.up.railway.app`).

---

### Option B: Render

1. Create a **New Web Service** connected to your repository on [Render](https://render.com).
2. Set settings:
   - **Root Directory**: `backend`
   - **Environment**: `Java` (or `Docker`)
   - **Build Command**: `mvn clean package -DskipTests`
   - **Start Command**: `java -Dspring.profiles.active=prod -jar target/smartexpense-0.0.1-SNAPSHOT.jar`
3. In **Environment Variables**, configure:
   - `SPRING_PROFILES_ACTIVE`: `prod`
   - `DB_URL`: `jdbc:mysql://<host>:<port>/<dbname>?useSSL=true&serverTimezone=UTC`
   - `DB_USERNAME`: `<db-user>`
   - `DB_PASSWORD`: `<db-password>`
   - `JWT_SECRET`: `<64-byte-hex-string>`
   - `CORS_ALLOWED_ORIGINS`: `https://your-frontend.vercel.app`
4. Deploy the service and verify health at:
   ```text
   GET https://<your-render-url>/api/health
   ```

---

### Option C: Docker Deployment

If deploying with Docker or Amazon ECS/DigitalOcean App Platform, use this multi-stage build:

```dockerfile
# Build Stage
FROM maven:3.9.6-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn clean package -DskipTests

# Run Stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/smartexpense-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENV SPRING_PROFILES_ACTIVE=prod
ENTRYPOINT ["java", "-jar", "app.jar"]
```

---

## 4. Frontend Deployment

### Option A: Vercel

1. Import your GitHub repository into [Vercel](https://vercel.com).
2. Configure project settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add **Environment Variables**:
   - `VITE_API_BASE_URL`: `https://your-backend-api.onrender.com` (your backend URL without trailing slash)
4. Client-side routing is handled automatically by the included [vercel.json](file:///d:/Smart-expense-tracker-main/frontend/vercel.json):
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```
5. Click **Deploy**.

---

### Option B: Netlify

1. Link your repository in [Netlify](https://netlify.com).
2. Configure build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
3. Add **Environment Variables** in Site settings:
   - `VITE_API_BASE_URL`: `https://your-backend-api.onrender.com`
4. Client-side routing fallback is handled by the included [public/_redirects](file:///d:/Smart-expense-tracker-main/frontend/public/_redirects):
   ```text
   /*    /index.html   200
   ```
5. Deploy the site.

---

## 5. Post-Deployment Verification Checklist

- [ ] **Backend Health Check**:
  - Visit `https://<backend-url>/api/health`. Should return `{"status":"UP","timestamp":...}` with status 200.
- [ ] **Frontend Loading**:
  - Open frontend URL. Verify dashboard / login page renders without blank screens or console errors.
- [ ] **CORS Verification**:
  - Register a new user and log in. Inspect the Network tab to confirm `CORS` headers allow requests from the frontend domain.
- [ ] **JWT Authentication**:
  - Check that subsequent authenticated calls (e.g., `/api/expenses`, `/api/insights`) succeed with `200 OK` and proper `Authorization: Bearer <token>` headers.
- [ ] **Client-Side Refresh (SPA Routing)**:
  - Navigate to `/expenses` or `/reports` and reload the browser page. Ensure it does not return a 404 error (handled by `vercel.json` or `_redirects`).
- [ ] **Export & Scanning Features**:
  - Test CSV and PDF report export downloads on the `/reports` page.
  - Test receipt OCR upload on `/expenses/add`.
