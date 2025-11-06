import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SAMPLE_MENU_BY_RESTAURANT } from '@/data/foodSampleMenu';
import type { MenuCategory, MenuItem, MenuOptionGroup } from '@/data/foodSampleMenu';
import { fetchRestaurantBySlug } from '../../../_utils';

type ItemDetailPageProps = {
  params: { slug: string; itemSlug: string };
  searchParams?: { category?: string };
};

function OptionGroup({ group }: { group: MenuOptionGroup }) {
  const selectionLabel = group.required
    ? `Choose ${group.max === 1 ? '1' : `up to ${group.max ?? group.options.length}`} ${group.required ? '' : '(optional)'}`
    : group.max
    ? `Choose up to ${group.max}`
    : 'Optional';

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-900/60 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-white/90">{group.title}</h3>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{selectionLabel}</p>
        </div>
        {group.helpText ? <span className="text-xs text-slate-400">{group.helpText}</span> : null}
      </div>
      <div className="grid gap-2">
        {group.options.map(option => (
          <label
            key={option.id}
            className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-200 transition hover:border-emerald-400/60 hover:text-emerald-100"
          >
            <div>
              <div className="font-semibold">{option.label}</div>
              {option.description ? <div className="text-xs text-slate-400">{option.description}</div> : null}
            </div>
            <div className="flex items-center gap-3">
              {option.priceAdjustment ? (
                <span className="text-xs font-semibold text-slate-300">+${option.priceAdjustment.toFixed(2)}</span>
              ) : null}
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-400 text-[10px]">
                {group.required ? '●' : ''}
              </span>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

function findMenuItem(
  menu: MenuCategory[],
  itemSlug: string,
  categoryHint?: string,
): { category: MenuCategory; item: MenuItem } | null {
  if (categoryHint) {
    const category = menu.find(cat => cat.slug === categoryHint);
    const item = category?.items.find(it => it.slug === itemSlug);
    if (category && item) {
      return { category, item };
    }
  }

  for (const category of menu) {
    const item = category.items.find(it => it.slug === itemSlug);
    if (item) {
      return { category, item };
    }
  }
  return null;
}

export default async function ItemDetailPage({ params, searchParams }: ItemDetailPageProps) {
  const restaurant = await fetchRestaurantBySlug(params.slug);
  if (!restaurant) {
    notFound();
  }

  const menu: MenuCategory[] = SAMPLE_MENU_BY_RESTAURANT[restaurant.id] ?? [];
  const match = findMenuItem(menu, params.itemSlug, searchParams?.category);
  if (!match) {
    notFound();
  }

  const { category, item } = match;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 px-6 py-6">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
            <Link
              href={`/food/stores/${restaurant.id}/items?category=${category.slug}`}
              className="transition hover:text-white"
            >
              ← Back to menu
            </Link>
            <span>{restaurant.name}</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-white md:text-4xl">{item.name}</h1>
              {item.description ? <p className="mt-2 text-sm text-slate-300">{item.description}</p> : null}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-slate-400">
                <span>${item.price.toFixed(2)}</span>
                {item.calories ? <span>{item.calories} cal</span> : null}
                {item.tags?.map(tag => (
                  <span key={tag} className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-200">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right text-sm text-slate-300">
              <p>{category.title}</p>
              <p>See more in this category →</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-10">
        <section
          className="overflow-hidden rounded-3xl border border-white/10 bg-cover bg-center shadow-2xl"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(15,17,21,0.65), rgba(15,17,21,0.25)), url(${item.image ?? 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1600&q=80'})`,
            minHeight: '320px',
          }}
        />

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Customize your order</h2>
              <p className="text-sm text-slate-400">Select temperature, sides, and add-ons just like the in-store flow.</p>
            </div>
            <div className="rounded-full bg-slate-900/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
              Est. prep 15 min
            </div>
          </div>

          <div className="grid gap-4">
            {(item.optionGroups ?? []).map(group => (
              <OptionGroup key={group.id} group={group} />
            ))}
            {(item.optionGroups ?? []).length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 text-sm text-slate-400">
                No customizations required for this item. Checkout-ready as-is.
              </div>
            ) : null}
          </div>
        </section>

        <section className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Order summary</div>
            <div className="text-2xl font-semibold text-white">${item.price.toFixed(2)}</div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button className="rounded-full border border-white/15 px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200 transition hover:border-white/40">
              Save for later
            </button>
            <button className="rounded-full bg-emerald-400 px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-950 transition hover:bg-emerald-300">
              Add to bag
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}


