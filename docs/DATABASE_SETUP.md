# Database Setup Guide — Smart Expense Tracker

This guide details the steps required to set up a local MySQL instance for the **Smart Expense Tracker** backend, create the database schema, and configure required environment variables without hardcoding sensitive credentials.

---

## 📋 Prerequisites

- **MySQL Server** 8.0+ (or **MariaDB** 10.5+) installed and running on port `3306`.
- **MySQL Client** (`mysql` CLI) or GUI client like **MySQL Workbench**, **DBeaver**, or **TablePlus**.

---

## 🗄️ 1. Create the Database & User

Open your MySQL terminal or GUI client as an administrative user (e.g. `root`):

```bash
mysql -u root -p
```

Execute the following SQL commands to initialize the database and create a dedicated application user:

```sql
-- 1. Create the database
CREATE DATABASE IF NOT EXISTS smart_expense_tracker
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- 2. Create a dedicated application user (replace 'YourSecurePassword123!' with your desired password)
CREATE USER IF NOT EXISTS 'expense_user'@'localhost' IDENTIFIED BY 'YourSecurePassword123!';

-- 3. Grant privileges on the application database
GRANT ALL PRIVILEGES ON smart_expense_tracker.* TO 'expense_user'@'localhost';

-- 4. Apply privilege changes
FLUSH PRIVILEGES;
```

---

## 🔐 2. Configure Environment Variables

The backend application reads database credentials dynamically from environment variables defined in [backend/src/main/resources/application.properties](file:///d:/Smart-expense-tracker-main/backend/src/main/resources/application.properties):

| Variable | Description | Example / Default |
|---|---|---|
| `DB_USERNAME` | MySQL database username | `expense_user` (or `root`) |
| `DB_PASSWORD` | MySQL database password | `YourSecurePassword123!` |
| `DB_URL` | *(Optional)* Full JDBC connection string | `jdbc:mysql://localhost:3306/smart_expense_tracker?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true` |

---

### Option A: Set in Windows PowerShell (Current Session)

```powershell
$env:DB_USERNAME = "expense_user"
$env:DB_PASSWORD = "YourSecurePassword123!"
```

### Option B: Set Permanently in Windows (User Environment)

```powershell
[Environment]::SetEnvironmentVariable("DB_USERNAME", "expense_user", "User")
[Environment]::SetEnvironmentVariable("DB_PASSWORD", "YourSecurePassword123!", "User")
```

*(Restart your terminal or IDE after setting permanent user environment variables).*

### Option C: Windows Command Prompt (CMD)

```cmd
set DB_USERNAME=expense_user
set DB_PASSWORD=YourSecurePassword123!
```

### Option D: macOS / Linux (Bash or Zsh)

Add to `~/.bashrc` or `~/.zshrc`:

```bash
export DB_USERNAME="expense_user"
export DB_PASSWORD="YourSecurePassword123!"
```

---

## ⚙️ 3. IDE Run Configuration

If running directly from an IDE (IntelliJ IDEA, VS Code, Eclipse, or Antigravity IDE):

1. Open **Run/Debug Configurations**.
2. Select your Spring Boot application (`SmartExpenseApplication`).
3. In the **Environment Variables** field, add:
   ```text
   DB_USERNAME=expense_user;DB_PASSWORD=YourSecurePassword123!
   ```
4. Save and run.

---

## 🚀 4. Run & Verify the Application

Once your database is created and environment variables are exported, run the backend from the `backend/` directory:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Look for the following log output confirming successful connection and table synchronization:

```text
Tomcat started on port 8080 (http) with context path '/'
Started SmartExpenseApplication in ... seconds
```

Verify the endpoint in a separate terminal:

```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/health" -Method Get
```

**Expected Response:**
```json
{
  "status": "ok"
}
```
