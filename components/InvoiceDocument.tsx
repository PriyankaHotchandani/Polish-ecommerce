import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import { getInvoiceTranslations, type InvoiceTranslations } from '@/utils/invoiceTranslations'

// Define styles for the PDF
const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 10,
        fontFamily: 'Helvetica',
    },
    header: {
        marginBottom: 30,
    },
    companyName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#059669',
        marginBottom: 5,
    },
    companyDetails: {
        fontSize: 9,
        color: '#666',
        lineHeight: 1.4,
    },
    invoiceTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'right',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#059669',
    },
    row: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    label: {
        width: '30%',
        fontWeight: 'bold',
    },
    value: {
        width: '70%',
    },
    table: {
        marginTop: 20,
        marginBottom: 20,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#059669',
        color: 'white',
        padding: 8,
        fontWeight: 'bold',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        padding: 8,
    },
    tableCol1: { width: '10%' },
    tableCol2: { width: '35%' },
    tableCol3: { width: '15%', textAlign: 'right' },
    tableCol4: { width: '15%', textAlign: 'right' },
    tableCol5: { width: '25%', textAlign: 'right' },
    totalsSection: {
        marginTop: 20,
        alignItems: 'flex-end',
    },
    totalRow: {
        flexDirection: 'row',
        width: 250,
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    totalLabel: {
        fontWeight: 'bold',
    },
    grandTotal: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 2,
        borderTopColor: '#059669',
    },
    footer: {
        position: 'absolute',
        bottom: 40,
        left: 40,
        right: 40,
        textAlign: 'center',
        fontSize: 8,
        color: '#999',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingTop: 10,
    },
})

interface InvoiceItem {
    sku: string
    title: string
    quantity: number
    price: number
    total: number
}

interface InvoiceCharge {
    label: string
    amount: number
}

interface InvoiceData {
    invoiceNumber: string
    orderNumber: string
    issueDate: string
    dueDate: string
    seller: {
        name: string
        address: string
        city: string
        postalCode: string
        nip: string
        email: string
        phone: string
    }
    buyer: {
        name: string
        companyName?: string
        nipNumber?: string
        address: string
        city: string
        postalCode: string
        country: string
        email: string
        phone: string
    }
    items: InvoiceItem[]
    subtotal: number
    vatRate: number
    vatAmount: number
    additionalCharges?: InvoiceCharge[]
    total: number
    paymentMethod: string
    bankDetails?: {
        bankName: string
        accountHolder: string
        iban: string
        swift: string
        reference?: string
    }
}

interface InvoiceDocumentProps {
    data: InvoiceData
    locale?: string
}

export const InvoiceDocument = ({ data, locale = 'pl' }: InvoiceDocumentProps) => {
    const t = getInvoiceTranslations(locale)

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.companyName}>{data.seller.name}</Text>
                    <Text style={styles.companyDetails}>
                        {data.seller.address}, {data.seller.postalCode} {data.seller.city}
                        {'\n'}{t.nip}: {data.seller.nip}
                        {'\n'}Email: {data.seller.email} | Phone: {data.seller.phone}
                    </Text>
                </View>

                {/* Invoice Title */}
                <Text style={styles.invoiceTitle}>{t.title.toUpperCase()}</Text>

                {/* Invoice Details */}
                <View style={styles.section}>
                    <View style={styles.row}>
                        <Text style={styles.label}>{t.invoiceNumber}:</Text>
                        <Text style={styles.value}>{data.invoiceNumber}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>{t.orderNumber}:</Text>
                        <Text style={styles.value}>{data.orderNumber}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>{t.issueDate}:</Text>
                        <Text style={styles.value}>{data.issueDate}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>{t.dueDate}:</Text>
                        <Text style={styles.value}>{data.dueDate}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>{t.paymentMethod}:</Text>
                        <Text style={styles.value}>{data.paymentMethod}</Text>
                    </View>
                </View>

                {/* Buyer Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t.buyer}</Text>
                    <Text>{data.buyer.companyName || data.buyer.name}</Text>
                    <Text>{data.buyer.address}</Text>
                    <Text>
                        {data.buyer.postalCode} {data.buyer.city}, {data.buyer.country}
                    </Text>
                    {data.buyer.nipNumber && <Text>{t.nip}: {data.buyer.nipNumber}</Text>}
                    <Text>Email: {data.buyer.email}</Text>
                    <Text>Phone: {data.buyer.phone}</Text>
                </View>

                {/* Items Table */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={styles.tableCol1}>#</Text>
                        <Text style={styles.tableCol2}>{t.item} / {t.sku}</Text>
                        <Text style={styles.tableCol3}>{t.quantity}</Text>
                        <Text style={styles.tableCol4}>{t.price}</Text>
                        <Text style={styles.tableCol5}>{t.total}</Text>
                    </View>
                    {data.items.map((item, index) => (
                        <View key={index} style={styles.tableRow}>
                            <Text style={styles.tableCol1}>{index + 1}</Text>
                            <Text style={styles.tableCol2}>
                                {item.title}
                                {'\n'}{t.sku}: {item.sku}
                            </Text>
                            <Text style={styles.tableCol3}>{item.quantity}</Text>
                            <Text style={styles.tableCol4}>{item.price.toFixed(2)} PLN</Text>
                            <Text style={styles.tableCol5}>{item.total.toFixed(2)} PLN</Text>
                        </View>
                    ))}
                </View>

                {/* Totals */}
                <View style={styles.totalsSection}>
                    <View style={styles.totalRow}>
                        <Text>{t.subtotal}:</Text>
                        <Text>{data.subtotal.toFixed(2)} PLN</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text>{t.vat} ({(data.vatRate * 100).toFixed(0)}%):</Text>
                        <Text>{data.vatAmount.toFixed(2)} PLN</Text>
                    </View>
                    {data.additionalCharges?.map((charge, index) => (
                        <View style={styles.totalRow} key={`${charge.label}-${index}`}>
                            <Text>{charge.label}:</Text>
                            <Text>{charge.amount.toFixed(2)} PLN</Text>
                        </View>
                    ))}
                    <View style={[styles.totalRow, styles.grandTotal]}>
                        <Text style={styles.totalLabel}>{t.grandTotal}:</Text>
                        <Text style={styles.totalLabel}>{data.total.toFixed(2)} PLN</Text>
                    </View>
                </View>

                {/* Bank transfer / payment details */}
                {data.bankDetails && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t.bankDetailsTitle}</Text>
                        <View style={styles.row}>
                            <Text style={styles.label}>{t.bankAccountHolder}:</Text>
                            <Text style={styles.value}>{data.bankDetails.accountHolder}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>{t.bankName}:</Text>
                            <Text style={styles.value}>{data.bankDetails.bankName}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>IBAN:</Text>
                            <Text style={styles.value}>{data.bankDetails.iban}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>SWIFT/BIC:</Text>
                            <Text style={styles.value}>{data.bankDetails.swift}</Text>
                        </View>
                        {data.bankDetails.reference && (
                            <View style={styles.row}>
                                <Text style={styles.label}>{t.bankReference}:</Text>
                                <Text style={styles.value}>{data.bankDetails.reference}</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Footer */}
                <View style={styles.footer}>
                    <Text>
                        {t.footer}{' '}
                        {new Date().toLocaleDateString(locale === 'pl' ? 'pl-PL' : 'en-GB')} at {new Date().toLocaleTimeString(locale === 'pl' ? 'pl-PL' : 'en-GB')}
                    </Text>
                    <Text>{t.thankYou}</Text>
                </View>
            </Page>
        </Document>
    )
}

export type { InvoiceData, InvoiceItem, InvoiceCharge }
