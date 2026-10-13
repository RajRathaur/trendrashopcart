import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

const sideSchema = z.object({
  path: z.string().max(300), name: z.string().max(120),
  size: z.number().min(30).max(100), x: z.number().min(0).max(70), y: z.number().min(0).max(70),
}).refine((s) => s.x + s.size <= 100 && s.y + s.size <= 100);
const schema = z.object({ version: z.literal(1), front: sideSchema.optional(), back: sideSchema.optional() })
  .refine((d) => Boolean(d.front || d.back));
export type PrintDesign = z.infer<typeof schema>;
export type PrintSide = NonNullable<PrintDesign['front']>;
export const parsePrintDesign = (value: unknown): PrintDesign | null => {
  const result = schema.safeParse(value);
  return result.success ? result.data : null;
};
export const printDesignJson = (value: unknown) => {
  const design = parsePrintDesign(value);
  return design ? JSON.parse(JSON.stringify(design)) : null;
};
export const savePrintDraft = (productId: string, design: PrintDesign) => {
  const key = crypto.randomUUID();
  sessionStorage.setItem(`trendra:print:${key}`, JSON.stringify({ productId, design }));
  return key;
};
export const readPrintDraft = (key: string | null, productId: string): PrintDesign | null => {
  if (!key) return null;
  try {
    const stored = JSON.parse(sessionStorage.getItem(`trendra:print:${key}`) || 'null');
    return stored?.productId === productId ? parsePrintDesign(stored.design) : null;
  } catch { return null; }
};
export const getPrintUrl = async (path: string) => {
  const { data, error } = await supabase.storage.from('print-designs').createSignedUrl(path, 600);
  if (error) throw error;
  return data.signedUrl;
};