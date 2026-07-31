import nodemailer, { type Transporter } from 'nodemailer'

// SMTP configuration for the automated Bank Transfer / Proforma e-mails.
// Defaults target Wirtualna Polska (wp.pl) over implicit TLS (SSL) on port 465,
// and every value can be overridden with environment variables so the password
// does not have to live in source control in production.
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.wp.pl'
const SMTP_PORT = Number(process.env.SMTP_PORT || '465')
// Port 465 uses implicit TLS (SSL). `secure` is true unless explicitly disabled.
const SMTP_SECURE = process.env.SMTP_SECURE
    ? process.env.SMTP_SECURE === 'true'
    : SMTP_PORT === 465
const SMTP_USER = process.env.SMTP_USER || 'kraftdele-home@wp.pl'
const SMTP_PASS = process.env.SMTP_PASS || 'Kraftdelewds2026'
export const MAIL_FROM = process.env.SMTP_FROM || SMTP_USER

let cachedTransport: Transporter | null = null

export function getTransport(): Transporter {
    if (cachedTransport) {
        return cachedTransport
    }

    cachedTransport = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_SECURE,
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },
    })

    return cachedTransport
}

export interface MailAttachment {
    filename: string
    content: Buffer
    contentType?: string
}

export interface SendMailOptions {
    to: string
    subject: string
    html: string
    text?: string
    attachments?: MailAttachment[]
}

/**
 * Sends an e-mail over the configured SMTP transport. Throws on failure so the
 * caller can decide how to handle it — checkout completion must never be blocked
 * by a mail error, so callers wrap this in try/catch and only log the failure.
 */
export async function sendMail(options: SendMailOptions): Promise<void> {
    const transport = getTransport()

    await transport.sendMail({
        from: MAIL_FROM,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments,
    })
}
