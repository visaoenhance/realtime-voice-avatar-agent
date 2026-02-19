import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseServer';

export async function GET() {
  // Disable in production for security
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Debug endpoints disabled in production' }, { status: 403 });
  }

  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  try {
    // Get table schema info
    const { data: columns, error } = await supabase.rpc('get_table_columns', {
      table_name: 'fc_orders'
    });

    if (error) {
      // Fallback: try to describe the table by attempting to select with all possible columns
      const { error: selectError } = await supabase
        .from('fc_orders')
        .select('*')
        .limit(0);

      return NextResponse.json({
        error: 'Could not get schema info',
        selectError: selectError?.message,
        rpcError: error.message
      });
    }

    return NextResponse.json({ columns });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}