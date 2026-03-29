import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
    const host = this.configService.get<string>('EMAIL_HOST');
    const port = Number(this.configService.get<string>('EMAIL_PORT') ?? '587');
    const user = this.configService.get<string>('EMAIL_USER');
    const pass = this.configService.get<string>('EMAIL_PASS');
    const from = this.configService.get<string>('EMAIL_FROM') ?? user;

    // If SMTP is not configured, log the URL so development can continue.
    if (!host || !user || !pass) {
      this.logger.warn(
        `SMTP not configured. Password reset link for ${email}: ${resetUrl}`,
      );
      return;
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

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
}
