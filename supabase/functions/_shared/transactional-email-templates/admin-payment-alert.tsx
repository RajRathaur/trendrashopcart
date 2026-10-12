import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Link, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  customerName?: string
  phoneNumber?: string
  productName?: string
  paymentAmount?: string
  deliveryAddress?: string
  screenshotUrl?: string
}

const AdminPaymentAlert = ({
  customerName = 'Customer',
  phoneNumber = '',
  productName = '',
  paymentAmount = '',
  deliveryAddress = '',
  screenshotUrl = '',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`New payment of ${paymentAmount} from ${customerName}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={brand}>🔔 New Payment Confirmation</Heading>
          <Text style={headerSub}>Trendra - Admin Alert</Text>
        </Section>
        <Section style={content}>
          <Text style={msg}>A new payment confirmation has been submitted and requires your verification.</Text>
          <Section style={box}>
            <Text style={row}><span style={label}>Customer Name</span> <strong>{customerName}</strong></Text>
            <Text style={row}><span style={label}>Phone Number</span> <strong>{phoneNumber}</strong></Text>
            <Text style={row}><span style={label}>Product</span> <strong>{productName}</strong></Text>
            <Text style={row}><span style={label}>Amount</span> <strong style={{ color: '#2563eb' }}>{paymentAmount}</strong></Text>
            <Text style={row}><span style={label}>Address</span> <strong>{deliveryAddress}</strong></Text>
          </Section>
          {screenshotUrl ? (
            <Text style={msg}>Payment Screenshot: <Link href={screenshotUrl} style={link}>View Screenshot</Link></Text>
          ) : null}
          <Button href="https://trendra.store/admin/payments" style={button}>Review Payment</Button>
        </Section>
        <Text style={footer}>© {new Date().getFullYear()} Trendra. All rights reserved.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: AdminPaymentAlert,
  subject: (d: Record<string, any>) => `🔔 New Payment: ${d.paymentAmount || ''} - ${d.customerName || 'Customer'}`,
  displayName: 'Admin Payment Alert',
  to: 'aksahuakhil@gmail.com',
  previewData: {
    customerName: 'Rahul Kumar',
    phoneNumber: '9876543210',
    productName: 'Crocs for Men',
    paymentAmount: '₹299',
    deliveryAddress: 'Patna, Bihar',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { maxWidth: '600px', margin: '0 auto' }
const header = { backgroundColor: '#dc2626', padding: '28px 32px', textAlign: 'center' as const }
const brand = { color: '#ffffff', margin: '0', fontSize: '22px' }
const headerSub = { color: 'rgba(255,255,255,0.85)', margin: '6px 0 0', fontSize: '14px' }
const content = { padding: '32px' }
const msg = { color: '#71717a', fontSize: '14px', lineHeight: '1.6' }
const box = { backgroundColor: '#f8fafc', borderRadius: '8px', padding: '8px 20px', margin: '24px 0' }
const row = { fontSize: '14px', color: '#18181b', margin: '8px 0', display: 'flex', justifyContent: 'space-between' }
const label = { color: '#71717a', fontSize: '13px', marginRight: '16px' }
const link = { color: '#2563eb', textDecoration: 'underline' }
const button = { backgroundColor: '#2563eb', color: '#ffffff', padding: '12px 32px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', textDecoration: 'none' }
const footer = { color: '#a1a1aa', fontSize: '12px', textAlign: 'center' as const, padding: '16px' }
