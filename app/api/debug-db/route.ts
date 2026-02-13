// Simple database debug endpoint
import { supabase } from '@/lib/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' });
  }

  try {
    // Get all restaurants
    const { data: restaurants, error: restaurantError } = await supabase
      .from('fc_restaurants')
      .select('slug, name, cuisine_group, cuisine, dietary_tags, price_tier, address, is_active')
      .eq('is_active', true);

    if (restaurantError) {
      return NextResponse.json({ error: 'Restaurant query failed', details: restaurantError.message });
    }

    // Get profiles
    const { data: profiles, error: profileError } = await supabase
      .from('fc_profiles')  
      .select('id, household_name, default_location');

    // Test Orlando search
    const { data: orlandoResults, error: orlandoError } = await supabase
      .from('fc_restaurants')
      .select('name, address, cuisine')
      .eq('is_active', true)
      .or('address.ilike.%Orlando%,address.ilike.%Winter Park%,address.ilike.%Maitland%,address.ilike.%Altamonte Springs%');

    return NextResponse.json({
      totalRestaurants: restaurants?.length || 0,
      restaurants: restaurants?.map(r => ({
        name: r.name,
        cuisine: r.cuisine,
        address: r.address,
        dietaryTags: r.dietary_tags
      })),
      profiles: profiles?.map(p => ({
        name: p.household_name,
        location: p.default_location
      })),
      orlandoSearchResults: orlandoResults?.length || 0,
      orlandoRestaurants: orlandoResults?.map(r => ({
        name: r.name,
        address: r.address,
        cuisine: r.cuisine
      })),
      orlandoError: orlandoError?.message
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Database check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}