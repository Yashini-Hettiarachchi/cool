-- ============================================================
-- Highcool AC Service Management System — MySQL schema
-- 9 tables. Source: design-plans/07_Database_Setup_Guide_MySQL.md
-- Run in phpMyAdmin (cPanel) or a local MySQL instance.
-- ============================================================

-- Create the database with utf8mb4 (required for Sinhala text in `route`).
CREATE DATABASE IF NOT EXISTS ac_service_system
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ac_service_system;

-- USERS (3 roles: admin, system_user, technician)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  username VARCHAR(100) NOT NULL UNIQUE,   -- login identifier
  phone VARCHAR(20),                       -- contact only
  role ENUM('admin','system_user','technician') NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_username (username)
);

-- CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
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
CREATE TABLE IF NOT EXISTS ac_units (
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
CREATE TABLE IF NOT EXISTS pricing (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service_type ENUM('normal','hp') NOT NULL UNIQUE,
  price DECIMAL(10,2) NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- AGREEMENTS (Normal/H-P count + period model)
CREATE TABLE IF NOT EXISTS agreements (
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

-- JOBS (expanded per wireframe)
CREATE TABLE IF NOT EXISTS jobs (
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
CREATE TABLE IF NOT EXISTS job_photos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  photo_path VARCHAR(255) NOT NULL,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  uploaded_by INT,
  FOREIGN KEY (job_id) REFERENCES jobs(id),
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- SMS LOGS
CREATE TABLE IF NOT EXISTS sms_logs (
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
