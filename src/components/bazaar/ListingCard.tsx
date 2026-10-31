import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { BazaarListing, conditionLabel, formatBazaarPrice, timeAgo } from '@/lib/bazaar';

export const ListingCard = ({ listing }: { listing: BazaarListing }) => (
  <Link
    to={`/bazaar/item/${listing.id}`}
    className="group flex flex-col overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md"
  >
    <div className="relative aspect-square overflow-hidden bg-muted">
      <img
        src={listing.images[0]}
        alt={listing.title}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      {listing.status === 'sold' && (
        <span className="absolute inset-0 flex items-center justify-center bg-background/70 text-sm font-bold tracking-wide">
          SOLD
        </span>
      )}
    </div>
    <div className="flex flex-1 flex-col gap-1 p-2.5">
      <p className="text-base font-bold leading-none">{formatBazaarPrice(Number(listing.price))}</p>
      <p className="line-clamp-2 text-sm leading-snug text-foreground">{listing.title}</p>
      <p className="text-[11px] text-muted-foreground">{conditionLabel(listing.condition)}</p>
      <div className="mt-auto flex items-center justify-between gap-1 pt-1 text-[11px] text-muted-foreground">
        <span className="flex min-w-0 items-center gap-0.5">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{listing.city}</span>
        </span>
        <span className="shrink-0">{timeAgo(listing.approved_at ?? listing.created_at)}</span>
      </div>
    </div>
  </Link>
);
