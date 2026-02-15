import Link from 'next/link';
import { FALLBACK_RESTAURANTS, SampleRestaurant } from '@/data/foodCourtSamples';
import { supabase } from '@/lib/supabaseServer';
import LandingPageHeader from './components/LandingPageHeader';
import EnvironmentBadgeServer from '@/components/EnvironmentBadgeServer';

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
      className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div
        className="h-48 w-full bg-cover bg-center"
        style={{ backgroundImage: `url(${restaurant.heroImage})` }}
      />
      <div className="flex flex-1 flex-col gap-2 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-emerald-600">
              {restaurant.name}
            </h3>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{restaurant.cuisine}</p>
          </div>
          {restaurant.rating ? (
            <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              {restaurant.rating.toFixed(1)} ★
            </div>
          ) : null}
        </div>
        <p className="text-sm text-slate-600">{restaurant.tagline}</p>
        <div className="mt-auto flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>{formatEta(restaurant.etaMinutes) ?? 'Estimated soon'}</span>
          {restaurant.closesSoonMessage ? (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">
              {restaurant.closesSoonMessage}
            </span>
          ) : null}
        </div>
        {restaurant.promo ? (
          <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <LandingPageHeader environmentBadge={<EnvironmentBadgeServer />} />
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl snap-x gap-3 overflow-x-auto px-6 py-4 text-sm font-semibold text-slate-600">
          {CATEGORY_CHIPS.map(category => (
            <span
              key={category.label}
              className="whitespace-nowrap rounded-full border border-slate-200 bg-white px-4 py-2 transition hover:border-emerald-300 hover:text-emerald-600"
            >
              <span className="mr-2">{category.emoji}</span>
              {category.label}
            </span>
          ))}
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10">
        <section className="grid gap-4 md:grid-cols-3">
          {PROMO_CARDS.map(card => (
            <div
              key={card.title}
              className={`rounded-3xl bg-gradient-to-br ${card.accent} p-6 text-slate-950 shadow-lg`}
            >
              <div className="text-xs uppercase tracking-[0.3em] text-slate-900/70">Limited offer</div>
              <h2 className="mt-3 text-xl font-semibold">{card.title}</h2>
              <p className="mt-2 text-sm text-slate-900/70">{card.description}</p>
              <button className="mt-4 rounded-full bg-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-900 transition hover:bg-white/30">
                {card.cta}
              </button>
            </div>
          ))}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Featured on Food Court</h2>
              <p className="text-sm text-slate-500">Curated picks tailored to the Rivera household</p>
            </div>
            <Link
              href="/food/concierge"
              className="rounded-full border border-emerald-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600 transition hover:border-emerald-400 hover:text-emerald-700"
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
              <h2 className="text-2xl font-semibold text-slate-900">Places you might like</h2>
              <p className="text-sm text-slate-500">Based on your recent Caribbean orders and healthy picks</p>
            </div>
            <Link href="/food/stores" className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 transition hover:text-slate-900">
              See all
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {placesYouMightLike.map(restaurant => (
              <RestaurantCardView key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        </section>

        <section className="space-y-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Tonight&apos;s concierge suggestions</h2>
          <p className="text-sm text-slate-600">
            &ldquo;Closes soon&rdquo; filters, dietary notes, and bundle deals—all handled by the voice concierge. Launch it to
            lock in dinner in under two minutes.
          </p>
          <Link
            href="/food/concierge"
            className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-emerald-400"
          >
            Launch concierge
          </Link>
        </section>
      </main>
    </div>
  );
}

