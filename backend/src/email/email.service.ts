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

    if (!user || !pass) {
      return null;
    }

    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
    });
  }

  private getFromAddress(): string {
    const user = this.configService.get<string>('EMAIL_USER');
    const fromEmail = this.configService.get<string>('EMAIL_FROM') ?? user;
    return `"TraceVault" <${fromEmail}>`;
  }

  async sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
    const transporter = this.getTransporter();

    if (!transporter) {
      this.logger.warn(
        `SMTP credentials missing. Password reset link for ${email}: ${resetUrl}`,
      );
      return;
    }

    await transporter.sendMail({
      from: this.getFromAddress(),
      to: email,
      subject: 'Reset your TraceVault password',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 32px; max-width: 480px; background-color: #09090b; color: #fafafa; border-radius: 12px; border: 1px solid #27272a; margin: 0 auto;">
          <div style="margin-bottom: 24px;">
            <span style="font-family: monospace; font-weight: bold; letter-spacing: 0.05em; font-size: 18px; color: #ffffff; border-left: 3px solid #ffffff; padding-left: 10px;">TRACEVAULT</span>
          </div>
          <h2 style="font-size: 20px; font-weight: 600; color: #ffffff; margin-top: 0; margin-bottom: 12px;">Password Reset Request</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #a1a1aa; margin-top: 0; margin-bottom: 24px;">
            A password reset request was initiated for your engineering reflection ledger. Click the secure action link below to configure your new credentials.
          </p>
          <div style="margin-bottom: 24px;">
            <a href="${resetUrl}" target="_blank" style="display: inline-block; background-color: #ffffff; color: #09090b; font-weight: 500; font-size: 14px; padding: 12px 24px; text-decoration: none; border-radius: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
              Reset Password
            </a>
          </div>
          <p style="font-size: 12px; line-height: 1.5; color: #71717a; margin-bottom: 8px; word-break: break-all;">
            If the button doesn't work, copy and paste this URL into your browser:<br>
            <a href="${resetUrl}" style="color: #a1a1aa; text-decoration: underline;">${resetUrl}</a>
          </p>
          <hr style="border: 0; border-top: 1px solid #27272a; margin: 24px 0;">
          <p style="font-size: 11px; color: #52525b; margin: 0;">
            This security links expires in 1 hour. If you did not request this modification, you can safely ignore this automated message.
          </p>
        </div>
      `,
      text: `Reset your TraceVault password by visiting: ${resetUrl} (Link expires in 1 hour).`,
    });
  }

  async sendMfaOtpEmail(email: string, code: string): Promise<void> {
    const transporter = this.getTransporter();

    if (!transporter) {
      this.logger.warn(
        `SMTP credentials missing. MFA Verification Code for ${email}: [ ${code} ]`,
      );
      return;
    }

    await transporter.sendMail({
      from: this.getFromAddress(),
      to: email,
      subject: 'Your TraceVault Verification Code',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 32px; max-width: 480px; background-color: #09090b; color: #fafafa; border-radius: 12px; border: 1px solid #27272a; margin: 0 auto;">
          <div style="margin-bottom: 24px;">
            <span style="font-family: monospace; font-weight: bold; letter-spacing: 0.05em; font-size: 18px; color: #ffffff; border-left: 3px solid #ffffff; padding-left: 10px;">TRACEVAULT</span>
          </div>
          <h2 style="font-size: 20px; font-weight: 600; color: #ffffff; margin-top: 0; margin-bottom: 12px;">Security Checkpoint</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #a1a1aa; margin-top: 0; margin-bottom: 24px;">
            Provide the following dynamic security verification token to complete your authentication challenge session.
          </p>
          <div style="background-color: #18181b; border: 1px solid #27272a; padding: 20px; text-align: center; font-size: 28px; font-weight: 700; letter-spacing: 0.3em; border-radius: 8px; margin-bottom: 24px; color: #ffffff; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">
            ${code}
          </div>
          <hr style="border: 0; border-top: 1px solid #27272a; margin: 24px 0;">
          <p style="font-size: 11px; color: #52525b; margin: 0; line-height: 1.4;">
            This dynamic security code remains valid for exactly 5 minutes. To ensure the integrity of your technical time machine repository, never disclose this security token to anyone.
          </p>
        </div>
      `,
      text: `Your TraceVault dynamic security verification token is: ${code} (Expires in 5 minutes).`,
    });
  }
}
