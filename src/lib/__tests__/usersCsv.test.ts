import { describe, it, expect } from 'vitest';
import { buildUsersCsv, csvCell } from '../usersCsv';

describe('users CSV export', () => {
  it('neutralises spreadsheet formulas in customer-entered text', () => {
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
  });

  it('includes name, email and phone for every customer', () => {
    const csv = buildUsersCsv([{
      user_id: 'u1', full_name: 'Raj', email: 'raj@example.com', phone: '9876543210',
      address: null, city: 'Jaipur', state: null, pincode: null,
      created_at: '2026-11-01T00:00:00Z', last_sign_in_at: null, order_count: 2, is_blocked: false,
    }]);
    const lines = csv.split('\r\n');
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('"Raj","raj@example.com","9876543210"');
  });
});
