export interface CsvUser {
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  order_count: number;
  is_blocked: boolean;
}

/** Escape one CSV cell; neutralise spreadsheet formulas (=, +, -, @) so opening the file in Excel is safe. */
export const csvCell = (value: unknown): string => {
  let s = value == null ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

const fmt = (d: string | null) => (d ? new Date(d).toLocaleString('en-IN') : '');

export const buildUsersCsv = (users: CsvUser[]): string => {
  const header = ['Name', 'Email', 'Phone', 'Address', 'City', 'State', 'Pincode', 'Joined', 'Last login', 'Orders', 'Blocked', 'User ID'];
  const rows = users.map((u) => [
    u.full_name, u.email, u.phone, u.address, u.city, u.state, u.pincode,
    fmt(u.created_at), fmt(u.last_sign_in_at), u.order_count, u.is_blocked ? 'Yes' : 'No', u.user_id,
  ]);
  // BOM so Excel reads Hindi/Unicode names correctly
  return '\uFEFF' + [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
};

export const downloadUsersCsv = (users: CsvUser[]) => {
  const blob = new Blob([buildUsersCsv(users)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `trendra-customers-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
