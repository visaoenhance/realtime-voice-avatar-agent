async function main() {
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  const missing = requiredVars.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing.join(', '));
    process.exit(1);
  }

  if (process.env.SUPABASE_URL !== process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.warn(
      '[warn] SUPABASE_URL and NEXT_PUBLIC_SUPABASE_URL differ. Make sure both point to the same project URL.',
    );
  }

  const { createClient } = await import('@supabase/supabase-js');

  const serviceClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  console.log('Testing service-role connection…');
  const profileResult = await serviceClient
    .from('fc_profiles')
    .select('id, household_name, updated_at')
    .limit(1)
    .maybeSingle();

  if (profileResult.error) {
    console.error('[service-role] Failed to fetch fc_profiles:', profileResult.error.message);
    process.exit(1);
  }

  console.log('[service-role] Profile lookup OK:', profileResult.data ?? null);

  const restaurantResult = await serviceClient
    .from('fc_restaurants')
    .select('slug, name, cuisine, cuisine_group, eta_minutes, closes_at')
    .order('updated_at', { ascending: false })
    .limit(3);

  if (restaurantResult.error) {
    console.error('[service-role] Failed to fetch fc_restaurants:', restaurantResult.error.message);
    process.exit(1);
  }

  console.log('[service-role] Sample restaurants:', restaurantResult.data);

  const anonClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });

  console.log('Testing anon connection…');
  const anonResult = await anonClient
    .from('fc_restaurants')
    .select('slug, name, cuisine, eta_minutes')
    .limit(3);

  if (anonResult.error) {
    console.error('[anon] Failed to fetch fc_restaurants:', anonResult.error.message);
    process.exit(1);
  }

  console.log('[anon] Public read OK:', anonResult.data);

  console.log('Supabase credentials check passed.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

