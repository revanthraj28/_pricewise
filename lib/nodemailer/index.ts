// lib/nodemailer.ts
"use server";

import nodemailer from "nodemailer";
import { EmailContent, EmailProductInfo, NotificationType } from "@/types";

// Notification types
const Notification = {
  WELCOME: 'WELCOME',
  CHANGE_OF_STOCK: 'CHANGE_OF_STOCK',
  LOWEST_PRICE: 'LOWEST_PRICE',
  THRESHOLD_MET: 'THRESHOLD_MET',
} as const;

// Generates dynamic email body and subject
export async function generateEmailBody(
  product: EmailProductInfo,
  type: NotificationType
): Promise<EmailContent> {
  const THRESHOLD_PERCENTAGE = 40;
  const shortenedTitle =
    product.title.length > 20 ? `${product.title.substring(0, 20)}...` : product.title;

  let subject = '';
  let body = '';

  switch (type) {
    case Notification.WELCOME:
      subject = `Welcome to Price Tracking for ${shortenedTitle}`;
      body = `
        <div>
          <h2>Welcome to PriceWise 🚀</h2>
          <p>You are now tracking <strong>${product.title}</strong>.</p>
          <p>Here's an example of how you'll receive updates:</p>
          <div style="border: 1px solid #ccc; padding: 10px; background-color: #f8f8f8;">
            <h3>${product.title} is back in stock!</h3>
            <p><a href="${product.url}" target="_blank" rel="noopener noreferrer">Click here to buy</a></p>
            <img src="${product.image}" alt="Product Image" style="max-width: 100%;" />
          </div>
        </div>
      `;
      break;

    case Notification.CHANGE_OF_STOCK:
      subject = `${shortenedTitle} is now back in stock!`;
      body = `
        <div>
          <h3>${product.title} is restocked! 🎉</h3>
          <p><a href="${product.url}" target="_blank" rel="noopener noreferrer">Buy it now</a></p>
        </div>
      `;
      break;

    case Notification.LOWEST_PRICE:
      subject = `Lowest Price Alert: ${shortenedTitle}`;
      body = `
        <div>
          <h3>🎯 Lowest price reached for ${product.title}!</h3>
          <p><a href="${product.url}" target="_blank" rel="noopener noreferrer">Grab the deal</a></p>
        </div>
      `;
      break;

    case Notification.THRESHOLD_MET:
      subject = `Big Discount Alert: ${shortenedTitle}`;
      body = `
        <div>
          <h3>🔥 ${product.title} has more than ${THRESHOLD_PERCENTAGE}% off!</h3>
          <p><a href="${product.url}" target="_blank" rel="noopener noreferrer">Check it out</a></p>
        </div>
      `;
      break;

    default:
      throw new Error("Invalid notification type.");
  }

  return { subject, body };
}

// Create Outlook SMTP transporter
const transporter = nodemailer.createTransport({
  host: "smtp-mail.outlook.com",
  port: 587,
  secure: false,
  auth: {
    user: "pricewiseexample@outlook.com",
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Optional: Verify transporter
transporter.verify((err, success) => {
  if (err) {
    console.error("❌ SMTP setup failed:", err);
  } else {
    console.log("✅ SMTP ready to send emails:", success);
  }
});

// Function to send email
export const sendEmail = async (emailContent: EmailContent, sendTo: string[]) => {
  const mailOptions = {
    from: "pricewiseexample@outlook.com",
    to: sendTo,
    subject: emailContent.subject,
    html: emailContent.body,
  };

  try {
    console.log("📧 Sending email to:", sendTo);
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.response);
  } catch (error) {
    console.error("❌ Failed to send email:", error);
    throw new Error("Email failed to send.");
  }
};
