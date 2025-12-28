import nodemailer from 'nodemailer';
import config from '../config';
import logger from '../config/logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface EmailTemplateData {
  userName?: string;
  organizationName?: string;
  verificationUrl?: string;
  resetUrl?: string;
  invitationUrl?: string;
  expiresIn?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    // Check if SMTP is configured
    if (config.EMAIL.HOST && config.EMAIL.USER && config.EMAIL.PASS) {
      this.transporter = nodemailer.createTransport({
        host: config.EMAIL.HOST,
        port: config.EMAIL.PORT || 587,
        secure: config.EMAIL.PORT === 465,
        auth: {
          user: config.EMAIL.USER,
          pass: config.EMAIL.PASS,
        },
      });
      this.isConfigured = true;
      logger.info('Email service configured successfully');
    } else {
      logger.info('Email service not configured - emails will be logged only (optional)');
      this.isConfigured = false;
    }
  }

  private async sendEmail(options: EmailOptions): Promise<boolean> {
    const { to, subject, html, text } = options;

    if (!this.isConfigured || !this.transporter) {
      // Log email for development/testing
      logger.info('=== EMAIL (not sent - SMTP not configured) ===');
      logger.info(`To: ${to}`);
      logger.info(`Subject: ${subject}`);
      logger.info(`Content: ${text || html.replace(/<[^>]*>/g, '')}`);
      logger.info('=== END EMAIL ===');
      return true; // Return true so the flow continues
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"CRM GTD Smart" <${config.EMAIL.USER}>`,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''),
      });

      logger.info(`Email sent: ${info.messageId} to ${to}`);
      return true;
    } catch (error) {
      logger.error('Failed to send email:', error);
      return false;
    }
  }

  // ===== Email Templates =====

  async sendWelcomeEmail(email: string, data: EmailTemplateData): Promise<boolean> {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Witamy w CRM GTD Smart!</h1>
    </div>
    <div class="content">
      <p>Cześć ${data.userName || 'Użytkowniku'},</p>
      <p>Dziękujemy za rejestrację w <strong>${data.organizationName || 'CRM GTD Smart'}</strong>!</p>
      <p>Twoje konto zostało utworzone pomyślnie. Aby w pełni korzystać z aplikacji, zweryfikuj swój adres email klikając poniższy przycisk:</p>
      <p style="text-align: center;">
        <a href="${data.verificationUrl}" class="button">Zweryfikuj Email</a>
      </p>
      <p>Link jest ważny przez ${data.expiresIn || '24 godziny'}.</p>
      <p>Jeśli nie zakładałeś konta, zignoruj tę wiadomość.</p>
      <p>Pozdrawiamy,<br>Zespół CRM GTD Smart</p>
    </div>
    <div class="footer">
      <p>Ten email został wysłany automatycznie. Nie odpowiadaj na niego.</p>
    </div>
  </div>
</body>
</html>`;

    return this.sendEmail({
      to: email,
      subject: 'Witamy w CRM GTD Smart - Zweryfikuj swój email',
      html,
    });
  }

  async sendEmailVerification(email: string, data: EmailTemplateData): Promise<boolean> {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .code { background: #e5e7eb; padding: 15px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 4px; border-radius: 6px; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Weryfikacja Email</h1>
    </div>
    <div class="content">
      <p>Cześć ${data.userName || 'Użytkowniku'},</p>
      <p>Kliknij poniższy przycisk, aby zweryfikować swój adres email:</p>
      <p style="text-align: center;">
        <a href="${data.verificationUrl}" class="button">Zweryfikuj Email</a>
      </p>
      <p>Lub skopiuj i wklej ten link w przeglądarce:</p>
      <p style="word-break: break-all; color: #3B82F6;">${data.verificationUrl}</p>
      <p>Link wygasa za ${data.expiresIn || '24 godziny'}.</p>
    </div>
    <div class="footer">
      <p>Jeśli nie prosiłeś o weryfikację, zignoruj tę wiadomość.</p>
    </div>
  </div>
</body>
</html>`;

    return this.sendEmail({
      to: email,
      subject: 'Zweryfikuj swój adres email - CRM GTD Smart',
      html,
    });
  }

  async sendPasswordReset(email: string, data: EmailTemplateData): Promise<boolean> {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #F59E0B; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .warning { background: #FEF3C7; border: 1px solid #F59E0B; padding: 15px; border-radius: 6px; margin: 15px 0; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Reset Hasła</h1>
    </div>
    <div class="content">
      <p>Cześć ${data.userName || 'Użytkowniku'},</p>
      <p>Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta.</p>
      <p>Kliknij poniższy przycisk, aby ustawić nowe hasło:</p>
      <p style="text-align: center;">
        <a href="${data.resetUrl}" class="button">Zresetuj Hasło</a>
      </p>
      <p>Lub skopiuj i wklej ten link w przeglądarce:</p>
      <p style="word-break: break-all; color: #3B82F6;">${data.resetUrl}</p>
      <div class="warning">
        <strong>Ważne:</strong> Link wygasa za ${data.expiresIn || '1 godzinę'}. Po tym czasie będziesz musiał poprosić o nowy link.
      </div>
      <p>Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość - Twoje konto jest bezpieczne.</p>
    </div>
    <div class="footer">
      <p>Ten email został wysłany automatycznie. Nie odpowiadaj na niego.</p>
    </div>
  </div>
</body>
</html>`;

    return this.sendEmail({
      to: email,
      subject: 'Reset hasła - CRM GTD Smart',
      html,
    });
  }

  async sendInvitation(email: string, data: EmailTemplateData): Promise<boolean> {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #8B5CF6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .highlight { background: #EDE9FE; border-left: 4px solid #8B5CF6; padding: 15px; margin: 15px 0; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Zaproszenie do Organizacji</h1>
    </div>
    <div class="content">
      <p>Cześć ${data.userName || 'Użytkowniku'},</p>
      <div class="highlight">
        <p>Zostałeś zaproszony do dołączenia do organizacji <strong>${data.organizationName}</strong> w systemie CRM GTD Smart!</p>
      </div>
      <p>Kliknij poniższy przycisk, aby zaakceptować zaproszenie i utworzyć swoje konto:</p>
      <p style="text-align: center;">
        <a href="${data.invitationUrl}" class="button">Dołącz do Organizacji</a>
      </p>
      <p>Lub skopiuj i wklej ten link w przeglądarce:</p>
      <p style="word-break: break-all; color: #8B5CF6;">${data.invitationUrl}</p>
      <p>Zaproszenie wygasa za ${data.expiresIn || '7 dni'}.</p>
    </div>
    <div class="footer">
      <p>Jeśli nie spodziewałeś się tego zaproszenia, zignoruj tę wiadomość.</p>
    </div>
  </div>
</body>
</html>`;

    return this.sendEmail({
      to: email,
      subject: `Zaproszenie do ${data.organizationName} - CRM GTD Smart`,
      html,
    });
  }

  async sendRuleNotification(
    email: string,
    data: {
      userName?: string;
      ruleType: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
      title: string;
      message: string;
      entityType?: string;
      entityId?: string;
      actionUrl?: string;
    }
  ): Promise<boolean> {
    const typeColors = {
      INFO: { bg: '#3B82F6', text: 'Informacja' },
      WARNING: { bg: '#F59E0B', text: 'Ostrzeżenie' },
      SUCCESS: { bg: '#10B981', text: 'Sukces' },
      ERROR: { bg: '#EF4444', text: 'Błąd' }
    };

    const typeConfig = typeColors[data.ruleType] || typeColors.INFO;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${typeConfig.bg}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: ${typeConfig.bg}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .message-box { background: white; border: 1px solid #e5e7eb; padding: 20px; border-radius: 6px; margin: 15px 0; }
    .meta { color: #666; font-size: 12px; margin-top: 10px; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${typeConfig.text}: ${data.title}</h1>
    </div>
    <div class="content">
      <p>Cześć ${data.userName || 'Użytkowniku'},</p>
      <div class="message-box">
        <p>${data.message}</p>
        ${data.entityType && data.entityId ? `<p class="meta">Dotyczy: ${data.entityType} (ID: ${data.entityId})</p>` : ''}
      </div>
      ${data.actionUrl ? `
      <p style="text-align: center;">
        <a href="${data.actionUrl}" class="button">Zobacz szczegóły</a>
      </p>
      ` : ''}
      <p>Pozdrawiamy,<br>System CRM GTD Smart</p>
    </div>
    <div class="footer">
      <p>Ta wiadomość została wygenerowana automatycznie przez regułę przetwarzania.</p>
    </div>
  </div>
</body>
</html>`;

    return this.sendEmail({
      to: email,
      subject: `[${typeConfig.text}] ${data.title} - CRM GTD Smart`,
      html,
    });
  }
}

// Singleton instance
export const emailService = new EmailService();
