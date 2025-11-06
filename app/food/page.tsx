import Link from 'next/link';
import { FALLBACK_RESTAURANTS, SampleRestaurant } from '@/data/foodCourtSamples';
import { supabase } from '@/lib/supabaseServer';

type RestaurantCard = {
  id: string;
  name: string;
  tagline: string;
  cuisine: string;
  heroImage: string;
  rating?: number | null;
  etaMinutes?: number | null;
  closesSoonMessage?: string | null;
  promo?: string | null;
};

const CATEGORY_CHIPS = [
  { label: 'Grocery', emoji: '🛒' },
  { label: 'Chinese', emoji: '🥡' },
  { label: 'Indian', emoji: '🍛' },
  { label: 'Italian', emoji: '🍝' },
  { label: 'Pizza', emoji: '🍕' },
  { label: 'Halal', emoji: '🕌' },
  { label: 'Soup', emoji: '🥣' },
  { label: 'BBQ', emoji: '🍖' },
  { label: 'Seafood', emoji: '🦐' },
  { label: 'Greek', emoji: '🥙' },
  { label: 'Mexican', emoji: '🌮' },
  { label: 'Caribbean', emoji: '🏝️' },
  { label: 'Under 30 min', emoji: '⏱️' },
];

const PROMO_CARDS = [
  {
    title: 'Invite & earn $15',
    description: 'Gift your friends $15 off their first order and enjoy $15 in credits when they order.',
    cta: 'Invite & earn',
    accent: 'from-emerald-500 to-emerald-300',
  },
  {
    title: 'Switch to save',
    description: 'Bundle deliveries with our Club plan and get 2 months on us.',
    cta: 'Switch to save',
    accent: 'from-amber-400 via-amber-500 to-orange-400',
  },
  {
    title: 'Upgrade to CLEAR+',
    description: 'Get three months of airport fast lane access with your Food Court membership.',
    cta: 'Learn more',
    accent: 'from-sky-500 to-blue-400',
  },
];

function formatEta(etaMinutes?: number | null) {
  if (!etaMinutes) {
    return null;
  }
  if (etaMinutes < 15) {
    return `${etaMinutes} min • lightning fast`;
  }
  return `${etaMinutes} min • delivery`;
}

function minutesUntilClose(closesAt?: string | null) {
  if (!closesAt) {
    return null;
  }
  const diff = new Date(closesAt).getTime() - Date.now();
  return Math.round(diff / 60000);
}

function toRestaurantCard(restaurant: SampleRestaurant): RestaurantCard {
  const minutes = minutesUntilClose(restaurant.closes_at ?? undefined);
  const closesSoonMessage = minutes != null && minutes <= 45 ? `${minutes} min until closing` : null;

  return {
    id: restaurant.id,
    name: restaurant.name,
    tagline:
      restaurant.highlights?.[0] ??
      restaurant.standout_dish ??
      `${restaurant.cuisine.charAt(0).toUpperCase()}${restaurant.cuisine.slice(1)} favorites`,
    cuisine: restaurant.cuisine,
    heroImage:
      restaurant.hero_image ??
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1600&q=80',
    rating: restaurant.rating,
    etaMinutes: restaurant.eta_minutes,
    closesSoonMessage,
    promo: restaurant.promo ?? undefined,
  };
}

async function fetchFeaturedRestaurants(): Promise<RestaurantCard[]> {
  if (!supabase) {
    return FALLBACK_RESTAURANTS.map(toRestaurantCard);
  }

  const { data, error } = await supabase
    .from('fc_restaurants')
    .select(
      [
        'id',
        'slug',
        'name',
        'cuisine',
        'cuisine_group',
        'rating',
        'eta_minutes',
        'closes_at',
        'standout_dish',
        'delivery_fee',
        'promo',
        'hero_image',
        'highlights',
      ].join(', '),
    )
    .eq('is_active', true)
    .order('closes_at', { ascending: true })
    .limit(12);

  if (error || !data?.length) {
    return FALLBACK_RESTAURANTS.map(toRestaurantCard);
  }

  return (data as any[]).map(row =>
    toRestaurantCard({
      id: row.slug ?? row.id,
      name: row.name,
      cuisine_group: row.cuisine_group,
      cuisine: row.cuisine,
      rating: row.rating,
      eta_minutes: row.eta_minutes,
      closes_at: row.closes_at,
      standout_dish: row.standout_dish,
      delivery_fee: row.delivery_fee,
      promo: row.promo,
      dietary_tags: row.dietary_tags ?? [],
      price_tier: row.price_tier,
      hero_image: row.hero_image,
      highlights: row.highlights,
    }),
  );
}

function RestaurantCardView({ restaurant }: { restaurant: RestaurantCard }) {
  return (
    <Link
      href={`/food/stores/${restaurant.id}`}
      className="group flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl"
    >
      <div
        className="h-48 w-full bg-cover bg-center"
        style={{ backgroundImage: `url(${restaurant.heroImage})` }}
      />
      <div className="flex flex-1 flex-col gap-2 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white group-hover:text-emerald-200">
              {restaurant.name}
            </h3>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{restaurant.cuisine}</p>
          </div>
          {restaurant.rating ? (
            <div className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-amber-300">
              {restaurant.rating.toFixed(1)} ★
            </div>
          ) : null}
        </div>
        <p className="text-sm text-slate-300">{restaurant.tagline}</p>
        <div className="mt-auto flex items-center justify-between text-xs font-semibold text-slate-400">
          <span>{formatEta(restaurant.etaMinutes) ?? 'Estimated soon'}</span>
          {restaurant.closesSoonMessage ? (
            <span className="rounded-full bg-rose-500/10 px-3 py-1 text-rose-200">
              {restaurant.closesSoonMessage}
            </span>
          ) : null}
        </div>
        {restaurant.promo ? (
          <div className="rounded-2xl bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200">
            {restaurant.promo}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

export default async function FoodCourtHome() {
  const restaurants = await fetchFeaturedRestaurants();
  const featured = restaurants.slice(0, 4);
  const placesYouMightLike = restaurants.slice(2, 8);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              href="/food"
              className="font-display text-3xl tracking-[0.3em] text-emerald-300 transition hover:text-emerald-200"
            >
              Food Court
            </Link>
            <div className="mt-2 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">
              <span>Delivery</span>
              <span className="h-1 w-1 rounded-full bg-slate-500" />
              <span>3084 Coral Vine Ln</span>
              <span className="h-1 w-1 rounded-full bg-slate-500" />
              <span>Now</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em]">
            <Link href="/food/concierge" className="text-slate-300 transition hover:text-white">
              Concierge
            </Link>
            <Link href="/voice" className="text-slate-400 transition hover:text-white">
              MovieNite
            </Link>
            <Link href="/" className="hidden text-slate-500 transition hover:text-white md:inline">
              Dashboard
            </Link>
          </div>
        </div>
        <div className="border-t border-white/5">
          <div className="mx-auto flex max-w-6xl snap-x gap-3 overflow-x-auto px-6 py-4 text-sm font-semibold text-slate-200">
            {CATEGORY_CHIPS.map(category => (
              <span
                key={category.label}
                className="whitespace-nowrap rounded-full border border-white/10 px-4 py-2 transition hover:border-emerald-400 hover:text-emerald-200"
              >
                <span className="mr-2">{category.emoji}</span>
                {category.label}
              </span>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10">
        <section className="grid gap-4 md:grid-cols-3">
          {PROMO_CARDS.map(card => (
            <div
              key={card.title}
              className={`rounded-3xl bg-gradient-to-br ${card.accent} p-6 text-slate-950 shadow-2xl`}
            >
              <div className="text-xs uppercase tracking-[0.3em] text-slate-900/80">Limited offer</div>
              <h2 className="mt-3 text-xl font-semibold">{card.title}</h2>
              <p className="mt-2 text-sm text-slate-900/80">{card.description}</p>
              <button className="mt-4 rounded-full bg-slate-950/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-950 transition hover:bg-slate-950/20">
                {card.cta}
              </button>
            </div>
          ))}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">Featured on Food Court</h2>
              <p className="text-sm text-slate-400">Curated picks tailored to the Rivera household</p>
            </div>
            <Link
              href="/food/concierge"
              className="rounded-full border border-emerald-400/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200 transition hover:border-emerald-300 hover:text-emerald-100"
            >
              Ask concierge
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {featured.map(restaurant => (
              <RestaurantCardView key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">Places you might like</h2>
              <p className="text-sm text-slate-400">Based on your recent Caribbean orders and healthy picks</p>
            </div>
            <Link href="/food/stores" className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 transition hover:text-white">
              See all
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {placesYouMightLike.map(restaurant => (
              <RestaurantCardView key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        </section>

        <section className="space-y-3 rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl">
          <h2 className="text-2xl font-semibold text-white">Tonight&apos;s concierge suggestions</h2>
          <p className="text-sm text-slate-400">
            &ldquo;Closes soon&rdquo; filters, dietary notes, and bundle deals—all handled by the voice concierge. Launch it to
            lock in dinner in under two minutes.
          </p>
          <Link
            href="/food/concierge"
            className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-400 px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-950 transition hover:bg-emerald-300"
          >
            Launch concierge
          </Link>
        </section>
      </main>
    </div>
  );
}

