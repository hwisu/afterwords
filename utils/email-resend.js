import { Resend } from 'resend';

export async function sendWelcomeEmail(env, userEmail, username) {
  // If no API key is configured, skip email sending
  if (!env.RESEND_API_KEY) {
    console.log('RESEND_API_KEY not configured, skipping welcome email');
    return;
  }

  const resend = new Resend(env.RESEND_API_KEY);
  
  try {
    await resend.emails.send({
      from: 'Afterwords <noreply@afterwords.app>',
      to: userEmail,
      subject: 'Welcome to Afterwords!',
      html: `
        <h2>Welcome to Afterwords, ${username}!</h2>
        <p>Thank you for joining our book review community.</p>
        <p>You can now:</p>
        <ul>
          <li>Create or join book review groups</li>
          <li>Write and share your book reviews</li>
          <li>Discover new books through others' reviews</li>
          <li>Participate in group discussions</li>
        </ul>
        <p>Happy reading!</p>
        <p>- The Afterwords Team</p>
      `
    });
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    // Don't throw - email failure shouldn't break registration
  }
}

export async function sendPasswordResetEmail(env, userEmail, resetToken) {
  if (!env.RESEND_API_KEY) {
    console.log('RESEND_API_KEY not configured, skipping password reset email');
    return;
  }

  const resend = new Resend(env.RESEND_API_KEY);
  const resetUrl = `${env.APP_URL || 'http://localhost:8787'}/reset-password?token=${resetToken}`;
  
  try {
    await resend.emails.send({
      from: 'Afterwords <noreply@afterwords.app>',
      to: userEmail,
      subject: 'Reset your Afterwords password',
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password for your Afterwords account.</p>
        <p>Click the link below to reset your password:</p>
        <p><a href="${resetUrl}">Reset Password</a></p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
        <p>- The Afterwords Team</p>
      `
    });
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw error; // For password reset, we should throw to inform the user
  }
}