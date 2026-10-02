import { useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Label } from '@/components/ui/label';
import { Loader2, X, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';

interface ProductImagesUploadProps {
  images: string[];
  onImagesChange: (urls: string[]) => void;
}

const SLOT_LABELS = ['Front Photo', 'Back Photo'];
const MAX_IMAGES = 6;

export const ProductImagesUpload = ({ images, onImagesChange }: ProductImagesUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }
    if (images.length >= MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} photos allowed`);
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      onImagesChange([...images, publicUrl]);
      toast.success('Photo uploaded');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  const slotLabel = (i: number) => SLOT_LABELS[i] || `Photo ${i + 1}`;

  return (
    <div className="space-y-2">
      <Label>Product Photos (Front & Back)</Label>
      <p className="text-xs text-muted-foreground">
        Pehli photo Front, doosri Back maani jayegi. Customer product page par sab photos dekh sakta hai.
      </p>
      <div className="flex flex-wrap gap-3">
        {images.map((url, i) => (
          <div key={url + i} className="flex flex-col items-center gap-1">
            <div className="relative w-24 aspect-square rounded-lg overflow-hidden border border-border bg-muted">
              <img src={url} alt={slotLabel(i)} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 p-0.5 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <span className="text-[10px] font-medium text-muted-foreground">{slotLabel(i)}</span>
          </div>
        ))}

        {images.length < MAX_IMAGES && (
          <div className="flex flex-col items-center gap-1">
            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              className="w-24 aspect-square rounded-lg border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted transition-colors"
            >
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <ImagePlus className="h-6 w-6 text-muted-foreground mb-1" />
                  <span className="text-[10px] text-muted-foreground">Add photo</span>
                </>
              )}
            </div>
            <span className="text-[10px] font-medium text-muted-foreground">
              {slotLabel(images.length)}
            </span>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />
    </div>
  );
};
