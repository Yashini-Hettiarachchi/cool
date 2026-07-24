# Database Setup Guide (MySQL) — AC Service Management System (Revised per Wireframes)

Actual SQL to set up the database, plus sample queries mapped to each real data flow. Updated for the 9-table schema (3 roles, expanded AC unit fields, Normal/H-P count + period model, completion approval, pricing table).

---

## 1. Create Database

```sql
CREATE DATABASE ac_service_system
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ac_service_system;
```

`utf8mb4` is required (not plain `utf8`) to correctly store **Sinhala Unicode text** in the `route` field.

---

## 2. Create Tables

```sql
-- USERS (3 roles: admin, system_user, technician)
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(20),
  role ENUM('admin','system_user','technician') NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- CUSTOMERS
CREATE TABLE customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  nic VARCHAR(20) NOT NULL,
  address TEXT,
  route VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_nic (nic),
  INDEX idx_phone (phone)
);

-- AC UNITS (expanded: model, brand, dual serials)
CREATE TABLE ac_units (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  model VARCHAR(100),
  brand VARCHAR(100),
  serial_indoor VARCHAR(100),
  serial_outdoor VARCHAR(100),
  install_notes TEXT,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- PRICING (admin-managed default prices)
CREATE TABLE pricing (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service_type ENUM('normal','hp') NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- AGREEMENTS (Normal/H-P count + period model, replaces single service_type)
CREATE TABLE agreements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agreement_no VARCHAR(20) NOT NULL UNIQUE,
  customer_id INT NOT NULL,
  ac_unit_id INT NOT NULL,
  normal_count INT NOT NULL DEFAULT 0,
  hp_count INT NOT NULL DEFAULT 0,
  period_days INT NOT NULL,
  price DECIMAL(10,2),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  amount_paid DECIMAL(10,2) NOT NULL,
  status ENUM('active','expired','cancelled','renewed') DEFAULT 'active',
  parent_agreement_id INT NULL,
  created_by INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (ac_unit_id) REFERENCES ac_units(id),
  FOREIGN KEY (parent_agreement_id) REFERENCES agreements(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_agreement_no (agreement_no)
);

-- JOBS (expanded: service_type_used, admin_confirmed, is_deleted, postpone_days, cancel_reason, comments)
CREATE TABLE jobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agreement_id INT NOT NULL,
  scheduled_date DATE NOT NULL,
  status ENUM('scheduled','in_progress','completed','postponed','cancelled') DEFAULT 'scheduled',
  technician_id INT NULL,
  service_type_used ENUM('normal','hp') NULL,
  admin_confirmed BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  postponed_from DATE NULL,
  postpone_days INT NULL,
  postpone_reason TEXT NULL,
  cancel_reason TEXT NULL,
  comments TEXT NULL,
  completed_at DATETIME NULL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (agreement_id) REFERENCES agreements(id),
  FOREIGN KEY (technician_id) REFERENCES users(id),
  INDEX idx_scheduled_date (scheduled_date),
  INDEX idx_technician (technician_id),
  INDEX idx_admin_confirmed (admin_confirmed),
  INDEX idx_is_deleted (is_deleted)
);

-- JOB PHOTOS
CREATE TABLE job_photos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  photo_path VARCHAR(255) NOT NULL,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  uploaded_by INT,
  FOREIGN KEY (job_id) REFERENCES jobs(id),
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- SMS LOGS
CREATE TABLE sms_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  job_id INT NULL,
  template_type ENUM('activation','reminder','completion') NOT NULL,
  message TEXT NOT NULL,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (job_id) REFERENCES jobs(id)
);
```

---

## 3. Create the Database User (cPanel)

Via cPanel → **MySQL Databases**:
1. Create database: `youruser_acservice`
2. Create user: `youruser_appuser`, with a strong password
3. Add user to database with **All Privileges**

Then in your `.env` / Node.js App environment variables:
```
DB_HOST=localhost
DB_USER=youruser_appuser
DB_PASS=your_strong_password
DB_NAME=youruser_acservice
```

---

## 4. Sample Queries — Mapped to Each Data Flow

### Flow A — Registration → Activation

```sql
-- Check if customer already exists
SELECT * FROM customers WHERE nic = ? OR phone = ?;

-- Create new customer (if not found)
INSERT INTO customers (name, phone, nic, address, route)
VALUES (?, ?, ?, ?, ?);

-- Add the AC unit (with new expanded fields)
INSERT INTO ac_units (customer_id, model, brand, serial_indoor, serial_outdoor)
VALUES (?, ?, ?, ?, ?);

-- Look up default pricing for pre-fill
SELECT * FROM pricing WHERE service_type = ?;

-- Generate next AS- number (application-level, then insert)
SELECT agreement_no FROM agreements ORDER BY id DESC LIMIT 1;
-- e.g. last was AS-00042 -> next is AS-00043 (zero-padded, generated in numberingService.js)

-- Create the agreement (Normal/H-P counts + period, not a single type)
INSERT INTO agreements
  (agreement_no, customer_id, ac_unit_id, normal_count, hp_count, period_days, price, start_date, end_date, amount_paid, created_by)
VALUES
  (?, ?, ?, ?, ?, ?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 YEAR), ?, ?);

-- Auto-generate all visits: (normal_count + hp_count) jobs, spaced period_days apart
-- Example: normal_count=2, hp_count=2, period_days=90 -> 4 jobs, 90 days apart
INSERT INTO jobs (agreement_id, scheduled_date) VALUES
  (?, DATE_ADD(CURDATE(), INTERVAL 90 DAY)),
  (?, DATE_ADD(CURDATE(), INTERVAL 180 DAY)),
  (?, DATE_ADD(CURDATE(), INTERVAL 270 DAY)),
  (?, DATE_ADD(CURDATE(), INTERVAL 360 DAY));

-- Log the activation SMS after sending via Text.lk
INSERT INTO sms_logs (customer_id, template_type, message, status)
VALUES (?, 'activation', ?, 'sent');
```

### Flow B — Job Lifecycle (with completion approval + type tagging)

```sql
-- Calendar view: all jobs on a given day (with status-based color coding)
SELECT j.*, a.agreement_no, c.name, c.address, c.route
FROM jobs j
JOIN agreements a ON j.agreement_id = a.id
JOIN customers c ON a.customer_id = c.id
WHERE j.scheduled_date = ? AND j.is_deleted = FALSE;

-- Assign technician
UPDATE jobs SET technician_id = ? WHERE id = ?;

-- Daily reminder check (run by reminderCron.js)
SELECT j.*, c.phone, c.name
FROM jobs j
JOIN agreements a ON j.agreement_id = a.id
JOIN customers c ON a.customer_id = c.id
WHERE j.scheduled_date = DATE_ADD(CURDATE(), INTERVAL 1 DAY)
  AND j.status = 'scheduled';

-- Technician searches by AS- number
SELECT j.*, a.agreement_no, c.name, c.address, c.route
FROM jobs j
JOIN agreements a ON j.agreement_id = a.id
JOIN customers c ON a.customer_id = c.id
WHERE a.agreement_no = ?
ORDER BY j.scheduled_date DESC;

-- Mark job in progress
UPDATE jobs SET status = 'in_progress' WHERE id = ?;

-- Upload a photo
INSERT INTO job_photos (job_id, photo_path, uploaded_by)
VALUES (?, ?, ?);

-- Check current photo count before completion (must be 4-5)
SELECT COUNT(*) AS photo_count FROM job_photos WHERE job_id = ?;
-- Application logic: reject "Complete" action if photo_count < 4

-- Technician marks complete AND tags the visit type (Normal or H/P)
UPDATE jobs
SET status = 'completed', service_type_used = ?, completed_at = NOW(), admin_confirmed = FALSE
WHERE id = ?;

-- Job Complete Requests queue (admin-facing) — jobs completed but not yet confirmed
SELECT j.*, a.agreement_no, c.name
FROM jobs j
JOIN agreements a ON j.agreement_id = a.id
JOIN customers c ON a.customer_id = c.id
WHERE j.status = 'completed' AND j.admin_confirmed = FALSE;

-- Admin confirms the completion (this is what finally triggers the Completion SMS)
UPDATE jobs SET admin_confirmed = TRUE WHERE id = ?;
INSERT INTO sms_logs (customer_id, job_id, template_type, message, status)
VALUES (?, ?, 'completion', ?, 'sent');

-- Postpone a job (with days + reason, per wireframe)
UPDATE jobs
SET postponed_from = scheduled_date,
    scheduled_date = DATE_ADD(scheduled_date, INTERVAL ? DAY),
    postpone_days = ?,
    postpone_reason = ?,
    status = 'postponed'
WHERE id = ?;

-- Cancel a job (with reason)
UPDATE jobs SET status = 'cancelled', cancel_reason = ? WHERE id = ?;

-- Soft-delete a job (mistake/duplicate — different from cancellation)
UPDATE jobs SET is_deleted = TRUE WHERE id = ?;

-- Deleted Jobs view (admin)
SELECT * FROM jobs WHERE is_deleted = TRUE;

-- Job Cancellations view (admin) — distinct from Deleted Jobs
SELECT * FROM jobs WHERE status = 'cancelled' AND is_deleted = FALSE;
```

### Flow C — Renewal & Archive

```sql
-- Find agreements expiring soon (for renewal follow-up)
SELECT * FROM agreements WHERE end_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) AND status = 'active';

-- Renew: create new agreement linked to the old one (same Normal/H-P/Period model, can be edited)
INSERT INTO agreements
  (agreement_no, customer_id, ac_unit_id, normal_count, hp_count, period_days, price, start_date, end_date, amount_paid, status, parent_agreement_id, created_by)
VALUES
  (?, ?, ?, ?, ?, ?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 YEAR), ?, 'active', ?, ?);

-- Mark old agreement as renewed
UPDATE agreements SET status = 'renewed' WHERE id = ?;

-- Cancel/archive an entire agreement (soft-delete)
UPDATE agreements SET status = 'cancelled' WHERE id = ?;

-- View archive (cancelled agreements)
SELECT * FROM agreements WHERE status = 'cancelled';
```

### Search & Customer History

```sql
-- Universal search by NIC — returns ALL linked agreements/ACs
SELECT a.*, ac.model, ac.brand, ac.serial_indoor, ac.serial_outdoor
FROM agreements a
JOIN customers c ON a.customer_id = c.id
JOIN ac_units ac ON a.ac_unit_id = ac.id
WHERE c.nic = ?
ORDER BY a.created_at DESC;

-- Same, by phone
SELECT a.*, ac.model, ac.brand
FROM agreements a
JOIN customers c ON a.customer_id = c.id
JOIN ac_units ac ON a.ac_unit_id = ac.id
WHERE c.phone = ?
ORDER BY a.created_at DESC;

-- Direct lookup by AS- number (also used to pre-fill the Renew AC screen)
SELECT a.*, c.name, c.phone, c.nic, c.address, c.route, ac.model, ac.brand, ac.serial_indoor, ac.serial_outdoor
FROM agreements a
JOIN customers c ON a.customer_id = c.id
JOIN ac_units ac ON a.ac_unit_id = ac.id
WHERE a.agreement_no = ?;

-- Customer loyalty duration
SELECT name, nic, phone, created_at,
       TIMESTAMPDIFF(YEAR, created_at, CURDATE()) AS years_as_customer
FROM customers
WHERE id = ?;

-- Full renewal chain for one AC (walk parent_agreement_id backwards)
WITH RECURSIVE agreement_chain AS (
  SELECT * FROM agreements WHERE id = ?
  UNION ALL
  SELECT a.* FROM agreements a
  JOIN agreement_chain ac ON a.id = ac.parent_agreement_id
)
SELECT * FROM agreement_chain ORDER BY start_date;
```

### Reporting

```sql
-- Technician job count for a date range (only counts admin-confirmed completions)
SELECT COUNT(*) AS completed_jobs
FROM jobs
WHERE technician_id = ?
  AND status = 'completed'
  AND admin_confirmed = TRUE
  AND completed_at BETWEEN ? AND ?;

-- Technician performance, grouped by day (for a month view)
SELECT DATE(completed_at) AS day, COUNT(*) AS jobs_done
FROM jobs
WHERE technician_id = ?
  AND status = 'completed'
  AND admin_confirmed = TRUE
  AND completed_at BETWEEN ? AND ?
GROUP BY DATE(completed_at)
ORDER BY day;
```

### Pricing (Admin-only)

```sql
-- View current pricing
SELECT * FROM pricing;

-- Update/add a price
INSERT INTO pricing (service_type, price) VALUES (?, ?)
ON DUPLICATE KEY UPDATE price = VALUES(price), updated_at = NOW();
```

### User Management (Admin-only)

```sql
-- List all users
SELECT id, name, phone, role, active FROM users;

-- Add a new user (system_user or technician)
INSERT INTO users (name, phone, role, password_hash) VALUES (?, ?, ?, ?);

-- Update a user
UPDATE users SET name = ?, phone = ?, role = ? WHERE id = ?;

-- Deactivate (soft-delete) a user rather than hard-deleting
UPDATE users SET active = FALSE WHERE id = ?;
```

---

## 5. Backup Recommendation

UHL's Node.js/Python Silver plan includes **daily automated backups** — no extra setup needed. For an additional manual safety net:

```
0 2 * * * mysqldump -u youruser_appuser -pYOURPASS youruser_acservice > /home/youruser/backups/db_$(date +\%F).sql
```
