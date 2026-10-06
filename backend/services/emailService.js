const nodemailer = require("nodemailer");
require("dotenv").config();

// Reusable Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Standard Civic Tech HTML Email Wrapper
 */
function createEmailTemplate(title, bodyHtml) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <div style="background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%); padding: 24px; text-align: center; color: #ffffff;">
        <h2 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">🏛️ Smart Grievance System</h2>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #E0E7FF;">Civic Redressal & Public Administration Portal</p>
      </div>

      <div style="padding: 30px 24px; color: #334155; line-height: 1.6;">
        <h3 style="color: #1E3A8A; margin-top: 0; font-size: 18px; border-bottom: 2px solid #F1F5F9; padding-bottom: 8px;">${title}</h3>
        ${bodyHtml}
      </div>

      <div style="background: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748B;">
        <p style="margin: 0 0 4px 0;">This is an automated notification from the Smart Grievance Addressing System.</p>
        <p style="margin: 0;">Municipal Corporation Support | helpline: 1800-425-0102</p>
      </div>
    </div>
  `;
}

/**
 * Safe send mail wrapper that logs errors without crashing
 */
async function sendMailSafe(toEmail, subject, htmlContent) {
  if (!toEmail || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("⚠️ Email not sent: Missing recipient email or email credentials in .env");
    return;
  }

  try {
    await transporter.sendMail({
      from: `"Smart Grievance System" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: subject,
      html: htmlContent,
    });
    console.log(`✉️ Email sent successfully to ${toEmail} with subject: "${subject}"`);
  } catch (err) {
    console.error(`❌ Email notification failed to ${toEmail} (${subject}):`, err.message);
  }
}

/**
 * 1. Petition Submitted Notification
 */
async function sendPetitionSubmittedEmail(email, name, petitionId, category, location) {
  const formattedId = `SG-${petitionId}`;
  const subject = "Smart Grievance – Petition Submitted";
  const bodyHtml = `
    <p>Dear <strong>${name || "Citizen"}</strong>,</p>
    <p>Your civic grievance petition has been successfully submitted and registered in the municipal portal.</p>
    
    <div style="background: #F8FAFC; border-left: 4px solid #2563EB; padding: 16px; margin: 16px 0; border-radius: 4px;">
      <p style="margin: 4px 0;"><strong>Petition ID:</strong> <span style="color: #1E3A8A; font-weight: 700;">${formattedId}</span></p>
      <p style="margin: 4px 0;"><strong>Category:</strong> ${category || "General Civic Issue"}</p>
      <p style="margin: 4px 0;"><strong>Location:</strong> ${location || "Madurai"}</p>
      <p style="margin: 4px 0;"><strong>Current Status:</strong> <span style="background: #FEF3C7; color: #92400E; padding: 2px 8px; border-radius: 12px; font-weight: 600; font-size: 12px;">Submitted</span></p>
    </div>

    <p>You can track the live progress and resolution status anytime by logging in to the portal.</p>
    <p>Thank you for using the Smart Grievance Addressing System.</p>
  `;

  await sendMailSafe(email, subject, createEmailTemplate("Grievance Petition Submitted", bodyHtml));
}

/**
 * 2. Petition Status Changed to Under Review
 */
async function sendPetitionUnderReviewEmail(email, name, petitionId, category, location) {
  const formattedId = `SG-${petitionId}`;
  const subject = "Smart Grievance – Petition Under Review";
  const bodyHtml = `
    <p>Dear <strong>${name || "Citizen"}</strong>,</p>
    <p>Your grievance petition <strong>${formattedId}</strong> is now under official review by the municipal department.</p>

    <div style="background: #F8FAFC; border-left: 4px solid #0EA5E9; padding: 16px; margin: 16px 0; border-radius: 4px;">
      <p style="margin: 4px 0;"><strong>Petition ID:</strong> ${formattedId}</p>
      <p style="margin: 4px 0;"><strong>Category:</strong> ${category || "General"}</p>
      <p style="margin: 4px 0;"><strong>Location:</strong> ${location || "Madurai"}</p>
      <p style="margin: 4px 0;"><strong>New Status:</strong> <span style="background: #E0F2FE; color: #0369A1; padding: 2px 8px; border-radius: 12px; font-weight: 600; font-size: 12px;">Under Review</span></p>
    </div>

    <p>An assigned officer is examining the details and coordinating field inspection.</p>
  `;

  await sendMailSafe(email, subject, createEmailTemplate("Status Update: Under Review", bodyHtml));
}

/**
 * 3. Petition Assigned
 */
async function sendPetitionAssignedEmail(email, name, petitionId, department) {
  const formattedId = `SG-${petitionId}`;
  const subject = "Smart Grievance – Petition Assigned";
  const bodyHtml = `
    <p>Dear <strong>${name || "Citizen"}</strong>,</p>
    <p>Your complaint <strong>${formattedId}</strong> has been assigned to the <strong>${department || "Municipal Operations Department"}</strong> for action.</p>

    <div style="background: #F8FAFC; border-left: 4px solid #6366F1; padding: 16px; margin: 16px 0; border-radius: 4px;">
      <p style="margin: 4px 0;"><strong>Petition ID:</strong> ${formattedId}</p>
      <p style="margin: 4px 0;"><strong>Assigned Unit:</strong> ${department || "Department Field Team"}</p>
      <p style="margin: 4px 0;"><strong>Current Status:</strong> <span style="background: #EEF2FF; color: #4338CA; padding: 2px 8px; border-radius: 12px; font-weight: 600; font-size: 12px;">Assigned</span></p>
    </div>
  `;

  await sendMailSafe(email, subject, createEmailTemplate("Grievance Assigned to Department", bodyHtml));
}

/**
 * 4. Petition Status Changed to In Progress
 */
async function sendPetitionInProgressEmail(email, name, petitionId, category, location) {
  const formattedId = `SG-${petitionId}`;
  const subject = "Smart Grievance – Petition In Progress";
  const bodyHtml = `
    <p>Dear <strong>${name || "Citizen"}</strong>,</p>
    <p>Active field work and repairs are currently in progress for your complaint <strong>${formattedId}</strong>.</p>

    <div style="background: #F8FAFC; border-left: 4px solid #2563EB; padding: 16px; margin: 16px 0; border-radius: 4px;">
      <p style="margin: 4px 0;"><strong>Petition ID:</strong> ${formattedId}</p>
      <p style="margin: 4px 0;"><strong>Category:</strong> ${category || "General"}</p>
      <p style="margin: 4px 0;"><strong>Location:</strong> ${location || "Madurai"}</p>
      <p style="margin: 4px 0;"><strong>Current Status:</strong> <span style="background: #DBEAFE; color: #1E40AF; padding: 2px 8px; border-radius: 12px; font-weight: 600; font-size: 12px;">In Progress</span></p>
    </div>

    <p>Our maintenance team is working on resolving the issue promptly.</p>
  `;

  await sendMailSafe(email, subject, createEmailTemplate("Status Update: In Progress", bodyHtml));
}

/**
 * 5. Petition Resolved Notification
 */
async function sendPetitionResolvedEmail(email, name, petitionId) {
  const formattedId = `SG-${petitionId}`;
  const subject = "Smart Grievance – Petition Resolved";
  const bodyHtml = `
    <p>Dear <strong>${name || "Citizen"}</strong>,</p>
    <p>Your petition <strong>${formattedId}</strong> has been marked as <strong>Resolved</strong> by the attending municipal officer.</p>

    <div style="background: #F0FDF4; border-left: 4px solid #10B981; padding: 16px; margin: 16px 0; border-radius: 4px;">
      <p style="margin: 4px 0;"><strong>Petition ID:</strong> ${formattedId}</p>
      <p style="margin: 4px 0;"><strong>Resolution Status:</strong> <span style="background: #DCFCE7; color: #15803D; padding: 2px 8px; border-radius: 12px; font-weight: 600; font-size: 12px;">Resolved</span></p>
    </div>

    <p style="font-size: 15px; color: #1E3A8A; font-weight: 600;">⭐ We value your feedback!</p>
    <p>You can now log in to the Smart Grievance Addressing System portal and provide your rating and feedback on the resolution quality.</p>
  `;

  await sendMailSafe(email, subject, createEmailTemplate("Grievance Resolved — Provide Feedback", bodyHtml));
}

/**
 * 6. Automatic Escalation Notification
 */
async function sendPetitionEscalatedEmail(email, name, petitionId, status) {
  const formattedId = `SG-${petitionId}`;
  const subject = "Smart Grievance – Petition Escalated";
  const bodyHtml = `
    <p>Dear <strong>${name || "Citizen"}</strong>,</p>
    <p>Your petition <strong>${formattedId}</strong> has exceeded its expected Service Level Agreement (SLA) resolution time.</p>

    <div style="background: #FEF2F2; border-left: 4px solid #EF4444; padding: 16px; margin: 16px 0; border-radius: 4px;">
      <p style="margin: 4px 0;"><strong>Petition ID:</strong> ${formattedId}</p>
      <p style="margin: 4px 0;"><strong>Current Status:</strong> ${status || "In Progress"}</p>
      <p style="margin: 4px 0;"><strong>Escalation Action:</strong> <span style="background: #FEE2E2; color: #B91C1C; padding: 2px 8px; border-radius: 12px; font-weight: 600; font-size: 12px;">Escalated to Senior Officer / Admin</span></p>
    </div>

    <p>It has been escalated for priority intervention and supervision by senior municipal authorities. We apologize for the delay and are working to expedite the resolution.</p>
  `;

  await sendMailSafe(email, subject, createEmailTemplate("Petition Automatically Escalated", bodyHtml));
}

/**
 * 7. Admin Add Officer Verification OTP Email
 */
async function sendOfficerOtpEmail(email, name, otp) {
  const subject = "Smart Grievance – Officer Account Verification OTP";
  const bodyHtml = `
    <p>Hello <strong>${name || "Municipal Officer"}</strong>,</p>
    <p>You have been invited to join the Smart Grievance Addressing System as an Officer.</p>
    <p>Your one-time email verification code is:</p>

    <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; background: #F1F5F9; padding: 18px; border-radius: 8px; margin: 16px 0; color: #1E3A8A;">
      ${otp}
    </div>

    <p>This OTP is valid for <strong>5 minutes</strong>. Please provide this code to the Admin to complete your registration.</p>
  `;

  await sendMailSafe(email, subject, createEmailTemplate("Officer Verification OTP", bodyHtml));
}

module.exports = {
  sendPetitionSubmittedEmail,
  sendPetitionUnderReviewEmail,
  sendPetitionAssignedEmail,
  sendPetitionInProgressEmail,
  sendPetitionResolvedEmail,
  sendPetitionEscalatedEmail,
  sendOfficerOtpEmail,
};
