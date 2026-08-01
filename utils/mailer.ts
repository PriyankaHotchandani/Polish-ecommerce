import nodemailer, { type Transporter } from 'nodemailer'

// SMTP configuration for the automated Bank Transfer / Proforma e-mails.
// Defaults target Wirtualna Polska (wp.pl) over implicit TLS (SSL) on port 465,
// and every value can be overridden with environment variables so the password
// does not have to live in source control in production.
const SMTP_HOST = process.env.SMTP_HOST
const SMTP_PORT = Number(process.env.SMTP_PORT || '465')
// Port 465 uses implicit TLS (SSL). `secure` is true unless explicitly disabled.
const SMTP_SECURE = process.env.SMTP_SECURE
    ? process.env.SMTP_SECURE === 'true'
    : SMTP_PORT === 465
console.log('INFO: SMTP_HOST', SMTP_HOST)
console.log('INFO: SMTP_PORT', SMTP_PORT)
console.log('INFO: SMTP_SECURE', SMTP_SECURE)
const SMTP_USER = process.env.SMTP_USER
const SMTP_PASS = process.env.SMTP_PASS
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
        // Fail fast instead of hanging the request if wp.pl is unreachable.
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 20000,
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
 * Sends an e-mail over the configured SMTP transport. Verifies the SMTP
 * connection first (so auth/connectivity problems surface with a clear log),
 * then sends. Throws on failure so the caller can decide how to handle it —
 * checkout completion must never be blocked by a mail error, so callers wrap
 * this in try/catch and only log the failure.
 */
export async function sendMail(options: SendMailOptions): Promise<void> {
    if (!options.to || !options.to.trim()) {
        throw new Error('sendMail called without a recipient address')
    }

    const transport = getTransport()

    // Verify the SMTP connection/credentials up front so wp.pl auth, TLS or
    // timeout errors are logged explicitly rather than surfacing as an opaque
    // send failure.
    try {
        await transport.verify()
        console.log(`[mailer] SMTP connection verified (${SMTP_HOST}:${SMTP_PORT}, secure=${SMTP_SECURE}, user=${SMTP_USER})`)
    } catch (verifyError) {
        console.error(
            `[mailer] SMTP verification FAILED for ${SMTP_HOST}:${SMTP_PORT} (secure=${SMTP_SECURE}, user=${SMTP_USER}):`,
            verifyError
        )
        throw verifyError
    }

    try {
        const info = await transport.sendMail({
            from: MAIL_FROM,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text,
            attachments: options.attachments,
        })
        console.log(
            `[mailer] E-mail sent to ${options.to} (from=${MAIL_FROM}, messageId=${info.messageId}, response=${info.response})`
        )
    } catch (sendError) {
        console.error(`[mailer] Failed to send e-mail to ${options.to} (from=${MAIL_FROM}):`, sendError)
        throw sendError
    }
}
