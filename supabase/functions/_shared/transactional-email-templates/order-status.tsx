import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
  orderNumber?: string
  status?: string
  statusMessage?: string
  totalAmount?: string
  shippingCity?: string
  shippingState?: string
}

const statusEmoji: Record<string, string> = {
  pending: '⏳',
  confirmed: '✅',
  shipped: '🚚',
  delivered: '📦',
  cancelled: '❌',
  returned: '🔄',
}

const OrderStatusEmail = ({
  name = 'Customer',
  orderNumber = '',
  status = 'pending',
  statusMessage = 'Your order status has been updated.',
  totalAmount = '',
  shippingCity = '',
  shippingState = '',
}: Props) => {
  const emoji = statusEmoji[status] || '📋'
  const capitalized = status.charAt(0).toUpperCase() + status.slice(1)
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{`Order #${orderNumber} - ${capitalized}`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={brand}>Trendra</Heading>
            <Text style={headerSub}>Order Status Update</Text>
          </Section>
          <Section style={content}>
            <Text style={emojiStyle}>{emoji}</Text>
            <Heading as="h2" style={h2}>Order {capitalized}</Heading>
            <Text style={msg}>Hi {name}, {statusMessage}</Text>
            <Section style={box}>
              <Text style={row}><span style={label}>Order Number</span> <strong>#{orderNumber}</strong></Text>
              <Text style={row}><span style={label}>Status</span> <strong style={{ color: '#2563eb' }}>{capitalized}</strong></Text>
              {totalAmount ? <Text style={row}><span style={label}>Total Amount</span> <strong>{totalAmount}</strong></Text> : null}
              {shippingCity ? <Text style={row}><span style={label}>Shipping To</span> <strong>{shippingCity}{shippingState ? `, ${shippingState}` : ''}</strong></Text> : null}
            </Section>
            <Button href="https://trendra.store/orders" style={button}>View My Orders</Button>
          </Section>
          <Text style={footer}>© {new Date().getFullYear()} Trendra. All rights reserved.</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: OrderStatusEmail,
  subject: (d: Record<string, any>) =>
    d.subjectOverride?.trim() ||
    `${statusEmoji[d.status] || '📋'} Order #${d.orderNumber} - ${(d.status || 'pending').charAt(0).toUpperCase() + (d.status || 'pending').slice(1)}`,
  displayName: 'Order Status Update',
  previewData: {
    name: 'Rahul',
    orderNumber: 'TRN12345',
    status: 'shipped',
    statusMessage: 'Your order has been shipped and is on its way to you!',
    totalAmount: '₹499',
    shippingCity: 'Patna',
    shippingState: 'Bihar',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { maxWidth: '600px', margin: '0 auto' }
const header = { backgroundColor: '#2563eb', padding: '28px 32px', textAlign: 'center' as const }
const brand = { color: '#ffffff', margin: '0', fontSize: '24px' }
const headerSub = { color: 'rgba(255,255,255,0.85)', margin: '6px 0 0', fontSize: '14px' }
const content = { padding: '32px', textAlign: 'center' as const }
const emojiStyle = { fontSize: '44px', margin: '0' }
const h2 = { color: '#18181b', margin: '12px 0 8px', fontSize: '22px' }
const msg = { color: '#71717a', fontSize: '15px', lineHeight: '1.6' }
const box = { backgroundColor: '#f8fafc', borderRadius: '8px', padding: '8px 20px', margin: '24px 0', textAlign: 'left' as const }
const row = { fontSize: '14px', color: '#18181b', margin: '8px 0', display: 'flex', justifyContent: 'space-between' }
const label = { color: '#71717a', fontSize: '13px', marginRight: '16px' }
const button = { backgroundColor: '#2563eb', color: '#ffffff', padding: '12px 32px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', textDecoration: 'none' }
const footer = { color: '#a1a1aa', fontSize: '12px', textAlign: 'center' as const, padding: '16px' }
