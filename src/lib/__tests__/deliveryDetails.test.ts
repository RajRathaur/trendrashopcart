import { describe, expect, it } from 'vitest';
import { deliveryDetailsSchema } from '../deliveryDetails';

const valid = {
  phone: '9876543210',
  address: '12 MG Road, Near City Mall, Raipur',
  latitude: 21.25,
  longitude: 81.63,
};

describe('deliveryDetailsSchema', () => {
  it('accepts a 10-digit Indian mobile, full address and GPS', () => {
    expect(deliveryDetailsSchema.safeParse(valid).success).toBe(true);
  });

  it('requires GPS location', () => {
    const { latitude: _lat, ...noGps } = valid;
    const result = deliveryDetailsSchema.safeParse(noGps);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('Current GPS location is required');
  });

  it('rejects a mobile number not starting with 6-9', () => {
    expect(deliveryDetailsSchema.safeParse({ ...valid, phone: '5876543210' }).success).toBe(false);
  });

  it('rejects an address shorter than 10 characters', () => {
    expect(deliveryDetailsSchema.safeParse({ ...valid, address: 'Raipur' }).success).toBe(false);
  });
});
