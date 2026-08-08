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
    currency: string
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
    address: process.env.COMPANY_ADDRESS || 'Graniczna 9',
    city: process.env.COMPANY_CITY || 'Nowy Sękocin',
    postalCode: process.env.COMPANY_POSTAL_CODE || '05-090',
    country: process.env.COMPANY_COUNTRY || 'Polska',
    nip: process.env.COMPANY_NIP || '',
    email: process.env.COMPANY_EMAIL || 'kraftdele-home@wp.pl',
    phone: process.env.COMPANY_PHONE || '+48 000 000 000',
    bank: {
        bankName: process.env.BANK_NAME || 'Powszechna Kasa Oszczędności Bank Polski SA',
        accountHolder: process.env.BANK_ACCOUNT_HOLDER || 'BM SP. Z O.O.',
        iban: process.env.BANK_IBAN || 'PL 65 1020 1055 0000 9602 0320 9590',
        swift: process.env.BANK_SWIFT || 'BPKOPLPW',
        currency: process.env.BANK_CURRENCY || 'PLN',
    },
}
