import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Smartphone, Banknote, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface BuyNowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  amount: number;
}

export const BuyNowDialog = ({ open, onOpenChange, productId, productName, amount }: BuyNowDialogProps) => {
  const navigate = useNavigate();

  const handleOnline = () => {
    onOpenChange(false);
    const upiLink = `upi://pay?pa=9125442370@ybl&pn=Trendra%20Shopcart&am=${amount}&cu=INR`;
    toast.info('Redirecting to UPI payment...');
    window.location.href = upiLink;
    setTimeout(() => {
      navigate(
        `/confirm-payment?product=${encodeURIComponent(productName)}&amount=${amount}&productId=${productId}`
      );
    }, 2500);
  };

  const handleCOD = () => {
    onOpenChange(false);
    navigate(
      `/cod-checkout?product=${encodeURIComponent(productName)}&amount=${amount}&productId=${productId}`
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose Payment Method</DialogTitle>
          <DialogDescription>
            {productName} — <span className="font-semibold text-primary">₹{amount.toLocaleString('en-IN')}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <button
            onClick={handleOnline}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left group"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-foreground">Online Payment</div>
              <div className="text-xs text-muted-foreground">PhonePe / UPI / Any UPI app</div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>

          <button
            onClick={handleCOD}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left group"
          >
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
              <Banknote className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-foreground">Cash on Delivery</div>
              <div className="text-xs text-muted-foreground">Pay when your order arrives</div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
