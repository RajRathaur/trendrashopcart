import { useState, useEffect, useRef, ElementType, ReactNode } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { useSiteContent } from '@/hooks/useSiteContent';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface EditableTextProps {
  contentKey: string;
  defaultValue: string;
  as?: ElementType;
  multiline?: boolean;
  className?: string;
  children?: ReactNode;
}

/**
 * Renders text that admins can click-to-edit inline.
 * Non-admins see plain text. Values persist to `site_content`.
 */
export const EditableText = ({
  contentKey,
  defaultValue,
  as: Tag = 'span',
  multiline = false,
  className,
}: EditableTextProps) => {
  const { user } = useAuth();
  const { get, set } = useSiteContent();
  const [isAdmin, setIsAdmin] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  const value = get(contentKey, defaultValue);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    supabase
      .rpc('has_role', { _user_id: user.id, _role: 'admin' })
      .then(({ data }) => setIsAdmin(Boolean(data)));
  }, [user]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select?.();
    }
  }, [editing]);

  const start = () => {
    setDraft(value);
    setEditing(true);
  };

  const save = async () => {
    await set(contentKey, draft);
    setEditing(false);
  };

  if (!isAdmin) {
    return <Tag className={className}>{value}</Tag>;
  }

  if (editing) {
    return (
      <span className="inline-flex items-start gap-1 bg-yellow-100 text-black p-1 rounded-sm">
        {multiline ? (
          <textarea
            ref={inputRef as any}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="bg-white text-black p-1 min-w-[220px] min-h-[60px] text-sm border border-black"
          />
        ) : (
          <input
            ref={inputRef as any}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
            className="bg-white text-black p-1 min-w-[180px] text-sm border border-black"
          />
        )}
        <button onClick={save} className="bg-green-600 text-white p-1" aria-label="Save"><Check className="h-3 w-3" /></button>
        <button onClick={() => setEditing(false)} className="bg-red-600 text-white p-1" aria-label="Cancel"><X className="h-3 w-3" /></button>
      </span>
    );
  }

  return (
    <Tag
      className={cn(className, 'relative outline-dashed outline-1 outline-yellow-400/60 outline-offset-2 cursor-pointer hover:outline-yellow-400')}
      onClick={(e: any) => { e.stopPropagation(); e.preventDefault(); start(); }}
      title="Click to edit (admin)"
    >
      {value}
      <Pencil className="inline-block ml-1 h-3 w-3 opacity-60" />
    </Tag>
  );
};
