/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
  token?: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
  token,
}: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your login OTP for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Your login OTP</Heading>
        <Text style={text}>
          Enter this code in {siteName} to log in. It will expire shortly.
        </Text>
        {token ? <Text style={otpCode}>{token}</Text> : null}
        <Text style={text}>You can also log in directly with this secure link.</Text>
        <Button style={button} href={confirmationUrl}>
          Log In
        </Button>
        <Text style={footer}>
          If you didn't request this link, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#000000',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: '#55575d',
  lineHeight: '1.5',
  margin: '0 0 25px',
}
const button = {
  backgroundColor: '#000000',
  color: '#ffffff',
  fontSize: '14px',
  borderRadius: '8px',
  padding: '12px 20px',
  textDecoration: 'none',
}
const otpCode = {
  fontSize: '28px',
  fontWeight: 'bold' as const,
  letterSpacing: '6px',
  color: '#000000',
  backgroundColor: '#f3f4f6',
  borderRadius: '8px',
  padding: '14px 18px',
  textAlign: 'center' as const,
  margin: '0 0 24px',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
