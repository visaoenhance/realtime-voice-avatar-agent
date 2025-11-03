import { NextResponse } from 'next/server';
import { DEMO_PROFILE_ID, supabase } from '@/lib/supabaseServer';

export async function POST() {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
  }

  const { data, error } = await supabase
    .from('mvnte_profiles')
    .select('default_layout')
    .eq('id', DEMO_PROFILE_ID)
    .single();

  if (error) {
    console.error('[api/data/homepage/reset] fetch error', error);
    return NextResponse.json({ error: 'Failed to load default layout' }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from('mvnte_profiles')
    .update({ current_layout: data.default_layout, updated_at: new Date().toISOString() })
    .eq('id', DEMO_PROFILE_ID);

  if (updateError) {
    console.error('[api/data/homepage/reset] update error', updateError);
    return NextResponse.json({ error: 'Failed to reset layout' }, { status: 500 });
  }

  return NextResponse.json({ success: true, layout: data.default_layout });
}
