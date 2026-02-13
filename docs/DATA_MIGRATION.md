# Supabase Database Migration Guide

**Project**: ubereats-ai-sdk-hitl (Food Delivery Voice Concierge)  
**Date**: February 2026  
**Purpose**: Rebuild Supabase database in new project using production backup

---

## Overview

This guide shows how to restore your complete database using the production backup from November 13, 2025. The backup contains the exact schema and real data from your working application, making it the most reliable migration source.

**✅ Recommended Approach**: Use the production backup  
**❌ Avoid**: Manual SQL files (outdated, incomplete)

---

## Backup File Analysis

### Production Backup
- **File**: `bkups/db_cluster-13-11-2025@04-07-29.backup`
- **Format**: PostgreSQL cluster dump (ASCII SQL)
- **Contains**: Complete schema + real production data from Nov 13, 2025
- **Includes**: Roles, permissions, indexes, views, functions, all data

---

## Migration Strategy  

### ✅ Recommended: Production Backup Restore

**Use the complete backup from your working database**:

The backup file `db_cluster-13-11-2025@04-07-29.backup` contains everything needed to recreate your database exactly as it was on November 13, 2025.

### ❌ Avoid: Manual SQL Files  

The manual migration files (`schema_*.sql`, `seed_data_*.sql`) are now outdated and incomplete compared to your production backup:
- Missing schema changes made after Nov 6, 2025
- Only sample data vs. real user data  
- Potential inconsistencies between files

---

## Step-by-Step Migration Instructions

### Phase 1: Environment Setup

1. **Create new Supabase project**  
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Create new project
   - Wait for provisioning (2-3 minutes)

2. **Copy new credentials to `.env.local`**:
   ```bash
   # Update these in your .env.local
   SUPABASE_URL=https://your-new-project-ref.supabase.co
   SUPABASE_ANON_KEY=eyJhbGc...  # New anon key
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # New service role key
   
   # Keep existing
   OPENAI_API_KEY=sk-proj-...  # Unchanged
   DEMO_PROFILE_ID=00000000-0000-0000-0000-0000000000fc  # From backup
   ```

### Phase 2: Database Restoration

#### Option A: SQL Editor Migration (Easiest - Recommended)

We've created a clean SQL migration file from your production backup:

1. **Open SQL Editor** in your new Supabase project
2. **Copy the migration file**:
   - Open `/supabase/full_migration_0212.sql` 
   - Copy entire contents
   - Paste into SQL Editor and run
3. **Migration includes**:
   - Complete schema (16 Food Court + 5 MovieNite tables)
   - Primary keys, foreign keys, indexes
   - Row Level Security policies  
   - Sample production data for testing

#### Option B: Direct Backup Restore (Command Line)

If you prefer using the raw backup file:

#### Option B: Direct Backup Restore (Command Line)

If you prefer using the raw backup file:

1. **Use PostgreSQL client**:
   ```bash
   # Connect and restore
   pg_restore --host=db.xxx.supabase.co \
             --port=5432 \
             --username=postgres \
             --dbname=postgres \
             --no-owner \
             --no-privileges \
             --clean \
             --if-exists \
             --verbose \
             bkups/db_cluster-13-11-2025@04-07-29.backup
   ```

#### Option C: Manual SQL Paste (Alternative)

If the backup file is too large for command line:

1. **Navigate to SQL Editor** in Supabase dashboard
2. **Upload backup file**:
   - Copy contents of `bkups/db_cluster-13-11-2025@04-07-29.backup`
   - Paste into SQL Editor
   - Click "Run" 
   - Wait for completion (may take several minutes)

#### Option B: Command Line (For large backups)

```bash
# Connect to new Supabase project
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Restore from backup file  
\i /path/to/ubereats-ai-sdk-hitl/bkups/db_cluster-13-11-2025@04-07-29.backup

# Or pipe directly:
psql "postgresql://..." < bkups/db_cluster-13-11-2025@04-07-29.backup
```

### Phase 3: Verification & Testing

1. **Verify database structure**:
   ```sql
   -- Check all tables restored
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   
   -- Should include: fc_* and mvnte_* tables
   ```

2. **Verify production data**:
   ```sql
   -- Check profiles (real household data)
   SELECT household_name FROM fc_profiles;
   
   -- Check restaurants (production catalog)
   SELECT COUNT(*) FROM fc_restaurants;
   
   -- Check order history (real user data)
   SELECT COUNT(*) FROM fc_orders;
   ```

3. **Test application**:
   - Run `npm run dev`
   - Navigate to `/food/concierge`
   - Try a sample query: "I want Caribbean food"
   - Verify tools execute with real data from backup

---

## Database Schema Overview (From Backup)

### Production Schema Analysis

The backup contains the complete production schema from November 13, 2025:

**Food Court System (`fc_*`)** - Active production tables:
- `fc_profiles` - Household accounts  
- `fc_preferences` - User dietary preferences
- `fc_restaurants` - Restaurant catalog
- `fc_orders` - Historical order data
- Menu system: `fc_menu_sections`, `fc_menu_items`, etc.
- Cart system: `fc_carts`, `fc_cart_items`, etc.

**MovieNite System (`mvnte_*`)** - Legacy tables (may be present):
- Netflix concierge demo tables
- Can be ignored if only using Food Court

**Production Benefits**:
- Real user preferences and order history
- Complete restaurant catalog as configured
- All indexes and constraints properly set
- Tested schema that was working in production

---

## Troubleshooting

### Common Issues with Backup Restoration

**Issue**: Backup file contains roles your new project doesn't support
```
ERROR: role "authenticator" already exists
```
**Solution**: This is normal with Supabase. The restore will create roles and continue. Non-critical errors about existing roles can be ignored.

**Issue**: Large backup file times out in web interface
```
ERROR: Query timeout after 60 seconds
```
**Solution**: Use command line restoration (psql method) for files larger than a few MB.

**Issue**: SSL connection errors with psql
```
ERROR: connection to server failed: SSL is not enabled
```
**Solution**: Add `?sslmode=require` to your connection string:
```bash
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres?sslmode=require"
```

**Issue**: Permission errors during restore
```
ERROR: permission denied to create role
```
**Solution**: This is expected. Supabase manages roles automatically. The database content will still restore correctly.

**Issue**: Application can't connect after restore
```
Error: relation "fc_profiles" does not exist
```
**Solution**: Check if backup restored successfully and verify your new Supabase URL/keys in `.env.local`.

### Validation Queries

```sql
-- 1. Verify backup restored completely
SELECT schemaname, tablename, rowcount 
FROM (
  SELECT schemaname, tablename, n_tup_ins - n_tup_del as rowcount 
  FROM pg_stat_user_tables 
  WHERE schemaname = 'public'
) t 
ORDER BY tablename;

-- 2. Check production data integrity
SELECT 
  'fc_profiles' as table_name, COUNT(*) as records FROM fc_profiles
UNION ALL
SELECT 'fc_restaurants', COUNT(*) FROM fc_restaurants  
UNION ALL
SELECT 'fc_orders', COUNT(*) FROM fc_orders
UNION ALL
SELECT 'fc_menu_items', COUNT(*) FROM fc_menu_items;

-- 3. Verify demo profile from backup exists
SELECT household_name, default_location 
FROM fc_profiles 
WHERE id = '00000000-0000-0000-0000-0000000000fc';
```

---

## Post-Migration Checklist

### Application Testing

- [ ] **Environment**: New Supabase credentials in `.env.local`
- [ ] **Backup Restore**: Complete database restored from production backup
- [ ] **Connection**: Application connects without database errors
- [ ] **Data Integrity**: Production data (profiles, restaurants, orders) preserved
- [ ] **Tools**: Food concierge agent can query real restaurant data
- [ ] **HITL**: Approval workflow works with production schema

### Database Validation

- [ ] **Production Data**: Real household profiles and preferences loaded
- [ ] **Restaurant Catalog**: Complete production restaurant database restored
- [ ] **Order History**: Historical order data preserved for conversation context
- [ ] **Schema Integrity**: All foreign keys and constraints working

### Data Migration Benefits

✅ **Real Data**: Using actual production data instead of samples  
✅ **Proven Schema**: Database structure that was working in production  
✅ **Complete History**: All user interactions and preferences preserved  
✅ **No Data Loss**: Perfect migration of your working database  

### Optional: Archive Legacy Files

Since you're using the production backup, you can archive the manual migration files:

```bash
# Move manual files to archive (optional)
mkdir -p supabase/archive
mv supabase/schema_*.sql supabase/archive/
mv supabase/seed_data_*.sql supabase/archive/

# Keep only the backup as source of truth
# bkups/db_cluster-13-11-2025@04-07-29.backup
```

### Next Steps

1. **Validate production data**: Verify your real restaurant catalog loaded correctly
2. **Test with real context**: Concierge now has access to actual user preferences and order history  
3. **Deploy confidently**: You're using the exact same database that was working in production
4. **Document any changes**: If you modify the schema, create new backups for future migrations

---

## Summary

Use the **production backup** for the most reliable migration:

**✅ Recommended Migration Path**:
1. Create new Supabase project
2. Restore `bkups/db_cluster-13-11-2025@04-07-29.backup`
3. Update `.env.local` with new credentials
4. Test application with real production data

**Benefits Over Manual Migration**:
- Real user data preserved (not just samples)
- Exact schema that was working in production
- All relationships, indexes, and constraints intact
- Complete order history for conversation context
- No risk of missing schema changes or data inconsistencies

The application at `/food/concierge` will work with your complete production dataset, giving you the most accurate testing environment and preserving all your valuable user data and restaurant catalog.

---

**End of Document**

### Schema Files
| File | Purpose | Status |
|------|---------|---------|
| `schema.sql` | MovieNite base schema | ✅ Stable |
| `schema_20251106_menu_cart.sql` | Food Court menu/cart extension | ⚠️ Incremental (requires base fc schema) |
| `schema_merged_20251106.sql` | **Complete Food Court schema** | ✅ **Recommended** |

### Seed Data Files  
| File | Purpose | Depends On |
|------|---------|------------|
| `seed_data.sql` | MovieNite + basic Food Court data | `schema.sql` + Food Court base |
| `seed_data_20251106_menu_cart.sql` | Detailed menu items/options | Food Court restaurants exist |
| `seed_data_merged_20251106.sql` | **Complete Food Court data** | `schema_merged_20251106.sql` |

---

## Recommended Migration Order (New Project)

### Phase 1: MovieNite System (Optional)

If you want to keep the Netflix concierge functionality:

```sql
-- Step 1: Run MovieNite schema
-- File: /supabase/schema.sql
-- Creates: mvnte_profiles, mvnte_titles, mvnte_view_history, mvnte_preferences
```

```sql
-- Step 2: Seed MovieNite data
-- File: /supabase/seed_data.sql (lines 1-190 approximately)
-- Populates: Demo titles, viewing history, preferences
```

### Phase 2: Food Court System (Required)

```sql
-- Step 3: Run complete Food Court schema  
-- File: /supabase/schema_merged_20251106.sql
-- Creates: fc_profiles, fc_preferences, fc_restaurants, fc_menu_sections, 
--          fc_menu_items, fc_carts, fc_orders, and all related tables
```

```sql
-- Step 4: Seed complete Food Court data
-- File: /supabase/seed_data_merged_20251106.sql  
-- Populates: Rivera household, preferences, restaurants, menu items, sample orders
```

---

## Detailed Migration Steps

### Step 1: Create New Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Wait for project initialization (~2-3 minutes)
4. Copy project credentials:
   - `Project URL`
   - `anon` key 
   - `service_role` key (for server-side operations)

### Step 2: Update Environment Variables

```bash
# Update .env.local
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Keep existing OpenAI key
OPENAI_API_KEY=sk-proj-...

# Demo profile ID (created by seed data)
DEMO_PROFILE_ID=00000000-0000-0000-0000-0000000000fc
```

### Step 3: Run Schema Migrations

#### Option A: Food Court Only (Recommended)

```sql
-- In Supabase SQL Editor, run:

-- 1. MovieNite schema (for existing functionality)
-- Copy/paste entire contents of: supabase/schema.sql

-- 2. Complete Food Court schema  
-- Copy/paste entire contents of: supabase/schema_merged_20251106.sql
```

#### Option B: Incremental Approach (Not Recommended)

```sql
-- Only use if you need to understand the evolution:
-- 1. supabase/schema.sql
-- 2. Create base fc_profiles/fc_restaurants manually
-- 3. supabase/schema_20251106_menu_cart.sql
```

### Step 4: Run Seed Data

```sql
-- In Supabase SQL Editor:

-- 1. MovieNite seed data (if using MovieNite)
-- Copy/paste entire contents of: supabase/seed_data.sql

-- 2. Complete Food Court seed data
-- Copy/paste entire contents of: supabase/seed_data_merged_20251106.sql
```

### Step 5: Set Up Row Level Security (RLS)

```sql
-- Enable RLS on key tables
alter table fc_profiles enable row level security;
alter table fc_preferences enable row level security;
alter table fc_restaurants enable row level security;
alter table fc_orders enable row level security;
alter table fc_layouts enable row level security;

-- Allow service role full access (for server-side operations)
create policy "Service role access" on fc_profiles for all using (auth.role() = 'service_role');
create policy "Service role access" on fc_preferences for all using (auth.role() = 'service_role');
create policy "Service role access" on fc_restaurants for all using (auth.role() = 'service_role');
create policy "Service role access" on fc_orders for all using (auth.role() = 'service_role');
create policy "Service role access" on fc_layouts for all using (auth.role() = 'service_role');

-- Allow anon read access to public data (for client-side homepage)
create policy "Anon read restaurants" on fc_restaurants for select using (true);
create policy "Anon read layouts" on fc_layouts for select using (true);
```

---

## Database Schema Overview

### Table Dependencies (Creation Order)

```
1. fc_profiles (no dependencies)
   ↓
2. fc_preferences (references fc_profiles)
   fc_restaurants (no dependencies)
   fc_layouts (references fc_profiles)
   ↓
3. fc_menu_sections (references fc_restaurants)
   fc_carts (references fc_profiles, fc_restaurants)
   fc_orders (references fc_profiles, fc_restaurants)
   ↓
4. fc_menu_items (references fc_restaurants, fc_menu_sections)
   fc_cart_items (references fc_carts, fc_menu_items)
   fc_order_items (references fc_orders, fc_menu_items)
   ↓
5. fc_menu_item_option_groups (references fc_menu_items)
   ↓
6. fc_menu_item_option_choices (references fc_menu_item_option_groups)
   ↓
7. fc_cart_item_options (references fc_cart_items, fc_menu_item_option_choices)
   fc_order_item_options (references fc_order_items)
```

### Key Tables for Food Concierge

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `fc_profiles` | Household/user profiles | `id`, `household_name`, `default_location` |
| `fc_preferences` | Dietary preferences, cuisines | `favorite_cuisines[]`, `dietary_tags[]` |
| `fc_restaurants` | Restaurant catalog | `name`, `cuisine`, `rating`, `eta_minutes` |
| `fc_menu_items` | Individual food items | `name`, `base_price`, `tags[]`, `calories` |
| `fc_carts` | Active shopping carts | `profile_id`, `restaurant_id`, `status` |
| `fc_orders` | Completed orders | `restaurant_name`, `total`, `created_at` |

---

## Data Validation Checklist

After running migrations, verify:

### ✅ Schema Validation
```sql
-- Check all Food Court tables exist
\dt fc_*

-- Verify key constraints
select table_name, constraint_name, constraint_type 
from information_schema.table_constraints 
where table_name like 'fc_%' and constraint_type in ('FOREIGN KEY', 'UNIQUE', 'PRIMARY KEY');
```

### ✅ Seed Data Validation  
```sql
-- Verify demo profile exists
select * from fc_profiles where id = '00000000-0000-0000-0000-0000000000fc';

-- Check restaurants are populated
select count(*), cuisine_group from fc_restaurants group by cuisine_group;

-- Verify menu items exist
select r.name, count(mi.id) as menu_items 
from fc_restaurants r 
left join fc_menu_items mi on mi.restaurant_id = r.id 
group by r.id, r.name 
order by menu_items desc;

-- Check preferences seeded
select * from fc_preferences where profile_id = '00000000-0000-0000-0000-0000000000fc';
```

### ✅ API Integration Test
```bash
# Test from your project root
npm run dev

# Visit: http://localhost:3000/food/concierge
# Try: "Show me Caribbean restaurants"
# Should return restaurants from fc_restaurants table
```

---

## Troubleshooting

### Issue: "relation does not exist" 

**Problem**: Tables not created in correct order  
**Solution**: Drop all `fc_*` tables and re-run `schema_merged_20251106.sql`

```sql
-- Drop all Food Court tables (in reverse dependency order)
drop table if exists fc_feedback cascade;
drop table if exists fc_order_item_options cascade;
drop table if exists fc_order_items cascade;
drop table if exists fc_order_events cascade;  
drop table if exists fc_orders cascade;
drop table if exists fc_cart_item_options cascade;
drop table if exists fc_cart_items cascade;
drop table if exists fc_carts cascade;
drop table if exists fc_menu_item_option_choices cascade;
drop table if exists fc_menu_item_option_groups cascade;
drop table if exists fc_menu_items cascade;
drop table if exists fc_menu_sections cascade;
drop table if exists fc_layouts cascade;
drop table if exists fc_restaurants cascade;
drop table if exists fc_preferences cascade;  
drop table if exists fc_profiles cascade;
```

### Issue: "permission denied for relation" 

**Problem**: RLS policies not configured  
**Solution**: Run RLS setup from Step 5 above

### Issue: Food concierge returns empty results

**Problem**: Seed data not loaded  
**Solution**: Re-run `seed_data_merged_20251106.sql`

### Issue: Environment variables not working

**Problem**: Keys copied incorrectly  
**Solution**: Double-check project URL and keys from Supabase dashboard

---

## File Execution Summary

For a **clean new Supabase project**, execute files in this exact order:

```bash
# 1. Schema (creates all tables)
# Run in Supabase SQL Editor:
supabase/schema.sql                    # (Optional: MovieNite tables)
supabase/schema_merged_20251106.sql    # (Required: Food Court tables)

# 2. Seed Data (populates tables) 
# Run in Supabase SQL Editor:
supabase/seed_data.sql                      # (Optional: MovieNite data)
supabase/seed_data_merged_20251106.sql      # (Required: Food Court data)

# 3. RLS Policies (security)
# See Step 5 above for SQL commands

# 4. Update .env.local with new project credentials
```

**Total Time**: ~10-15 minutes for complete migration

---

## Next Steps After Migration

1. **Test the food concierge**: Visit `/food/concierge` and try voice/text queries
2. **Verify HITL approval workflow**: Add items to cart and confirm order flow
3. **Check homepage layout**: Visit `/food` to see restaurant tiles
4. **Monitor API usage**: Check Supabase dashboard for query patterns

Your new Supabase project is now ready for the Food Court voice concierge! 

---

## Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-12 | AI Assistant | Initial migration guide for new Supabase project setup |