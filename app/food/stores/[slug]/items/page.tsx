import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SAMPLE_MENU_BY_RESTAURANT } from '@/data/foodSampleMenu';
import type { MenuCategory, MenuItem } from '@/data/foodSampleMenu';
import { fetchRestaurantBySlug } from '../../_utils';

type StoreItemsPageProps = {
  params: { slug: string };
  searchParams?: { category?: string };
};

function ItemTile({
  restaurantSlug,
  categorySlug,
  item,
}: {
  restaurantSlug: string;
  categorySlug: string;
  item: MenuItem;
}) {
  return (
    <Link
      href={`/food/stores/${restaurantSlug}/items/${item.slug}?category=${categorySlug}`}
      className="group flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 shadow-lg transition hover:-translate-y-1 hover:border-emerald-400/60"
    >
      <div
        className="h-40 w-full bg-cover bg-center"
        style={{
          backgroundImage: `url(${item.image ?? 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=80'})`,
        }}
      />
      <div className="flex flex-1 flex-col gap-2 px-5 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white group-hover:text-emerald-200">{item.name}</h3>
          <span className="text-sm font-semibold text-slate-200">${item.price.toFixed(2)}</span>
        </div>
        {item.description ? <p className="text-sm text-slate-300">{item.description}</p> : null}
        <div className="mt-auto flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">
          {item.tags?.map(tag => (
            <span key={tag} className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-200">
              {tag}
            </span>
          ))}
          {item.calories ? <span>{item.calories} cal</span> : null}
        </div>
      </div>
    </Link>
  );
}

export default async function StoreItemsPage({ params, searchParams }: StoreItemsPageProps) {
  const restaurant = await fetchRestaurantBySlug(params.slug);
  if (!restaurant) {
    notFound();
  }

  const menu: MenuCategory[] = SAMPLE_MENU_BY_RESTAURANT[restaurant.id] ?? [];
  if (menu.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-24 text-center">
          <h1 className="text-3xl font-semibold text-white">Menu coming soon</h1>
          <p className="text-sm text-slate-400">
            We&apos;re still digitizing {restaurant.name}&apos;s menu. Launch the concierge to get recommendations while we
            finish syncing their items.
          </p>
          <Link
            href="/food/concierge"
            className="mx-auto inline-flex items-center gap-2 rounded-full bg-emerald-400 px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-950 transition hover:bg-emerald-300"
          >
            Ask concierge
          </Link>
        </div>
      </div>
    );
  }

  const activeCategorySlug = searchParams?.category ?? menu[0]?.slug ?? '';
  const activeCategory = menu.find(category => category.slug === activeCategorySlug) ?? menu[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href={`/food/stores/${restaurant.id}`} className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400 transition hover:text-white">
              ← Back to store
            </Link>
            <h1 className="mt-2 text-3xl font-semibold text-white md:text-4xl">{restaurant.name} menu</h1>
            <p className="text-sm text-slate-400">{restaurant.cuisine} · {menu.length} categories</p>
          </div>
          <Link
            href="/food/concierge"
            className="rounded-full border border-emerald-400/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200 transition hover:border-emerald-300 hover:text-emerald-100"
          >
            Ask concierge
          </Link>
        </div>
        <div className="border-t border-white/5">
          <div className="mx-auto flex max-w-6xl snap-x gap-3 overflow-x-auto px-6 py-4 text-sm font-semibold text-slate-200">
            {menu.map(category => (
              <Link
                key={category.slug}
                href={`/food/stores/${restaurant.id}/items?category=${category.slug}`}
                className={`whitespace-nowrap rounded-full border px-4 py-2 transition ${
                  category.slug === activeCategory.slug
                    ? 'border-emerald-400/70 bg-emerald-400/10 text-emerald-200'
                    : 'border-white/10 hover:border-emerald-300/60 hover:text-emerald-200'
                }`}
              >
                {category.title}
              </Link>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <section className="space-y-2">
          <h2 className="text-2xl font-semibold text-white">{activeCategory.title}</h2>
          {activeCategory.description ? (
            <p className="text-sm text-slate-400">{activeCategory.description}</p>
          ) : null}
        </section>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {activeCategory.items.map(item => (
            <ItemTile
              key={item.slug}
              restaurantSlug={restaurant.id}
              categorySlug={activeCategory.slug}
              item={item}
            />
          ))}
        </section>
      </main>
    </div>
  );
}


