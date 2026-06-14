import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {}

  private getTransporter() {
    const user = this.configService.get<string>('EMAIL_USER');
    const pass = this.configService.get<string>('EMAIL_PASS');

    // Fail early if environment variables are not accessible in runtime context
    if (!user || !pass) {
      return null;
    }

    return nodemailer.createTransport({
      service: 'gmail', // ⚡️ Tells Nodemailer to automatically handle Google's SMTP routing policies
      auth: {
        user,
        pass, // Your 16-character Google App Password (spaces removed)
      },
    });
  }

  async sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
    const user = this.configService.get<string>('EMAIL_USER');
    const from = this.configService.get<string>('EMAIL_FROM') ?? user;
    const transporter = this.getTransporter();

    if (!transporter) {
      this.logger.warn(
        `SMTP credentials missing. Password reset link for ${email}: ${resetUrl}`,
      );
      return;
    }

    await transporter.sendMail({
      from,
      to: email,
      subject: 'Reset your TraceVault password',
      html: `
        <p>You requested a password reset.</p>
        <p>Click this link to reset your password:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link expires in 1 hour.</p>
      `,
      text: `Reset your TraceVault password: ${resetUrl} (expires in 1 hour).`,
    });
  }

  async sendMfaOtpEmail(email: string, code: string): Promise<void> {
    const user = this.configService.get<string>('EMAIL_USER');
    const from = this.configService.get<string>('EMAIL_FROM') ?? user;
    const transporter = this.getTransporter();

    if (!transporter) {
      this.logger.warn(
        `SMTP credentials missing. MFA Verification Code for ${email}: [ ${code} ]`,
      );
      return;
    }

    await transporter.sendMail({
      from,
      to: email,
      subject: 'Your TraceVault Verification Code',
      html: `
        <div style="font-family: sans-serif; padding: 20px; max-width: 400px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #111;">TraceVault Checkpoint</h2>
          <p>Enter the following dynamic security verification token to complete your login challenge:</p>
          <div style="background: #f4f4f5; padding: 16px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 0.25em; border-radius: 4px; margin: 20px 0; color: #000;">
            ${code}
          </div>
          <p style="font-size: 12px; color: #71717a;">This security code remains valid for 5 minutes.</p>
        </div>
      `,
      text: `Your TraceVault dynamic security verification token is: ${code} (Expires in 5 minutes).`,
    });
  }
}
