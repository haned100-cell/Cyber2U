import nodemailer from 'nodemailer';
import config from '../config';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    if (config.nodeEnv === 'development') {
      // Use MailHog in development
      transporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
      });
    } else {
      // Use configured SMTP in production
      transporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        auth: {
          user: config.email.user,
          pass: config.email.pass,
        },
      });
    }
  }
  return transporter;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  const transporter = getTransporter();
  try {
    await transporter.sendMail({
      from: config.email.from,
      ...options,
    });
    console.log(`Email sent to ${options.to}`);
  } catch (error) {
    console.error('Email send failed:', error);
    throw error;
  }
}

export function generateMagicLinkEmail(verificationLink: string, email: string): { html: string; text: string } {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px;">
      <h2>Welcome to Cyber2You</h2>
      <p>Hi there,</p>
      <p>Click the link below to verify your email and get started on your cybersecurity journey:</p>
      <p style="margin: 30px 0;">
        <a href="${verificationLink}" style="
          display: inline-block;
          padding: 12px 30px;
          background-color: #007bff;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
        ">Verify Email</a>
      </p>
      <p>Or copy and paste this link in your browser:</p>
      <p><code>${verificationLink}</code></p>
      <p>This link expires in 1 hour.</p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;" />
      <p style="color: #666; font-size: 12px;">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
  `;

  const text = `
    Welcome to Cyber2You

    Click this link to verify your email and get started:
    ${verificationLink}

    This link expires in 1 hour.

    If you didn't request this, you can safely ignore this email.
  `;

  return { html, text };
}

export function generateDemoQuizEmail(quizLink: string): { html: string; text: string } {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #0f172a;">
      <h2 style="margin-bottom: 8px;">Weekly Cyber2U Quiz</h2>
      <p style="margin-top: 0; color: #334155;">Complete this mini challenge to improve your cybersecurity awareness.</p>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Question 1</h3>
        <p style="font-size: 15px; line-height: 1.5;">
          What is the safest response to an urgent password reset email you did not request?
        </p>
        <ol style="padding-left: 20px; line-height: 1.7;">
          <li>Click the link immediately to secure your account.</li>
          <li>Reply with your employee ID and current password.</li>
          <li>Open your browser and navigate to the known official website directly.</li>
          <li>Forward it to teammates and ask if it looks real.</li>
        </ol>
      </div>

      <p style="margin: 24px 0;">
        <a href="${quizLink}" style="display: inline-block; background: #0f766e; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 6px; font-weight: bold;">
          Open Interactive Quiz
        </a>
      </p>

      <p style="color: #475569; font-size: 13px;">Tip: Never trust urgency. Verify through a trusted channel first.</p>
    </div>
  `;

  const text = `
Weekly Cyber2U Quiz

Question 1:
What is the safest response to an urgent password reset email you did not request?

1) Click the link immediately to secure your account.
2) Reply with your employee ID and current password.
3) Open your browser and navigate to the known official website directly.
4) Forward it to teammates and ask if it looks real.

Open Interactive Quiz: ${quizLink}
  `.trim();

  return { html, text };
}

export async function sendWelcomeEmail(email: string): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px;">
      <h2>Welcome to Cyber2You!</h2>
      <p>Your email has been verified. You're now ready to start learning about cybersecurity!</p>
      <p>This week's cybersecurity tip:</p>
      <div style="background: #f0f0f0; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3>🔐 Use Unique Passwords</h3>
        <p>Create strong, unique passwords for each online account. Consider using a password manager to keep track of them securely.</p>
      </div>
      <p>Check your dashboard to track your progress and complete quizzes!</p>
    </div>
  `;

  const text = `
    Welcome to Cyber2You!

    Your email has been verified. Start learning about cybersecurity today.

    This week's tip: Use unique passwords for each account and consider using a password manager.
  `;

  await sendEmail({
    to: email,
    subject: 'Welcome to Cyber2You - Your Cybersecurity Education Starts Here',
    html,
    text,
  });
}

export async function sendDemoQuizEmail(email: string, quizLink: string): Promise<void> {
  const { html, text } = generateDemoQuizEmail(quizLink);

  await sendEmail({
    to: email,
    subject: 'Cyber2U Weekly Quiz: Spot the Phish',
    html,
    text,
  });
}
