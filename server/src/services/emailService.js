import nodemailer from 'nodemailer';
import Notification from '../models/Notification.js';

// Setup transporter (falls back gracefully if SMTP not configured)
const createTransporter = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return null;
};

const transporter = createTransporter();

/**
 * Dispatch status update notification via email + in-app notification badge
 */
export const notifyStatusChange = async ({
  recipientUser,
  application,
  action,
  newStatus,
  remarks = '',
}) => {
  try {
    let title = '';
    let message = '';
    let type = 'ALERT';

    switch (newStatus) {
      case 'Submitted':
        title = 'Scholarship Application Submitted';
        message = `Your application (${application.applicationNumber}) has been submitted successfully and is pending college review.`;
        type = 'SUBMISSION';
        break;
      case 'Under Institution Review':
        title = 'College Review in Progress';
        message = `Institution admin has begun reviewing your application (${application.applicationNumber}).`;
        type = 'ALERT';
        break;
      case 'Forwarded':
        title = 'Application Verified & Forwarded';
        message = `Great news! Your college has verified your application (${application.applicationNumber}) and forwarded it to the State Authority for final sanction. Remarks: ${remarks || 'All documents verified.'}`;
        type = 'FORWARDED';
        break;
      case 'Approved':
        title = 'Scholarship Sanctioned!';
        message = `Congratulations! Your scholarship application (${application.applicationNumber}) has been officially approved. Direct Benefit Transfer disbursement has been queued.`;
        type = 'APPROVED';
        break;
      case 'Disbursed':
        title = 'Funds Disbursed to Bank Account';
        message = `Scholarship amount of ₹${(application.scholarshipScheme?.awardAmount || 50000).toLocaleString('en-IN')} has been disbursed via DBT to your registered bank account. Download your voucher now!`;
        type = 'DISBURSED';
        break;
      case 'Resubmission Requested':
        title = 'Action Required: Document Resubmission Requested';
        message = `Reviewer has requested updated documents for application (${application.applicationNumber}). Reason: ${remarks || 'Incomplete or unreadable document.'}`;
        type = 'RESUBMISSION';
        break;
      case 'Rejected':
        title = 'Application Rejected';
        message = `Your application (${application.applicationNumber}) was rejected. Reason: ${remarks || 'Criteria not met.'}`;
        type = 'REJECTED';
        break;
      default:
        title = `Status Updated: ${newStatus}`;
        message = `Your application (${application.applicationNumber}) status changed to ${newStatus}.`;
    }

    // 1. Save in-app notification in MongoDB
    if (recipientUser?._id) {
      await Notification.create({
        recipient: recipientUser._id,
        title,
        message,
        type,
        link: `/student/application/${application._id}`,
      });
    }

    // 2. Send email via Nodemailer if configured
    if (transporter && recipientUser?.email) {
      const mailOptions = {
        from: `"FundEase Scholarship Portal" <${process.env.EMAIL_FROM || 'noreply@fundease.gov.in'}>`,
        to: recipientUser.email,
        subject: `[FundEase] ${title} - ${application.applicationNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #0f294a; padding: 20px; color: #ffffff; text-align: center;">
              <h2 style="margin: 0;">FundEase Scholarship Portal</h2>
              <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Paperless Scholarship Disbursement Platform</p>
            </div>
            <div style="padding: 24px;">
              <h3 style="color: #0f294a; margin-top: 0;">${title}</h3>
              <p style="color: #334155; line-height: 1.6;">Dear <strong>${recipientUser.name}</strong>,</p>
              <p style="color: #334155; line-height: 1.6;">${message}</p>
              <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b;"><strong>Application No:</strong> ${application.applicationNumber}</p>
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b;"><strong>Current Status:</strong> <span style="color: #059669; font-weight: bold;">${newStatus}</span></p>
                ${remarks ? `<p style="margin: 0; font-size: 13px; color: #64748b;"><strong>Reviewer Remarks:</strong> ${remarks}</p>` : ''}
              </div>
              <p style="color: #64748b; font-size: 12px; margin-top: 24px;">
                This is an automated system notification. Please log in to your student portal to view detailed status and download disbursement receipts.
              </p>
            </div>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
    } else {
      console.log(`[Notification Dispatch] Simulated email to ${recipientUser?.email}: "${title}"`);
    }
  } catch (error) {
    console.error('[Notification Service Error]', error.message);
  }
};
