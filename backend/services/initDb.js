const db = require("../db");

/**
 * Automatically initializes new tables and adds required columns safely
 * without dropping or destroying existing data.
 */
function initializeDatabase() {

  // =========================================================
  // 0. Create departments table if not exists + seed defaults
  // =========================================================
  const createDepartmentsTableQuery = `
    CREATE TABLE IF NOT EXISTS departments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      department_name VARCHAR(150) NOT NULL UNIQUE,
      description TEXT NULL,
      status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  db.query(createDepartmentsTableQuery, (deptErr) => {
    if (deptErr) {
      console.error("❌ Error ensuring departments table exists:", deptErr.message);
    } else {
      console.log("✅ Departments table ready");

      // Seed default departments (INSERT IGNORE = skip if already exists)
      const seedDepartments = [
        ["Water Supply Department", "Manages water supply, pipelines, and water quality for the municipality."],
        ["Roads & Highways Department", "Responsible for road construction, maintenance, and pothole repairs."],
        ["Electrical Department", "Manages street lighting, electrical infrastructure, and power supply issues."],
        ["Sanitation Department", "Handles garbage collection, waste management, and public cleanliness."],
        ["Drainage & Sewerage Department", "Manages drainage systems, sewerage networks, and stormwater."],
        ["Public Health Department", "Oversees public health, sanitation inspections, and epidemic control."],
        ["Parks & Environment Department", "Manages parks, trees, environment, and animal-related issues."],
        ["General Administration Department", "Handles miscellaneous civic complaints and general administration."],
      ];

      seedDepartments.forEach(([name, description]) => {
        db.query(
          "INSERT IGNORE INTO departments (department_name, description) VALUES (?, ?)",
          [name, description],
          (seedErr) => {
            if (seedErr) {
              console.error(`❌ Error seeding department "${name}":`, seedErr.message);
            }
          }
        );
      });
    }
  });

  // 1. Create feedback table if not exists
  const createFeedbackTableQuery = `
    CREATE TABLE IF NOT EXISTS feedback (
      id INT AUTO_INCREMENT PRIMARY KEY,
      petition_id INT NOT NULL,
      citizen_id INT NOT NULL,
      rating INT NOT NULL,
      resolution_status ENUM('Yes', 'Partially', 'No') NOT NULL,
      comment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_petition_citizen_feedback (petition_id, citizen_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  db.query(createFeedbackTableQuery, (err) => {
    if (err) {
      console.error("❌ Error ensuring feedback table exists:", err.message);
    } else {
      console.log("✅ Feedback table ready");
    }
  });

  // 2. Add SLA and Escalation columns to petitions table if they don't already exist
  const checkColumnsQuery = `
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'petitions';
  `;

  db.query(checkColumnsQuery, (err, results) => {
    if (err) {
      console.error("❌ Error checking petitions table columns:", err.message);
      return;
    }

    const existingColumns = (results || []).map((row) => row.COLUMN_NAME.toLowerCase());

    const columnsToAdd = [
      { name: "priority", type: "VARCHAR(50) DEFAULT 'MEDIUM'" },
      { name: "sla_deadline", type: "DATETIME NULL" },
      { name: "escalated", type: "BOOLEAN DEFAULT FALSE" },
      { name: "escalated_at", type: "DATETIME NULL" },
      { name: "escalation_reason", type: "VARCHAR(255) NULL" },
      { name: "assigned_to", type: "VARCHAR(255) NULL" },
      { name: "assigned_department", type: "VARCHAR(255) NULL" },
      { name: "department_id", type: "INT NULL" },
      { name: "is_spam", type: "BOOLEAN DEFAULT FALSE" },
      { name: "spam_score", type: "FLOAT DEFAULT 0" },
      { name: "spam_reason", type: "VARCHAR(255) NULL" },
    ];

    columnsToAdd.forEach((col) => {
      if (!existingColumns.includes(col.name.toLowerCase())) {
        const addColQuery = `ALTER TABLE petitions ADD COLUMN ${col.name} ${col.type};`;
        db.query(addColQuery, (alterErr) => {
          if (alterErr) {
            console.error(`❌ Error adding column ${col.name}:`, alterErr.message);
          } else {
            console.log(`✅ Added column ${col.name} to petitions table`);
          }
        });
      }
    });
  });

  // 3. Add department, department_id, sub_role, is_active columns to officers table
  const checkOfficersColumnsQuery = `
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'officers';
  `;

  db.query(checkOfficersColumnsQuery, (err, results) => {
    if (err) {
      console.error("❌ Error checking officers table columns:", err.message);
      return;
    }

    const existingOfficerColumns = (results || []).map((row) =>
      row.COLUMN_NAME.toLowerCase()
    );

    // Legacy string department column
    if (!existingOfficerColumns.includes("department")) {
      db.query(
        `ALTER TABLE officers ADD COLUMN department VARCHAR(100) NULL DEFAULT NULL;`,
        (alterErr) => {
          if (alterErr) {
            console.error("❌ Error adding department column to officers:", alterErr.message);
          } else {
            console.log("✅ Added department column to officers table");
          }
        }
      );
    }

    // New FK department_id column
    if (!existingOfficerColumns.includes("department_id")) {
      db.query(
        `ALTER TABLE officers ADD COLUMN department_id INT NULL DEFAULT NULL;`,
        (alterErr) => {
          if (alterErr) {
            console.error("❌ Error adding department_id column to officers:", alterErr.message);
          } else {
            console.log("✅ Added department_id column to officers table");
          }
        }
      );
    }

    // sub_role: 'municipal' or 'department'
    if (!existingOfficerColumns.includes("sub_role")) {
      db.query(
        `ALTER TABLE officers ADD COLUMN sub_role VARCHAR(50) NOT NULL DEFAULT 'municipal';`,
        (alterErr) => {
          if (alterErr) {
            console.error("❌ Error adding sub_role column to officers:", alterErr.message);
          } else {
            console.log("✅ Added sub_role column to officers table");
          }
        }
      );
    }

    // is_active flag
    if (!existingOfficerColumns.includes("is_active")) {
      db.query(
        `ALTER TABLE officers ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;`,
        (alterErr) => {
          if (alterErr) {
            console.error("❌ Error adding is_active column to officers:", alterErr.message);
          } else {
            console.log("✅ Added is_active column to officers table");
          }
        }
      );
    }
  });
}

module.exports = { initializeDatabase };
