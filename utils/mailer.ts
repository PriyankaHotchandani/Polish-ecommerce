import { Resend } from 'resend'

// Outgoing mail is sent through Resend. The Proforma e-mail always goes out from
// the branded order address, replies route to the client's WP inbox, and a BCC
// copy is sent to that same inbox so the client keeps a blind copy of every
// Proforma PDF for their 5-year archive on the WP server.
const RESEND_API_KEY = process.env.RESEND_API_KEY
const MAIL_FROM = process.env.RESEND_FROM_EMAIL || 'zamowienia@kraftdele-home.pl'
const MAIL_REPLY_TO = process.env.RESEND_REPLY_TO || 'kraftdele-home@wp.pl'
const MAIL_BCC = process.env.RESEND_BCC || 'kraftdele-home@wp.pl'

let cachedResend: Resend | null = null

function getResend(): Resend {
    if (!RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY is not configured')
    }
    if (!cachedResend) {
        cachedResend = new Resend(RESEND_API_KEY)
    }
    return cachedResend
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
 * Sends an e-mail via Resend with the branded sender, a reply-to and a BCC to the
 * client's inbox, and any attachments (e.g. the Proforma PDF). Logs the Resend
 * API response/error explicitly so bounce and delivery issues are visible in the
 * Vercel logs. Throws on failure so the caller can decide how to handle it —
 * checkout completion must never be blocked by a mail error, so callers wrap this
 * in try/catch and only log the failure.
 */
export async function sendMail(options: SendMailOptions): Promise<void> {
    if (!options.to || !options.to.trim()) {
        throw new Error('sendMail called without a recipient address')
    }

    const resend = getResend()

    const { data, error } = await resend.emails.send({
        from: MAIL_FROM,
        to: options.to,
        replyTo: MAIL_REPLY_TO,
        bcc: MAIL_BCC,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: (options.attachments || []).map((attachment) => ({
            filename: attachment.filename,
            content: attachment.content,
            contentType: attachment.contentType,
        })),
    })

    if (error) {
        console.error(
            `[mailer] Resend API error sending to ${options.to} (from=${MAIL_FROM}, bcc=${MAIL_BCC}):`,
            error
        )
        throw new Error(`Resend send failed: ${error.message || JSON.stringify(error)}`)
    }

    console.log(
        `[mailer] Resend e-mail queued to ${options.to} (id=${data?.id}, from=${MAIL_FROM}, replyTo=${MAIL_REPLY_TO}, bcc=${MAIL_BCC})`
    )
}
