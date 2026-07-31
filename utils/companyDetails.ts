// Central company / seller details used on invoices, the order-confirmation
// screen, and outgoing e-mails. Values are overridable via environment
// variables so the real bank account can be configured without code changes;
// the defaults are clearly-labelled placeholders that MUST be replaced with the
// company's real registration and bank data before going live.

export interface BankDetails {
    bankName: string
    accountHolder: string
    iban: string
    swift: string
}

export interface CompanyDetails {
    name: string
    address: string
    city: string
    postalCode: string
    country: string
    nip: string
    email: string
    phone: string
    bank: BankDetails
}

export const COMPANY_DETAILS: CompanyDetails = {
    name: process.env.COMPANY_NAME || 'BM SP. Z O.O.',
    address: process.env.COMPANY_ADDRESS || 'ul. Przykładowa 1',
    city: process.env.COMPANY_CITY || 'Warszawa',
    postalCode: process.env.COMPANY_POSTAL_CODE || '00-001',
    country: process.env.COMPANY_COUNTRY || 'Poland',
    nip: process.env.COMPANY_NIP || '0000000000',
    email: process.env.COMPANY_EMAIL || process.env.SMTP_USER || 'kraftdele-home@wp.pl',
    phone: process.env.COMPANY_PHONE || '+48 000 000 000',
    bank: {
        bankName: process.env.BANK_NAME || 'Bank (uzupełnij dane / configure)',
        accountHolder: process.env.BANK_ACCOUNT_HOLDER || process.env.COMPANY_NAME || 'BM SP. Z O.O.',
        iban: process.env.BANK_IBAN || 'PL00 0000 0000 0000 0000 0000 0000',
        swift: process.env.BANK_SWIFT || 'XXXXPLPX',
    },
}
