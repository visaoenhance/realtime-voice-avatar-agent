import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { MenuCategory } from '@/data/foodSampleMenu';
import { SAMPLE_MENU_BY_RESTAURANT } from '@/data/foodSampleMenu';
import { fetchRestaurantBySlug } from '../_utils';

function formatDeliveryFee(fee?: number | null) {
  if (fee == null) {
    return '$0 delivery fee';
  }
  if (fee === 0) {
    return '$0 delivery fee';
  }
  return `$${fee.toFixed(2)} delivery fee`;
}

function formatEta(etaMinutes?: number | null) {
  if (!etaMinutes) {
    return 'ETA pending';
  }
  return `${etaMinutes} min delivery`;
}

function minutesUntilClose(iso?: string | null): number | null {
  if (!iso) {
    return null;
  }
  return Math.round((new Date(iso).getTime() - Date.now()) / 60000);
}

function ItemCard({
  restaurantSlug,
  categorySlug,
  itemSlug,
  name,
  description,
  price,
  tags,
  image,
}: {
  restaurantSlug: string;
  categorySlug: string;
  itemSlug: string;
  name: string;
  description?: string;
  price: number;
  tags?: string[];
  image?: string;
}) {
  return (
    <Link
      href={`/food/stores/${restaurantSlug}/items/${itemSlug}?category=${categorySlug}`}
      className="flex gap-4 rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-lg transition hover:-translate-y-1 hover:border-emerald-400/60"
    >
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-white">{name}</h3>
          {tags?.map(tag => (
            <span key={tag} className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
              {tag}
            </span>
          ))}
        </div>
        {description ? <p className="text-sm text-slate-300">{description}</p> : null}
        <div className="text-sm font-semibold text-slate-200">${price.toFixed(2)}</div>
      </div>
      <div
        className="h-24 w-28 shrink-0 overflow-hidden rounded-2xl bg-cover bg-center"
        style={{
          backgroundImage: `url(${image ?? 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80'})`,
        }}
      />
    </Link>
  );
}

export default async function StoreDetailPage({ params }: { params: { slug: string } }) {
  const restaurant = await fetchRestaurantBySlug(params.slug);

  if (!restaurant) {
    notFound();
  }

  const menu: MenuCategory[] = SAMPLE_MENU_BY_RESTAURANT[restaurant.id] ?? [];
  const minutesToClose = minutesUntilClose(restaurant.closes_at ?? undefined);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6">
          <Link href="/food" className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400 transition hover:text-white">
            ← Back to Food Court
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-white md:text-4xl">{restaurant.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-300">
                {restaurant.rating ? <span>{restaurant.rating.toFixed(1)} ★</span> : null}
                <span className="h-1 w-1 rounded-full bg-slate-500" />
                <span>{restaurant.cuisine}</span>
                <span className="h-1 w-1 rounded-full bg-slate-500" />
                <span>{formatEta(restaurant.eta_minutes)}</span>
                {minutesToClose != null ? (
                  <>
                    <span className="h-1 w-1 rounded-full bg-slate-500" />
                    <span>{minutesToClose <= 15 ? `${minutesToClose} min — closing soon` : `${minutesToClose} min until closing`}</span>
                  </>
                ) : null}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-500">
                <span>{formatDeliveryFee(restaurant.delivery_fee)}</span>
                {restaurant.promo ? (
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-200">{restaurant.promo}</span>
                ) : null}
              </div>
            </div>
            <div className="flex flex-col items-start gap-2 text-sm text-slate-300">
              {restaurant.address ? <span>{restaurant.address}</span> : null}
              {restaurant.phone ? <span>{restaurant.phone}</span> : null}
              <Link
                href={`/food/stores/${restaurant.id}/items`}
                className="rounded-full border border-emerald-400/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200 transition hover:border-emerald-300 hover:text-emerald-100"
              >
                View menu
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10">
        <section
          className="overflow-hidden rounded-3xl border border-white/10 bg-cover bg-center shadow-2xl"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(15,17,21,0.85) 0%, rgba(15,17,21,0.4) 55%), url(${restaurant.hero_image ?? 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=80'})`,
            minHeight: '260px',
          }}
        >
          <div className="flex h-full flex-col justify-end gap-4 p-10">
            <div className="flex flex-wrap items-center gap-3 text-sm text-emerald-100">
              {restaurant.highlights?.map(highlight => (
                <span key={highlight} className="rounded-full bg-emerald-500/10 px-3 py-1">
                  {highlight}
                </span>
              ))}
            </div>
            {restaurant.standout_dish ? (
              <div>
                <div className="text-xs uppercase tracking-[0.3em] text-emerald-200">Signature dish</div>
                <p className="text-lg font-semibold text-white">{restaurant.standout_dish}</p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="grid gap-8 md:grid-cols-[230px_1fr]">
          <aside className="space-y-2">
            <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Menu</div>
            <nav className="grid gap-2 text-sm text-slate-200">
              {menu.map(category => (
                <a
                  key={category.slug}
                  href={`#category-${category.slug}`}
                  className="rounded-2xl border border-white/5 px-4 py-2 transition hover:border-emerald-400/60 hover:text-emerald-200"
                >
                  {category.title}
                </a>
              ))}
            </nav>
          </aside>

          <div className="space-y-12">
            {menu.map(category => (
              <section key={category.slug} id={`category-${category.slug}`} className="space-y-4">
                <div>
                  <h2 className="text-2xl font-semibold text-white">{category.title}</h2>
                  {category.description ? (
                    <p className="text-sm text-slate-400">{category.description}</p>
                  ) : null}
                </div>
                <div className="grid gap-4">
                  {category.items.map(item => (
                    <ItemCard
                      key={item.slug}
                      restaurantSlug={restaurant.id}
                      categorySlug={category.slug}
                      itemSlug={item.slug}
                      name={item.name}
                      description={item.description}
                      price={item.price}
                      tags={item.tags}
                      image={item.image}
                    />
                  ))}
                </div>
              </section>
            ))}
            {menu.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-10 text-center text-slate-400">
                Menu data is coming soon. Launch the concierge for curated suggestions in the meantime.
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}


