import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
  message?: string
}

const CustomerMessage = ({ name = 'Customer', message = '' }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{message.slice(0, 80) || 'Message from Trendra'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={content}>
          <Heading style={brand}>Trendra</Heading>
          <Text style={greeting}>Hi {name},</Text>
          <Text style={msg}>{message}</Text>
          <Text style={footer}>— Team Trendra</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: CustomerMessage,
  subject: (d: Record<string, any>) => d.customSubject?.trim() || 'Message from Trendra',
  displayName: 'Customer Message',
  previewData: { name: 'Rahul', message: 'Your order will be delivered tomorrow.' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { maxWidth: '600px', margin: '0 auto' }
const content = { padding: '32px' }
const brand = { color: '#2563eb', margin: '0 0 16px', fontSize: '22px' }
const greeting = { color: '#18181b', fontSize: '15px' }
const msg = { color: '#3f3f46', fontSize: '15px', lineHeight: '1.6', whiteSpace: 'pre-wrap' as const }
const footer = { color: '#a1a1aa', fontSize: '12px', marginTop: '32px' }
