import { NavLink } from 'react-router-dom';
import { Clapperboard, Search, Video, Wallet, UserCircle, Upload, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const VideoNav = () => <nav aria-label="Video navigation" className="mb-6 flex flex-wrap gap-1 border-b pb-3">
  {[['/videos', 'Videos', Video], ['/reels', 'Reels', Clapperboard], ['/reels/search', 'Users', Search], ['/videos/upload', 'Upload', Upload], ['/creator/earnings', 'Earnings', Wallet], ['/creator/marketing', 'Marketing', Megaphone], ['/u/me', 'My UID', UserCircle]].map(([path, label, Icon]) => {
    const Symbol = Icon as typeof Video;
    return <Button key={String(path)} variant="ghost" size="sm" asChild><NavLink to={String(path)} className={({ isActive }) => isActive ? 'bg-muted text-primary' : ''}><Symbol className="mr-1.5 h-4 w-4" />{String(label)}</NavLink></Button>;
  })}
</nav>;