const db = require("../db");
const { sendPetitionEscalatedEmail } = require("./emailService");

/**
 * Calculates the SLA deadline based on priority
 * CRITICAL -> 24 hours
 * HIGH -> 3 days (72 hours)
 * MEDIUM -> 7 days (168 hours)
 * LOW -> 14 days (336 hours)
 */
function calculateSlaDeadline(priority, fromDate = new Date()) {
  const p = (priority || "MEDIUM").toUpperCase();
  const deadline = new Date(fromDate);

  switch (p) {
    case "CRITICAL":
      deadline.setHours(deadline.getHours() + 24);
      break;
    case "HIGH":
      deadline.setDate(deadline.getDate() + 3);
      break;
    case "LOW":
      deadline.setDate(deadline.getDate() + 14);
      break;
    case "MEDIUM":
    default:
      deadline.setDate(deadline.getDate() + 7);
      break;
  }

  return deadline;
}

/**
 * Checks for overdue petitions and escalates them automatically
 */
async function checkAndEscalatePetitions() {
  try {
    const overdueQuery = `
      SELECT p.id, p.citizen_id, p.citizen_name, p.status, p.category, p.area, p.sla_deadline, c.email
      FROM petitions p
      LEFT JOIN citizens c ON p.citizen_id = c.id
      WHERE (p.status NOT IN ('Resolved', 'Rejected') OR p.status IS NULL)
        AND p.sla_deadline IS NOT NULL
        AND NOW() > p.sla_deadline
        AND (p.escalated = 0 OR p.escalated IS NULL);
    `;

    db.query(overdueQuery, async (err, petitionsToEscalate) => {
      if (err) {
        console.error("❌ Escalation check query error:", err.message);
        return;
      }

      if (!petitionsToEscalate || petitionsToEscalate.length === 0) {
        return;
      }

      console.log(`🚨 Found ${petitionsToEscalate.length} overdue petition(s) to escalate.`);

      for (const pet of petitionsToEscalate) {
        const updateEscalationQuery = `
          UPDATE petitions
          SET escalated = 1,
              escalated_at = NOW(),
              escalation_reason = 'SLA deadline exceeded'
          WHERE id = ?;
        `;

        db.query(updateEscalationQuery, [pet.id], (updateErr) => {
          if (updateErr) {
            console.error(`❌ Failed to mark petition #${pet.id} as escalated:`, updateErr.message);
          } else {
            console.log(`🚨 Petition #${pet.id} automatically escalated.`);

            // Send notification to citizen email
            if (pet.email) {
              sendPetitionEscalatedEmail(
                pet.email,
                pet.citizen_name,
                pet.id,
                pet.status || "In Progress"
              ).catch((e) => console.error("Escalation email error:", e.message));
            }
          }
        });
      }
    });
  } catch (error) {
    console.error("❌ Unexpected error during automatic escalation run:", error.message);
  }
}

/**
 * Starts the periodic background checker for SLA escalations (runs every 5 minutes)
 */
function startEscalationScheduler() {
  // Run once on startup after 10 seconds
  setTimeout(() => {
    checkAndEscalatePetitions();
  }, 10000);

  // Run every 5 minutes
  setInterval(() => {
    checkAndEscalatePetitions();
  }, 5 * 60 * 1000);

  console.log("⏱️ SLA Automatic Escalation engine initialized (5-minute interval)");
}

module.exports = {
  calculateSlaDeadline,
  checkAndEscalatePetitions,
  startEscalationScheduler,
};
