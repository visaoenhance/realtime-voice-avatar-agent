-- Fix Restaurant Closing Times
-- Updates hardcoded November 2025 timestamps to current February 2026 times

UPDATE public.fc_restaurants SET
  closes_at = CASE 
    WHEN name = 'Island Breeze Caribbean' THEN '2026-02-12 21:57:51+00'::timestamp with time zone
    WHEN name = 'Sabor Latino Cantina' THEN '2026-02-12 22:42:51+00'::timestamp with time zone  
    WHEN name = 'Green Garden Bowls' THEN '2026-02-12 22:12:51+00'::timestamp with time zone
    WHEN name = 'Harvest & Hearth Kitchen' THEN '2026-02-12 22:22:51+00'::timestamp with time zone
    WHEN name = 'Noodle Express' THEN '2026-02-12 23:02:51+00'::timestamp with time zone
    WHEN name = 'Brick Oven Slice' THEN '2026-02-12 23:12:51+00'::timestamp with time zone
    ELSE closes_at
  END,
  updated_at = now()
WHERE closes_at < now();

-- Verify the fix
SELECT name, closes_at, 
       EXTRACT(EPOCH FROM (closes_at - now()))/60 as minutes_until_closing
FROM public.fc_restaurants 
ORDER BY closes_at;