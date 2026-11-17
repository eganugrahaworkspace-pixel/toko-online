const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export const formatPrice = (value: number) => usd.format(value);

export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(iso));

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function categoryLabel(slug: string) {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
