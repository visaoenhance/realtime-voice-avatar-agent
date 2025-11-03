import { NextResponse } from 'next/server';
import { DEMO_PROFILE_ID, supabase } from '@/lib/supabaseServer';

export async function GET() {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
  }

  const { data, error } = await supabase
    .from('mvnte_profiles')
    .select('current_layout, default_layout')
    .eq('id', DEMO_PROFILE_ID)
    .single();

  if (error) {
    console.error('[api/data/homepage] fetch error', error);
    return NextResponse.json({ error: 'Failed to load layout' }, { status: 500 });
  }

  const layout = data.current_layout ?? data.default_layout;
  return NextResponse.json({ layout });
}
