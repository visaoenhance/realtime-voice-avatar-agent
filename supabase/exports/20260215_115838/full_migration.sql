-- ============================================================================
-- FULL DATABASE MIGRATION
-- ============================================================================
-- Generated: $(date +"%Y-%m-%d %H:%M:%S")
-- Export directory: ${EXPORT_DIR}
--
-- This file contains the complete schema and data from local development
-- Run this in your remote Supabase SQL Editor to recreate the database
--
-- IMPORTANT: This will create tables and insert data
-- Make sure your remote database is ready (empty or backed up)
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- SCHEMA
-- ============================================================================



SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."fc_cart_item_options" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "cart_item_id" "uuid" NOT NULL,
    "option_choice_id" "uuid" NOT NULL,
    "price_adjustment" numeric(10,2) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."fc_cart_item_options" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fc_cart_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "cart_id" "uuid" NOT NULL,
    "menu_item_id" "uuid" NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "base_price" numeric(10,2) NOT NULL,
    "total_price" numeric(10,2) NOT NULL,
    "instructions" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."fc_cart_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fc_carts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "restaurant_id" "uuid",
    "status" "text" DEFAULT 'active'::"text",
    "subtotal" numeric(10,2) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."fc_carts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fc_feedback" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "restaurant_id" "uuid" NOT NULL,
    "rating" integer NOT NULL,
    "comment" "text",
    "feedback_type" "text" DEFAULT 'order'::"text",
    "is_public" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."fc_feedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fc_layouts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "layout_config" "jsonb" NOT NULL,
    "is_default" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."fc_layouts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fc_menu_item_option_choices" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "option_group_id" "uuid" NOT NULL,
    "label" "text" NOT NULL,
    "price_modifier" numeric(10,2) DEFAULT 0,
    "calories_modifier" integer DEFAULT 0,
    "is_default" boolean DEFAULT false,
    "is_available" boolean DEFAULT true,
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."fc_menu_item_option_choices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fc_menu_item_option_groups" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "menu_item_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "is_required" boolean DEFAULT false,
    "selection_type" "text" DEFAULT 'single'::"text",
    "min_selections" integer DEFAULT 0,
    "max_selections" integer,
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."fc_menu_item_option_groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fc_menu_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "restaurant_id" "uuid" NOT NULL,
    "section_id" "uuid",
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "base_price" numeric(10,2) NOT NULL,
    "image_url" "text",
    "dietary_tags" "text"[],
    "allergen_info" "text"[],
    "calories" integer,
    "prep_time_minutes" integer,
    "is_available" boolean DEFAULT true,
    "is_popular" boolean DEFAULT false,
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "image" "text"
);


ALTER TABLE "public"."fc_menu_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fc_menu_sections" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "restaurant_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "display_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."fc_menu_sections" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."fc_menu_sections_with_items" AS
 SELECT "s"."id" AS "section_id",
    "s"."name" AS "section_slug",
    "s"."name" AS "section_title",
    "s"."description" AS "section_description",
    "s"."display_order" AS "section_position",
    "s"."restaurant_id",
    COALESCE("json_agg"("json_build_object"('id', "i"."id", 'slug', "i"."slug", 'name', "i"."name", 'description', "i"."description", 'base_price', "i"."base_price", 'image', "i"."image", 'tags', "i"."dietary_tags", 'calories', "i"."calories") ORDER BY "i"."display_order") FILTER (WHERE ("i"."id" IS NOT NULL)), '[]'::"json") AS "items"
   FROM ("public"."fc_menu_sections" "s"
     LEFT JOIN "public"."fc_menu_items" "i" ON ((("s"."id" = "i"."section_id") AND ("i"."is_available" = true))))
  WHERE ("s"."is_active" = true)
  GROUP BY "s"."id", "s"."name", "s"."description", "s"."display_order", "s"."restaurant_id";


ALTER TABLE "public"."fc_menu_sections_with_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fc_order_events" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "event_data" "jsonb",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."fc_order_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fc_order_item_options" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "order_item_id" "uuid" NOT NULL,
    "option_choice_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."fc_order_item_options" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fc_order_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "menu_item_id" "uuid" NOT NULL,
    "quantity" integer NOT NULL,
    "unit_price" numeric(10,2) NOT NULL,
    "special_instructions" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "name" "text",
    "total_price" numeric(10,2)
);


ALTER TABLE "public"."fc_order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fc_orders" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "restaurant_id" "uuid" NOT NULL,
    "order_number" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "subtotal" numeric(10,2) NOT NULL,
    "delivery_fee" numeric(10,2) DEFAULT 0,
    "tax_amount" numeric(10,2) DEFAULT 0,
    "tip_amount" numeric(10,2) DEFAULT 0,
    "total_amount" numeric(10,2) NOT NULL,
    "delivery_address" "jsonb",
    "special_instructions" "text",
    "payment_method" "text",
    "estimated_delivery_time" timestamp with time zone,
    "actual_delivery_time" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "restaurant_name" "text",
    "cuisine" "text",
    "total" numeric(10,2)
);


ALTER TABLE "public"."fc_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fc_preferences" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "dietary_restrictions" "text"[],
    "favorite_cuisines" "text"[],
    "price_range" "text",
    "max_delivery_time" integer,
    "default_tip_percentage" numeric(5,2),
    "notifications_enabled" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."fc_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fc_profiles" (
    "id" "uuid" NOT NULL,
    "household_name" "text" NOT NULL,
    "default_layout" "jsonb",
    "current_layout" "jsonb",
    "default_location" "jsonb",
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."fc_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fc_restaurants" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "cuisine_group" "text" NOT NULL,
    "cuisine" "text",
    "dietary_tags" "text"[],
    "price_tier" "text",
    "rating" numeric(3,2),
    "eta_minutes" integer,
    "closes_at" timestamp with time zone,
    "delivery_fee" numeric(10,2),
    "standout_dish" "text",
    "promo" "text",
    "hero_image" "text",
    "address" "text",
    "phone" "text",
    "highlights" "text"[],
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."fc_restaurants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mvnte_parental_controls" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "max_rating" "text" DEFAULT 'PG-13'::"text",
    "blocked_genres" "text"[],
    "time_restrictions" "jsonb",
    "pin_required" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."mvnte_parental_controls" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mvnte_preferences" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "favorite_genres" "text"[],
    "blocked_ratings" "text"[],
    "autoplay_enabled" boolean DEFAULT true,
    "subtitle_language" "text" DEFAULT 'en'::"text",
    "audio_language" "text" DEFAULT 'en'::"text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."mvnte_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mvnte_profiles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "household_name" "text" NOT NULL,
    "subscription_tier" "text" DEFAULT 'free'::"text",
    "max_profiles" integer DEFAULT 4,
    "parental_controls_enabled" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."mvnte_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mvnte_titles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "type" "text" NOT NULL,
    "genre" "text"[],
    "release_year" integer,
    "rating" "text",
    "duration_minutes" integer,
    "description" "text",
    "poster_url" "text",
    "trailer_url" "text",
    "is_available" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."mvnte_titles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mvnte_view_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "title_id" "uuid" NOT NULL,
    "watch_duration_minutes" integer DEFAULT 0,
    "completion_percentage" numeric(5,2) DEFAULT 0,
    "last_watched_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."mvnte_view_history" OWNER TO "postgres";


ALTER TABLE ONLY "public"."fc_cart_item_options"
    ADD CONSTRAINT "fc_cart_item_options_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fc_cart_items"
    ADD CONSTRAINT "fc_cart_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fc_carts"
    ADD CONSTRAINT "fc_carts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fc_feedback"
    ADD CONSTRAINT "fc_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fc_layouts"
    ADD CONSTRAINT "fc_layouts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fc_menu_item_option_choices"
    ADD CONSTRAINT "fc_menu_item_option_choices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fc_menu_item_option_groups"
    ADD CONSTRAINT "fc_menu_item_option_groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fc_menu_items"
    ADD CONSTRAINT "fc_menu_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fc_menu_items"
    ADD CONSTRAINT "fc_menu_items_slug_unique" UNIQUE ("slug");



ALTER TABLE ONLY "public"."fc_menu_sections"
    ADD CONSTRAINT "fc_menu_sections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fc_order_events"
    ADD CONSTRAINT "fc_order_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fc_order_item_options"
    ADD CONSTRAINT "fc_order_item_options_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fc_order_items"
    ADD CONSTRAINT "fc_order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fc_orders"
    ADD CONSTRAINT "fc_orders_order_number_unique" UNIQUE ("order_number");



ALTER TABLE ONLY "public"."fc_orders"
    ADD CONSTRAINT "fc_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fc_preferences"
    ADD CONSTRAINT "fc_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fc_profiles"
    ADD CONSTRAINT "fc_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fc_restaurants"
    ADD CONSTRAINT "fc_restaurants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fc_restaurants"
    ADD CONSTRAINT "fc_restaurants_slug_unique" UNIQUE ("slug");



ALTER TABLE ONLY "public"."mvnte_parental_controls"
    ADD CONSTRAINT "mvnte_parental_controls_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mvnte_preferences"
    ADD CONSTRAINT "mvnte_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mvnte_profiles"
    ADD CONSTRAINT "mvnte_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mvnte_titles"
    ADD CONSTRAINT "mvnte_titles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mvnte_view_history"
    ADD CONSTRAINT "mvnte_view_history_pkey" PRIMARY KEY ("id");



CREATE INDEX "fc_carts_profile_id_idx" ON "public"."fc_carts" USING "btree" ("profile_id");



CREATE INDEX "fc_menu_items_is_available_idx" ON "public"."fc_menu_items" USING "btree" ("is_available");



CREATE INDEX "fc_menu_items_restaurant_id_idx" ON "public"."fc_menu_items" USING "btree" ("restaurant_id");



CREATE INDEX "fc_menu_items_section_id_idx" ON "public"."fc_menu_items" USING "btree" ("section_id");



CREATE INDEX "fc_orders_created_at_idx" ON "public"."fc_orders" USING "btree" ("created_at");



CREATE INDEX "fc_orders_profile_id_idx" ON "public"."fc_orders" USING "btree" ("profile_id");



CREATE INDEX "fc_orders_status_idx" ON "public"."fc_orders" USING "btree" ("status");



CREATE INDEX "fc_restaurants_cuisine_group_idx" ON "public"."fc_restaurants" USING "btree" ("cuisine_group");



CREATE INDEX "fc_restaurants_is_active_idx" ON "public"."fc_restaurants" USING "btree" ("is_active");



CREATE INDEX "mvnte_titles_is_available_idx" ON "public"."mvnte_titles" USING "btree" ("is_available");



CREATE INDEX "mvnte_titles_type_idx" ON "public"."mvnte_titles" USING "btree" ("type");



CREATE INDEX "mvnte_view_history_profile_id_idx" ON "public"."mvnte_view_history" USING "btree" ("profile_id");



CREATE INDEX "mvnte_view_history_title_id_idx" ON "public"."mvnte_view_history" USING "btree" ("title_id");



ALTER TABLE ONLY "public"."fc_cart_item_options"
    ADD CONSTRAINT "fc_cart_item_options_cart_item_id_fkey" FOREIGN KEY ("cart_item_id") REFERENCES "public"."fc_cart_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fc_cart_item_options"
    ADD CONSTRAINT "fc_cart_item_options_option_choice_id_fkey" FOREIGN KEY ("option_choice_id") REFERENCES "public"."fc_menu_item_option_choices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fc_cart_items"
    ADD CONSTRAINT "fc_cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "public"."fc_carts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fc_cart_items"
    ADD CONSTRAINT "fc_cart_items_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "public"."fc_menu_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fc_carts"
    ADD CONSTRAINT "fc_carts_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."fc_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fc_carts"
    ADD CONSTRAINT "fc_carts_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."fc_restaurants"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."fc_feedback"
    ADD CONSTRAINT "fc_feedback_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."fc_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fc_feedback"
    ADD CONSTRAINT "fc_feedback_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."fc_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fc_feedback"
    ADD CONSTRAINT "fc_feedback_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."fc_restaurants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fc_menu_item_option_choices"
    ADD CONSTRAINT "fc_menu_item_option_choices_option_group_id_fkey" FOREIGN KEY ("option_group_id") REFERENCES "public"."fc_menu_item_option_groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fc_menu_item_option_groups"
    ADD CONSTRAINT "fc_menu_item_option_groups_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "public"."fc_menu_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fc_menu_items"
    ADD CONSTRAINT "fc_menu_items_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."fc_restaurants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fc_menu_items"
    ADD CONSTRAINT "fc_menu_items_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "public"."fc_menu_sections"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."fc_menu_sections"
    ADD CONSTRAINT "fc_menu_sections_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."fc_restaurants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fc_order_events"
    ADD CONSTRAINT "fc_order_events_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."fc_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fc_order_item_options"
    ADD CONSTRAINT "fc_order_item_options_option_choice_id_fkey" FOREIGN KEY ("option_choice_id") REFERENCES "public"."fc_menu_item_option_choices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fc_order_item_options"
    ADD CONSTRAINT "fc_order_item_options_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "public"."fc_order_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fc_order_items"
    ADD CONSTRAINT "fc_order_items_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "public"."fc_menu_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fc_order_items"
    ADD CONSTRAINT "fc_order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."fc_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fc_orders"
    ADD CONSTRAINT "fc_orders_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."fc_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fc_orders"
    ADD CONSTRAINT "fc_orders_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."fc_restaurants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fc_preferences"
    ADD CONSTRAINT "fc_preferences_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."fc_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mvnte_parental_controls"
    ADD CONSTRAINT "mvnte_parental_controls_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."mvnte_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mvnte_preferences"
    ADD CONSTRAINT "mvnte_preferences_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."mvnte_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mvnte_view_history"
    ADD CONSTRAINT "mvnte_view_history_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."mvnte_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mvnte_view_history"
    ADD CONSTRAINT "mvnte_view_history_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "public"."mvnte_titles"("id") ON DELETE CASCADE;



CREATE POLICY "Public layouts read" ON "public"."fc_layouts" FOR SELECT USING (true);



CREATE POLICY "Public menu items read" ON "public"."fc_menu_items" FOR SELECT USING (true);



CREATE POLICY "Public menu option choices read" ON "public"."fc_menu_item_option_choices" FOR SELECT USING (true);



CREATE POLICY "Public menu option groups read" ON "public"."fc_menu_item_option_groups" FOR SELECT USING (true);



CREATE POLICY "Public menu sections read" ON "public"."fc_menu_sections" FOR SELECT USING (true);



CREATE POLICY "Public movie titles read" ON "public"."mvnte_titles" FOR SELECT USING (true);



CREATE POLICY "Public restaurants read" ON "public"."fc_restaurants" FOR SELECT USING (true);



CREATE POLICY "Users can access own preferences" ON "public"."fc_preferences" USING ((("auth"."uid"())::"text" = ("profile_id")::"text"));



CREATE POLICY "Users can access own view history" ON "public"."mvnte_view_history" USING ((("auth"."uid"())::"text" = ("profile_id")::"text"));



CREATE POLICY "Users can manage own cart" ON "public"."fc_carts" USING ((("auth"."uid"())::"text" = ("profile_id")::"text"));



CREATE POLICY "Users can manage own cart items" ON "public"."fc_cart_items" USING ((EXISTS ( SELECT 1
   FROM "public"."fc_carts"
  WHERE (("fc_carts"."id" = "fc_cart_items"."cart_id") AND (("fc_carts"."profile_id")::"text" = ("auth"."uid"())::"text")))));



CREATE POLICY "Users can manage own feedback" ON "public"."fc_feedback" USING ((("auth"."uid"())::"text" = ("profile_id")::"text"));



CREATE POLICY "Users can manage own movie preferences" ON "public"."mvnte_preferences" USING ((("auth"."uid"())::"text" = ("profile_id")::"text"));



CREATE POLICY "Users can manage own movie profile" ON "public"."mvnte_profiles" USING ((("auth"."uid"())::"text" = ("id")::"text"));



CREATE POLICY "Users can manage own orders" ON "public"."fc_orders" USING ((("auth"."uid"())::"text" = ("profile_id")::"text"));



CREATE POLICY "Users can manage own parental controls" ON "public"."mvnte_parental_controls" USING ((("auth"."uid"())::"text" = ("profile_id")::"text"));



CREATE POLICY "Users can manage own profile" ON "public"."fc_profiles" USING ((("auth"."uid"())::"text" = ("id")::"text"));



ALTER TABLE "public"."fc_cart_item_options" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fc_cart_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fc_carts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fc_feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fc_layouts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fc_menu_item_option_choices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fc_menu_item_option_groups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fc_menu_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fc_menu_sections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fc_order_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fc_order_item_options" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fc_order_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fc_orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fc_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fc_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fc_restaurants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mvnte_parental_controls" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mvnte_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mvnte_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mvnte_titles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mvnte_view_history" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON TABLE "public"."fc_cart_item_options" TO "anon";
GRANT ALL ON TABLE "public"."fc_cart_item_options" TO "authenticated";
GRANT ALL ON TABLE "public"."fc_cart_item_options" TO "service_role";



GRANT ALL ON TABLE "public"."fc_cart_items" TO "anon";
GRANT ALL ON TABLE "public"."fc_cart_items" TO "authenticated";
GRANT ALL ON TABLE "public"."fc_cart_items" TO "service_role";



GRANT ALL ON TABLE "public"."fc_carts" TO "anon";
GRANT ALL ON TABLE "public"."fc_carts" TO "authenticated";
GRANT ALL ON TABLE "public"."fc_carts" TO "service_role";



GRANT ALL ON TABLE "public"."fc_feedback" TO "anon";
GRANT ALL ON TABLE "public"."fc_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."fc_feedback" TO "service_role";



GRANT ALL ON TABLE "public"."fc_layouts" TO "anon";
GRANT ALL ON TABLE "public"."fc_layouts" TO "authenticated";
GRANT ALL ON TABLE "public"."fc_layouts" TO "service_role";



GRANT ALL ON TABLE "public"."fc_menu_item_option_choices" TO "anon";
GRANT ALL ON TABLE "public"."fc_menu_item_option_choices" TO "authenticated";
GRANT ALL ON TABLE "public"."fc_menu_item_option_choices" TO "service_role";



GRANT ALL ON TABLE "public"."fc_menu_item_option_groups" TO "anon";
GRANT ALL ON TABLE "public"."fc_menu_item_option_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."fc_menu_item_option_groups" TO "service_role";



GRANT ALL ON TABLE "public"."fc_menu_items" TO "anon";
GRANT ALL ON TABLE "public"."fc_menu_items" TO "authenticated";
GRANT ALL ON TABLE "public"."fc_menu_items" TO "service_role";



GRANT ALL ON TABLE "public"."fc_menu_sections" TO "anon";
GRANT ALL ON TABLE "public"."fc_menu_sections" TO "authenticated";
GRANT ALL ON TABLE "public"."fc_menu_sections" TO "service_role";



GRANT ALL ON TABLE "public"."fc_menu_sections_with_items" TO "anon";
GRANT ALL ON TABLE "public"."fc_menu_sections_with_items" TO "authenticated";
GRANT ALL ON TABLE "public"."fc_menu_sections_with_items" TO "service_role";



GRANT ALL ON TABLE "public"."fc_order_events" TO "anon";
GRANT ALL ON TABLE "public"."fc_order_events" TO "authenticated";
GRANT ALL ON TABLE "public"."fc_order_events" TO "service_role";



GRANT ALL ON TABLE "public"."fc_order_item_options" TO "anon";
GRANT ALL ON TABLE "public"."fc_order_item_options" TO "authenticated";
GRANT ALL ON TABLE "public"."fc_order_item_options" TO "service_role";



GRANT ALL ON TABLE "public"."fc_order_items" TO "anon";
GRANT ALL ON TABLE "public"."fc_order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."fc_order_items" TO "service_role";



GRANT ALL ON TABLE "public"."fc_orders" TO "anon";
GRANT ALL ON TABLE "public"."fc_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."fc_orders" TO "service_role";



GRANT ALL ON TABLE "public"."fc_preferences" TO "anon";
GRANT ALL ON TABLE "public"."fc_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."fc_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."fc_profiles" TO "anon";
GRANT ALL ON TABLE "public"."fc_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."fc_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."fc_restaurants" TO "anon";
GRANT ALL ON TABLE "public"."fc_restaurants" TO "authenticated";
GRANT ALL ON TABLE "public"."fc_restaurants" TO "service_role";



GRANT ALL ON TABLE "public"."mvnte_parental_controls" TO "anon";
GRANT ALL ON TABLE "public"."mvnte_parental_controls" TO "authenticated";
GRANT ALL ON TABLE "public"."mvnte_parental_controls" TO "service_role";



GRANT ALL ON TABLE "public"."mvnte_preferences" TO "anon";
GRANT ALL ON TABLE "public"."mvnte_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."mvnte_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."mvnte_profiles" TO "anon";
GRANT ALL ON TABLE "public"."mvnte_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."mvnte_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."mvnte_titles" TO "anon";
GRANT ALL ON TABLE "public"."mvnte_titles" TO "authenticated";
GRANT ALL ON TABLE "public"."mvnte_titles" TO "service_role";



GRANT ALL ON TABLE "public"."mvnte_view_history" TO "anon";
GRANT ALL ON TABLE "public"."mvnte_view_history" TO "authenticated";
GRANT ALL ON TABLE "public"."mvnte_view_history" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






RESET ALL;

-- ============================================================================
-- DATA
-- ============================================================================

SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.8

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: fc_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."fc_profiles" ("id", "household_name", "default_layout", "current_layout", "default_location", "updated_at") VALUES
	('00000000-0000-0000-0000-0000000000fc', 'Rivera Household', '{"hero": {"cta": "Ask Food Court Concierge", "title": "Island Breeze Caribbean", "backdrop": "https://images.unsplash.com/photo-1604908176970-ef3ee68c1801?auto=format&fit=crop&w=1600&q=80", "subtitle": "Dinner in under 40 minutes", "description": "Need something bold and still open? Ask the concierge to line up Caribbean spots, healthy bowls, or grab-and-go favorites tonight."}, "rows": [{"tiles": [{"tag": "Closes in 45 min", "image": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80", "title": "Island Breeze Caribbean"}, {"tag": "Free Chips Tonight", "image": "https://images.unsplash.com/photo-1606755962773-0e7d4be90a77?auto=format&fit=crop&w=1200&q=80", "title": "Sabor Latino Cantina"}], "title": "Closing Soon Caribbean"}, {"tiles": [{"tag": "ETA 24 min", "image": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80", "title": "Green Garden Bowls"}, {"image": "https://images.unsplash.com/photo-1528712306091-ed0763094c98?auto=format&fit=crop&w=1200&q=80", "title": "Harvest & Hearth"}], "title": "Healthy Staples"}, {"tiles": [{"tag": "2 for $20", "image": "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=80", "title": "Noodle Express"}, {"image": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80", "title": "Brick Oven Slice"}], "title": "Comfort Favorites"}]}', NULL, '{"lat": 28.538336, "lng": -81.379234, "city": "Orlando", "state": "FL"}', '2026-02-13 01:23:11.041133+00');


--
-- Data for Name: fc_restaurants; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."fc_restaurants" ("id", "slug", "name", "cuisine_group", "cuisine", "dietary_tags", "price_tier", "rating", "eta_minutes", "closes_at", "delivery_fee", "standout_dish", "promo", "hero_image", "address", "phone", "highlights", "is_active", "created_at", "updated_at") VALUES
	('c711070d-8016-434c-b260-162fb23430ed', 'sabor-latino-cantina', 'Sabor Latino Cantina', 'latin', 'mexican', '{gluten-free}', 'low', 4.50, 28, '2026-02-13 02:53:11.046475+00', 1.99, 'Al Pastor Tacos', '15% off tonight', 'https://images.pexels.com/photos/14560045/pexels-photo-14560045.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', '205 Fiesta Blvd, Orlando, FL', '407-555-0142', '{"House-made tortillas","Family bundle specials","Late-night bites"}', true, '2025-11-06 21:12:51.434723+00', '2026-02-13 01:23:11.046475+00'),
	('3bb63c3a-6fa9-42ad-8a2a-1b843745a4b4', 'island-breeze-caribbean', 'Island Breeze Caribbean', 'latin', 'caribbean', '{gluten-free,spicy}', 'medium', 4.70, 32, '2026-02-13 02:08:11.046475+00', 2.49, 'Jerk Chicken with Pineapple Slaw', 'Free delivery over $30', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1600&q=80', '135 Island Breeze Ave, Orlando, FL', '407-555-0134', '{"Closes in under an hour","Signature jerk marinades","Combo-friendly sides"}', true, '2025-11-06 21:12:51.434723+00', '2026-02-13 01:23:11.046475+00'),
	('b1b340a9-48c9-44a7-a4db-68a312b8d521', 'green-garden-bowls', 'Green Garden Bowls', 'healthy', 'plant-forward', '{vegetarian,gluten-free,healthy}', 'medium', 4.80, 24, '2026-02-13 02:23:11.046475+00', 0.00, 'Caribbean Quinoa Bowl', 'BOGO 50% off bowls', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1600&q=80', '47 Fresh Market Way, Winter Park, FL', '407-555-0110', '{"Build-your-own bowl","Juice cleanse add-ons","Macro-friendly portions"}', true, '2025-11-06 21:12:51.434723+00', '2026-02-13 01:23:11.046475+00'),
	('74d9b417-367d-4242-a4b5-78fc89ff49f6', 'harvest-hearth-kitchen', 'Harvest & Hearth Kitchen', 'healthy', 'farm-to-table', '{vegetarian,healthy}', 'high', 4.60, 38, '2026-02-13 02:33:11.046475+00', 4.50, 'Roasted Squash Grain Bowl', 'Free dessert with orders over $40', 'https://images.unsplash.com/photo-1528712306091-ed0763094c98?auto=format&fit=crop&w=1600&q=80', '892 Hearthstone Ave, Maitland, FL', '407-555-0188', '{"Seasonal produce","Chef-curated pairings","Craft mocktails"}', true, '2025-11-06 21:12:51.434723+00', '2026-02-13 01:23:11.046475+00'),
	('f0bda605-5fec-42e8-a333-9ba59dd64174', 'noodle-express', 'Noodle Express', 'asian', 'thai', '{spicy}', 'medium', 4.40, 35, '2026-02-13 03:13:11.046475+00', 3.25, 'Drunken Noodles', '2 entrees for $20', 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1600&q=80', '512 Spice Lane, Altamonte Springs, FL', '407-555-0165', '{"Hand-pulled noodles","Late-night happy hour","Thai iced tea combos"}', true, '2025-11-06 21:12:51.434723+00', '2026-02-13 01:23:11.046475+00'),
	('2ce19b88-19e9-459f-bf6c-c99cee250b3e', 'brick-oven-slice', 'Brick Oven Slice', 'comfort', 'pizza', '{vegetarian}', 'low', 4.20, 29, '2026-02-13 03:23:11.046475+00', 1.50, 'Grandma Square Pie', 'Family meal $24.99', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1600&q=80', '75 Brickstone Plaza, Orlando, FL', '407-555-0177', '{"Wood-fired crust","By-the-slice classics","Overnight dough ferment"}', true, '2025-11-06 21:12:51.434723+00', '2026-02-13 01:23:11.046475+00'),
	('ecc3f603-5ba1-466a-b79e-0005818d7fcf', 'bombay-spice-house', 'Bombay Spice House', 'asian', 'indian', '{healthy,high-protein,spicy,vegetarian}', 'medium', 4.80, 25, '2026-02-13 23:30:00+00', 2.49, 'Butter Chicken', '15% off orders over $30', 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=1600&q=80', '789 Curry Lane, Orlando, FL 32801', '(407) 555-0789', NULL, true, '2026-02-13 01:20:02.017012+00', '2026-02-13 01:20:02.017012+00');


--
-- Data for Name: fc_carts; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."fc_carts" ("id", "profile_id", "restaurant_id", "status", "subtotal", "created_at", "updated_at") VALUES
	('8e7ae9cf-6479-4169-a736-c126cd7ecf08', '00000000-0000-0000-0000-0000000000fc', '3bb63c3a-6fa9-42ad-8a2a-1b843745a4b4', 'ordered', 31.45, '2026-02-13 03:46:46.596907+00', '2026-02-13 16:13:32.298+00'),
	('9bd8cf23-8389-4341-a79e-477f56c38e35', '00000000-0000-0000-0000-0000000000fc', '3bb63c3a-6fa9-42ad-8a2a-1b843745a4b4', 'ordered', 31.45, '2026-02-13 03:46:46.602688+00', '2026-02-13 16:38:23.353+00'),
	('1a9e5537-c5db-4d4f-aebf-bc7d26e8b923', '00000000-0000-0000-0000-0000000000fc', '3bb63c3a-6fa9-42ad-8a2a-1b843745a4b4', 'ordered', 7.95, '2026-02-13 16:42:20.408678+00', '2026-02-13 16:42:41.03+00'),
	('2fc3ac6a-410b-4db4-9552-9aa98bdb11d5', '00000000-0000-0000-0000-0000000000fc', '3bb63c3a-6fa9-42ad-8a2a-1b843745a4b4', 'ordered', 12.50, '2026-02-13 18:36:07.403503+00', '2026-02-13 18:36:27.903+00');


--
-- Data for Name: fc_menu_sections; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."fc_menu_sections" ("id", "restaurant_id", "name", "description", "display_order", "is_active", "created_at", "updated_at") VALUES
	('0d0a1bce-67ef-4bb7-8ffd-d52a4bde06e3', '3bb63c3a-6fa9-42ad-8a2a-1b843745a4b4', 'Appetizers & Starters', 'Caribbean-style appetizers to start your meal', 1, true, '2026-02-13 01:23:52.656647+00', '2026-02-13 01:23:52.656647+00'),
	('cb69c53c-50a6-4a70-968d-904492b27ef7', '3bb63c3a-6fa9-42ad-8a2a-1b843745a4b4', 'Main Dishes', 'Authentic Caribbean entrées and specialties', 2, true, '2026-02-13 01:23:52.656647+00', '2026-02-13 01:23:52.656647+00'),
	('4b4139d6-e647-42b8-95cc-d03f3c141f0a', '3bb63c3a-6fa9-42ad-8a2a-1b843745a4b4', 'Sides & Beverages', 'Traditional sides and refreshing drinks', 3, true, '2026-02-13 01:23:52.656647+00', '2026-02-13 01:23:52.656647+00'),
	('67ce86ff-91ff-49b1-9dd6-a355d0f68ddb', 'f0bda605-5fec-42e8-a333-9ba59dd64174', 'Noodle Dishes', 'Authentic Thai noodle specialties', 1, true, '2026-02-13 01:32:12.659657+00', '2026-02-13 01:32:12.659657+00'),
	('5fdb2bfd-b22e-4141-8af2-105fb7acfbef', 'f0bda605-5fec-42e8-a333-9ba59dd64174', 'Curries & Rice', 'Traditional curries with jasmine rice', 2, true, '2026-02-13 01:32:12.659657+00', '2026-02-13 01:32:12.659657+00'),
	('1a401d61-099b-421d-9159-3fb34664f6cd', 'f0bda605-5fec-42e8-a333-9ba59dd64174', 'Appetizers & Salads', 'Fresh starters and Thai salads', 3, true, '2026-02-13 01:32:12.659657+00', '2026-02-13 01:32:12.659657+00'),
	('95ebcf29-535f-4aad-b3e5-93459986fc20', 'b1b340a9-48c9-44a7-a4db-68a312b8d521', 'Power Bowls', 'Nutrient-packed bowls with superfoods', 1, true, '2026-02-13 01:32:12.659657+00', '2026-02-13 01:32:12.659657+00'),
	('51bef98d-3fc1-4ef7-91fe-f73e94c38d97', 'b1b340a9-48c9-44a7-a4db-68a312b8d521', 'Fresh Salads', 'Organic greens and seasonal vegetables', 2, true, '2026-02-13 01:32:12.659657+00', '2026-02-13 01:32:12.659657+00'),
	('3caaffaa-2f4e-45b6-be50-d3cc523de3ba', 'b1b340a9-48c9-44a7-a4db-68a312b8d521', 'Smoothies & Juices', 'Cold-pressed juices and protein smoothies', 3, true, '2026-02-13 01:32:12.659657+00', '2026-02-13 01:32:12.659657+00'),
	('2e04ba17-7655-4b7d-bccf-a58da89dbe49', '74d9b417-367d-4242-a4b5-78fc89ff49f6', 'Farm Fresh Mains', 'Seasonal dishes with local ingredients', 1, true, '2026-02-13 01:32:23.411201+00', '2026-02-13 01:32:23.411201+00'),
	('ccae79c1-30ca-4ca0-bf1e-f17f197a70c4', '74d9b417-367d-4242-a4b5-78fc89ff49f6', 'Garden Starters', 'Fresh appetizers from our garden', 2, true, '2026-02-13 01:32:23.411201+00', '2026-02-13 01:32:23.411201+00'),
	('c97144e0-b14c-4821-9081-efdd60b2c193', '74d9b417-367d-4242-a4b5-78fc89ff49f6', 'Hearth Sides', 'Artisanal sides and seasonal vegetables', 3, true, '2026-02-13 01:32:23.411201+00', '2026-02-13 01:32:23.411201+00'),
	('fa026916-8ab9-43cf-b9bb-0bbc7971608c', 'c711070d-8016-434c-b260-162fb23430ed', 'Tacos & Quesadillas', 'Authentic Mexican street food favorites', 1, true, '2026-02-13 01:32:23.411201+00', '2026-02-13 01:32:23.411201+00'),
	('a07bfac2-31f0-4700-9cff-a7cf1afa0ca9', 'c711070d-8016-434c-b260-162fb23430ed', 'Entrees', 'Traditional Mexican main dishes', 2, true, '2026-02-13 01:32:23.411201+00', '2026-02-13 01:32:23.411201+00'),
	('e6eb903f-5e46-441f-8a4d-1f795c34e526', 'c711070d-8016-434c-b260-162fb23430ed', 'Sides & Appetizers', 'Mexican sides and starter plates', 3, true, '2026-02-13 01:32:23.411201+00', '2026-02-13 01:32:23.411201+00'),
	('013dbf9d-f278-46b5-a794-828d1bb8312c', 'ecc3f603-5ba1-466a-b79e-0005818d7fcf', 'Curries & Masalas', 'Rich and aromatic curry dishes', 1, true, '2026-02-13 01:39:15.089953+00', '2026-02-13 01:39:15.089953+00'),
	('4b8fcde9-ae51-470e-b9ad-caa18cd3f43b', 'ecc3f603-5ba1-466a-b79e-0005818d7fcf', 'Tandoor Specialties', 'Clay oven grilled meats and breads', 2, true, '2026-02-13 01:39:15.089953+00', '2026-02-13 01:39:15.089953+00'),
	('c1dc2e04-30e7-4ab9-a32d-d530483d97d4', 'ecc3f603-5ba1-466a-b79e-0005818d7fcf', 'Rice & Biryani', 'Fragrant basmati rice dishes', 3, true, '2026-02-13 01:39:15.089953+00', '2026-02-13 01:39:15.089953+00'),
	('41e52427-a7d8-406b-9979-832b374791d6', '74d9b417-367d-4242-a4b5-78fc89ff49f6', 'Artisan Desserts', 'House-made desserts with seasonal ingredients', 4, true, '2026-02-13 01:43:33.272135+00', '2026-02-13 01:43:33.272135+00'),
	('88c6a934-390d-4847-9322-84c5c261d693', '3bb63c3a-6fa9-42ad-8a2a-1b843745a4b4', 'Sweet Endings', 'Traditional Caribbean and tropical desserts', 4, true, '2026-02-13 01:43:33.272135+00', '2026-02-13 01:43:33.272135+00');


--
-- Data for Name: fc_menu_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."fc_menu_items" ("id", "restaurant_id", "section_id", "slug", "name", "description", "base_price", "image_url", "dietary_tags", "allergen_info", "calories", "prep_time_minutes", "is_available", "is_popular", "display_order", "created_at", "updated_at", "image") VALUES
	('6ebf5f00-0a47-4897-a9ca-8700c3d1a926', '3bb63c3a-6fa9-42ad-8a2a-1b843745a4b4', '0d0a1bce-67ef-4bb7-8ffd-d52a4bde06e3', 'plantain-chips', 'Plantain Chips', 'Crispy fried plantains with spicy mojo sauce', 8.95, NULL, '{appetizer,crispy,spicy,gluten-free}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:26:36.741248+00', '2026-02-13 01:26:36.741248+00', NULL),
	('e5d12473-cbb1-4b8f-8c2c-a4a058df80aa', '3bb63c3a-6fa9-42ad-8a2a-1b843745a4b4', 'cb69c53c-50a6-4a70-968d-904492b27ef7', 'jerk-chicken', 'Jerk Chicken', 'Grilled chicken with authentic jerk seasoning', 18.95, NULL, '{main,chicken,spicy,high-protein}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:26:46.910963+00', '2026-02-13 01:26:46.910963+00', NULL),
	('eebe7db7-3197-4229-989f-73c88ce425ab', '3bb63c3a-6fa9-42ad-8a2a-1b843745a4b4', 'cb69c53c-50a6-4a70-968d-904492b27ef7', 'curry-goat', 'Curry Goat', 'Tender goat slow-cooked in Caribbean curry spices', 22.95, NULL, '{main,curry,spicy,high-protein}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:26:46.910963+00', '2026-02-13 01:26:46.910963+00', NULL),
	('d23ff2c1-18ef-4c87-b670-6237e2d5d8b5', '3bb63c3a-6fa9-42ad-8a2a-1b843745a4b4', 'cb69c53c-50a6-4a70-968d-904492b27ef7', 'grilled-mahi-mahi', 'Grilled Mahi Mahi', 'Fresh fish with tropical fruit salsa', 24.95, NULL, '{main,seafood,healthy,high-protein}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:26:46.910963+00', '2026-02-13 01:26:46.910963+00', NULL),
	('3f92834c-8b70-411c-999f-c0f1d471c46a', '3bb63c3a-6fa9-42ad-8a2a-1b843745a4b4', '4b4139d6-e647-42b8-95cc-d03f3c141f0a', 'rice-and-peas', 'Rice & Peas', 'Traditional coconut rice with kidney beans', 6.95, NULL, '{side,vegetarian,gluten-free}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:26:54.075216+00', '2026-02-13 01:26:54.075216+00', NULL),
	('d09e577a-7ea8-424c-915f-1acc7b8e1555', '3bb63c3a-6fa9-42ad-8a2a-1b843745a4b4', '4b4139d6-e647-42b8-95cc-d03f3c141f0a', 'festival', 'Festival', 'Sweet fried dumplings (pair of 2)', 4.95, NULL, '{side,vegetarian,sweet}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:26:54.075216+00', '2026-02-13 01:26:54.075216+00', NULL),
	('eaa1e778-ca8e-4534-9ff1-a7b2af9964da', 'f0bda605-5fec-42e8-a333-9ba59dd64174', '67ce86ff-91ff-49b1-9dd6-a355d0f68ddb', 'pad-thai', 'Pad Thai', 'Traditional stir-fried rice noodles with tamarind sauce', 16.95, NULL, '{noodles,spicy,high-protein}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:36:41.314227+00', '2026-02-13 01:36:41.314227+00', NULL),
	('378af4ea-3672-4030-bc5c-b3dc895fb407', 'f0bda605-5fec-42e8-a333-9ba59dd64174', '67ce86ff-91ff-49b1-9dd6-a355d0f68ddb', 'drunken-noodles', 'Drunken Noodles', 'Wide rice noodles with basil and chilies', 17.95, NULL, '{noodles,spicy,high-protein}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:36:41.314227+00', '2026-02-13 01:36:41.314227+00', NULL),
	('df1f1e26-edf5-41c2-9c46-3dc4a15efa5f', 'f0bda605-5fec-42e8-a333-9ba59dd64174', '5fdb2bfd-b22e-4141-8af2-105fb7acfbef', 'green-curry-chicken', 'Green Curry Chicken', 'Creamy coconut curry with Thai basil', 18.95, NULL, '{curry,spicy,high-protein}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:36:41.314227+00', '2026-02-13 01:36:41.314227+00', NULL),
	('883a05fe-00a6-4cb9-8440-72ddd5e490fc', 'f0bda605-5fec-42e8-a333-9ba59dd64174', '5fdb2bfd-b22e-4141-8af2-105fb7acfbef', 'massaman-beef', 'Massaman Beef', 'Rich and mild curry with potatoes', 21.95, NULL, '{curry,mild,high-protein}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:37:31.612158+00', '2026-02-13 01:37:31.612158+00', NULL),
	('39915a35-dc41-4bf9-9f03-c80682ee2fd9', 'f0bda605-5fec-42e8-a333-9ba59dd64174', '1a401d61-099b-421d-9159-3fb34664f6cd', 'som-tam-salad', 'Som Tam Salad', 'Spicy green papaya salad with lime', 12.95, NULL, '{salad,spicy,healthy,gluten-free}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:37:31.612158+00', '2026-02-13 01:37:31.612158+00', NULL),
	('e720646e-272e-47b0-b1fd-31ee35a933b8', 'f0bda605-5fec-42e8-a333-9ba59dd64174', '1a401d61-099b-421d-9159-3fb34664f6cd', 'chicken-satay', 'Chicken Satay', '5pc grilled chicken skewers with peanut sauce', 14.95, NULL, '{appetizer,high-protein,grilled}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:37:31.612158+00', '2026-02-13 01:37:31.612158+00', NULL),
	('12cc54f4-7d26-4986-9690-ef8073849fb4', 'b1b340a9-48c9-44a7-a4db-68a312b8d521', '95ebcf29-535f-4aad-b3e5-93459986fc20', 'quinoa-power-bowl', 'Quinoa Power Bowl', 'Quinoa, roasted vegetables, avocado, tahini dressing', 16.95, NULL, '{bowl,vegetarian,healthy,high-protein,gluten-free}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:38:59.023943+00', '2026-02-13 01:38:59.023943+00', NULL),
	('c9cf8f18-156c-4688-a7f4-5df857449a4c', 'b1b340a9-48c9-44a7-a4db-68a312b8d521', '95ebcf29-535f-4aad-b3e5-93459986fc20', 'buddha-bowl', 'Buddha Bowl', 'Brown rice, chickpeas, kale, sweet potato, hemp seeds', 15.95, NULL, '{bowl,vegan,healthy,high-protein}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:38:59.023943+00', '2026-02-13 01:38:59.023943+00', NULL),
	('0375454e-dbf4-47c6-bcf2-7c1b01faf9e3', 'b1b340a9-48c9-44a7-a4db-68a312b8d521', '95ebcf29-535f-4aad-b3e5-93459986fc20', 'acai-berry-bowl', 'Acai Berry Bowl', 'Acai base with granola, fresh berries, coconut', 14.95, NULL, '{bowl,vegan,healthy,antioxidants}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:38:59.023943+00', '2026-02-13 01:38:59.023943+00', NULL),
	('009c7405-3250-4f0a-b3e3-bc35079c19b3', 'b1b340a9-48c9-44a7-a4db-68a312b8d521', '51bef98d-3fc1-4ef7-91fe-f73e94c38d97', 'kale-caesar-salad', 'Kale Caesar Salad', 'Massaged kale, cashew parmesan, hemp croutons', 14.95, NULL, '{salad,vegetarian,healthy,high-protein}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:38:59.023943+00', '2026-02-13 01:38:59.023943+00', NULL),
	('b4e59453-8fe9-4c09-99fe-be81e961b4cf', 'b1b340a9-48c9-44a7-a4db-68a312b8d521', '51bef98d-3fc1-4ef7-91fe-f73e94c38d97', 'rainbow-veggie-salad', 'Rainbow Veggie Salad', 'Mixed greens, rainbow vegetables, lemon vinaigrette', 13.95, NULL, '{salad,vegan,healthy,gluten-free}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:38:59.023943+00', '2026-02-13 01:38:59.023943+00', NULL),
	('248f233b-5662-41a5-ab7c-5a7237922bce', 'b1b340a9-48c9-44a7-a4db-68a312b8d521', '3caaffaa-2f4e-45b6-be50-d3cc523de3ba', 'green-goddess-smoothie', 'Green Goddess Smoothie', 'Spinach, mango, pineapple, coconut water, protein', 9.95, NULL, '{smoothie,vegan,healthy,high-protein}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:38:59.023943+00', '2026-02-13 01:38:59.023943+00', NULL),
	('ae5194b5-e5a4-4c26-bc8a-721b9bdb051c', 'b1b340a9-48c9-44a7-a4db-68a312b8d521', '3caaffaa-2f4e-45b6-be50-d3cc523de3ba', 'cold-pressed-green-juice', 'Cold-Pressed Green Juice', 'Kale, cucumber, celery, apple, ginger, lemon', 8.95, NULL, '{juice,vegan,healthy,detox}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:38:59.023943+00', '2026-02-13 01:38:59.023943+00', NULL),
	('a4fb3ecf-9e47-4eef-8e23-b61073b01c5a', '74d9b417-367d-4242-a4b5-78fc89ff49f6', '2e04ba17-7655-4b7d-bccf-a58da89dbe49', 'grass-fed-beef-steak', 'Grass-Fed Beef Steak', 'Local grass-fed sirloin with seasonal vegetables', 28.95, NULL, '{steak,grass-fed,high-protein,local}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:38:59.028006+00', '2026-02-13 01:38:59.028006+00', NULL),
	('cb07d33b-0cf4-45e9-9f51-e96748442467', '74d9b417-367d-4242-a4b5-78fc89ff49f6', '2e04ba17-7655-4b7d-bccf-a58da89dbe49', 'farm-chicken-breast', 'Farm Chicken Breast', 'Free-range chicken with herb roasted potatoes', 24.95, NULL, '{chicken,free-range,healthy,high-protein}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:38:59.028006+00', '2026-02-13 01:38:59.028006+00', NULL),
	('7d8c0dbd-2e76-4700-9d9e-e3f7f603d721', '74d9b417-367d-4242-a4b5-78fc89ff49f6', '2e04ba17-7655-4b7d-bccf-a58da89dbe49', 'pan-seared-salmon', 'Pan-Seared Salmon', 'Wild-caught salmon with quinoa and green vegetables', 26.95, NULL, '{salmon,wild-caught,healthy,high-protein}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:38:59.028006+00', '2026-02-13 01:38:59.028006+00', NULL),
	('7e63271d-3234-4c78-8236-a40f1d620d37', '74d9b417-367d-4242-a4b5-78fc89ff49f6', 'ccae79c1-30ca-4ca0-bf1e-f17f197a70c4', 'farm-fresh-salad', 'Farm Fresh Salad', 'Mixed greens from our garden with seasonal toppings', 12.95, NULL, '{salad,vegetarian,healthy,local}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:38:59.028006+00', '2026-02-13 01:38:59.028006+00', NULL),
	('b2309351-f787-4d4f-92e9-ff15fa280c3e', '74d9b417-367d-4242-a4b5-78fc89ff49f6', 'ccae79c1-30ca-4ca0-bf1e-f17f197a70c4', 'roasted-beet-hummus', 'Roasted Beet Hummus', 'House-made hummus with garden vegetables', 10.95, NULL, '{appetizer,vegetarian,healthy}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:38:59.028006+00', '2026-02-13 01:38:59.028006+00', NULL),
	('f0fcda4d-48f3-47f4-8517-6681d154c494', '74d9b417-367d-4242-a4b5-78fc89ff49f6', 'c97144e0-b14c-4821-9081-efdd60b2c193', 'roasted-root-vegetables', 'Roasted Root Vegetables', 'Seasonal root vegetables roasted in herbs', 8.95, NULL, '{side,vegetarian,healthy,local}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:38:59.028006+00', '2026-02-13 01:38:59.028006+00', NULL),
	('08034323-d951-44aa-8e0c-dbe832176fb0', '74d9b417-367d-4242-a4b5-78fc89ff49f6', 'c97144e0-b14c-4821-9081-efdd60b2c193', 'quinoa-pilaf', 'Quinoa Pilaf', 'Herbed quinoa with toasted nuts and dried fruit', 7.95, NULL, '{side,vegetarian,healthy,high-protein}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:38:59.028006+00', '2026-02-13 01:38:59.028006+00', NULL),
	('1d746764-17b1-46ca-84b8-e710b0678d9a', 'c711070d-8016-434c-b260-162fb23430ed', 'fa026916-8ab9-43cf-b9bb-0bbc7971608c', 'carne-asada-tacos', 'Carne Asada Tacos', '3 grilled steak tacos with onions and cilantro', 16.95, NULL, '{tacos,beef,high-protein,gluten-free}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:38:59.028673+00', '2026-02-13 01:38:59.028673+00', NULL),
	('ee9f7df6-5a37-494e-a6ce-432515238f37', 'c711070d-8016-434c-b260-162fb23430ed', 'fa026916-8ab9-43cf-b9bb-0bbc7971608c', 'chicken-quesadilla', 'Chicken Quesadilla', 'Grilled chicken, cheese, peppers in flour tortilla', 14.95, NULL, '{quesadilla,chicken,high-protein}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:38:59.028673+00', '2026-02-13 01:38:59.028673+00', NULL),
	('dfb7e2a1-b5ef-443c-ad3d-150ff5c7eba8', 'c711070d-8016-434c-b260-162fb23430ed', 'fa026916-8ab9-43cf-b9bb-0bbc7971608c', 'fish-tacos', 'Fish Tacos', '3 blackened fish tacos with cabbage slaw', 17.95, NULL, '{tacos,fish,healthy,high-protein}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:38:59.028673+00', '2026-02-13 01:38:59.028673+00', NULL),
	('8d70bb4e-552a-498e-b2be-36fdae3855ef', 'c711070d-8016-434c-b260-162fb23430ed', 'a07bfac2-31f0-4700-9cff-a7cf1afa0ca9', 'chicken-fajitas', 'Chicken Fajitas', 'Sizzling chicken with peppers and onions', 19.95, NULL, '{entree,chicken,high-protein,gluten-free}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:38:59.028673+00', '2026-02-13 01:38:59.028673+00', NULL),
	('3c7331aa-d209-41f2-830e-a84a0a8797b5', 'c711070d-8016-434c-b260-162fb23430ed', 'a07bfac2-31f0-4700-9cff-a7cf1afa0ca9', 'carnitas-bowl', 'Carnitas Bowl', 'Slow-cooked pork with rice, beans, and toppings', 18.95, NULL, '{bowl,pork,high-protein}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:38:59.028673+00', '2026-02-13 01:38:59.028673+00', NULL),
	('29822c98-bb0e-43d7-9b15-cf9fee27a40e', 'c711070d-8016-434c-b260-162fb23430ed', 'e6eb903f-5e46-441f-8a4d-1f795c34e526', 'guacamole-and-chips', 'Guacamole & Chips', 'Fresh guacamole with warm tortilla chips', 9.95, NULL, '{appetizer,vegetarian,gluten-free}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:38:59.028673+00', '2026-02-13 01:38:59.028673+00', NULL),
	('e106e7c5-1a83-41b5-a7dd-efdb297b7825', 'c711070d-8016-434c-b260-162fb23430ed', 'e6eb903f-5e46-441f-8a4d-1f795c34e526', 'black-beans-and-rice', 'Black Beans & Rice', 'Seasoned black beans with cilantro lime rice', 6.95, NULL, '{side,vegetarian,high-protein}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:38:59.028673+00', '2026-02-13 01:38:59.028673+00', NULL),
	('9e5600ae-3a0d-47cd-a8bd-1a30f04cc623', 'ecc3f603-5ba1-466a-b79e-0005818d7fcf', '013dbf9d-f278-46b5-a794-828d1bb8312c', 'butter-chicken', 'Butter Chicken', 'Tender chicken in creamy tomato curry sauce', 19.95, NULL, '{curry,chicken,mild,high-protein}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:40:24.888639+00', '2026-02-13 01:40:24.888639+00', NULL),
	('f7cea9fe-0aa1-4b76-9156-d66a0d783cd6', 'ecc3f603-5ba1-466a-b79e-0005818d7fcf', '013dbf9d-f278-46b5-a794-828d1bb8312c', 'lamb-vindaloo', 'Lamb Vindaloo', 'Spicy lamb curry with potatoes and vinegar', 23.95, NULL, '{curry,lamb,spicy,high-protein}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:40:24.888639+00', '2026-02-13 01:40:24.888639+00', NULL),
	('27dba466-937c-41b7-b560-9cb81a2a86be', 'ecc3f603-5ba1-466a-b79e-0005818d7fcf', '013dbf9d-f278-46b5-a794-828d1bb8312c', 'palak-paneer', 'Palak Paneer', 'Fresh spinach curry with cottage cheese', 16.95, NULL, '{curry,vegetarian,healthy,high-protein}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:40:24.888639+00', '2026-02-13 01:40:24.888639+00', NULL),
	('481443fa-b114-4a68-b1d1-84d20319318b', 'ecc3f603-5ba1-466a-b79e-0005818d7fcf', '4b8fcde9-ae51-470e-b9ad-caa18cd3f43b', 'tandoori-chicken-bombay', 'Tandoori Chicken', 'Half chicken marinated in yogurt and spices', 22.95, NULL, '{tandoor,chicken,spicy,high-protein}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:41:23.774398+00', '2026-02-13 01:41:23.774398+00', NULL),
	('537c1b4a-860f-45d0-a144-dad10f0739cf', '74d9b417-367d-4242-a4b5-78fc89ff49f6', '41e52427-a7d8-406b-9979-832b374791d6', 'seasonal-fruit-tart', 'Seasonal Fruit Tart', 'Vanilla custard tart with seasonal farm-fresh fruit', 8.95, NULL, '{dessert,vegetarian,contains-dairy,seasonal}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:43:58.600542+00', '2026-02-13 01:43:58.600542+00', NULL),
	('705f3227-149b-4f8f-8143-c5a7862ae01b', '3bb63c3a-6fa9-42ad-8a2a-1b843745a4b4', '88c6a934-390d-4847-9322-84c5c261d693', 'rum-cake-caribbean', 'Rum Cake', 'Traditional Caribbean rum cake with vanilla glaze', 7.95, NULL, '{dessert,contains-alcohol,caribbean}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:44:07.701833+00', '2026-02-13 16:41:58.017+00', 'https://images.pexels.com/photos/26076163/pexels-photo-26076163.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
	('cbc83e75-b56a-4726-a132-1de6f5ef0eea', '3bb63c3a-6fa9-42ad-8a2a-1b843745a4b4', '0d0a1bce-67ef-4bb7-8ffd-d52a4bde06e3', 'coconut-shrimp', 'Coconut Shrimp', 'Jumbo shrimp in coconut flakes with pineapple chutney', 12.50, NULL, '{appetizer,seafood,high-protein}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:26:36.741248+00', '2026-02-13 01:26:36.741248+00', 'https://images.pexels.com/photos/30750651/pexels-photo-30750651.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
	('d32de6ea-2702-47d0-8906-2e253d4bd4f4', '74d9b417-367d-4242-a4b5-78fc89ff49f6', '41e52427-a7d8-406b-9979-832b374791d6', 'classic-cheesecake-harvest', 'Classic New York Cheesecake', 'Rich cheesecake with graham cracker crust, topped with chocolate drizzle and fresh berries', 9.95, NULL, '{dessert,vegetarian,contains-dairy,chocolate-drizzle}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:43:58.600542+00', '2026-02-13 01:43:58.600542+00', 'https://images.pexels.com/photos/33987758/pexels-photo-33987758.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
	('6e07b7fc-6f20-4426-98f3-6655f765b3f9', '3bb63c3a-6fa9-42ad-8a2a-1b843745a4b4', '88c6a934-390d-4847-9322-84c5c261d693', 'tropical-cheesecake-caribbean', 'Tropical Coconut Cheesecake', 'Creamy coconut cheesecake with lime zest and mango puree, no chocolate', 9.95, NULL, '{dessert,vegetarian,coconut,tropical,no-chocolate}', NULL, NULL, NULL, true, false, 0, '2026-02-13 01:44:07.701833+00', '2026-02-13 01:44:07.701833+00', 'https://images.pexels.com/photos/30750651/pexels-photo-30750651.jpeg?auto=compress&cs=tinysrgb&h=650&w=940');


--
-- Data for Name: fc_cart_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."fc_cart_items" ("id", "cart_id", "menu_item_id", "quantity", "base_price", "total_price", "instructions", "created_at", "updated_at") VALUES
	('0c014c99-ad14-4c69-aa89-09dfa38860d1', '8e7ae9cf-6479-4169-a736-c126cd7ecf08', 'e5d12473-cbb1-4b8f-8c2c-a4a058df80aa', 1, 18.95, 18.95, NULL, '2026-02-13 16:13:32.285483+00', '2026-02-13 16:13:32.285483+00'),
	('bbc4e06c-c62c-43ac-94d5-57c6e057be42', '8e7ae9cf-6479-4169-a736-c126cd7ecf08', 'cbc83e75-b56a-4726-a132-1de6f5ef0eea', 1, 12.50, 12.50, NULL, '2026-02-13 16:13:32.284991+00', '2026-02-13 16:13:32.284991+00'),
	('ca836ea1-54a4-4af3-bb5f-33624fdd3c26', '9bd8cf23-8389-4341-a79e-477f56c38e35', 'e5d12473-cbb1-4b8f-8c2c-a4a058df80aa', 1, 18.95, 18.95, NULL, '2026-02-13 16:38:04.945052+00', '2026-02-13 16:38:04.945052+00'),
	('f048bad2-72ab-4a27-a087-dfa103d72cb6', '9bd8cf23-8389-4341-a79e-477f56c38e35', 'cbc83e75-b56a-4726-a132-1de6f5ef0eea', 1, 12.50, 12.50, NULL, '2026-02-13 16:38:04.945994+00', '2026-02-13 16:38:04.945994+00'),
	('ab184091-2a00-4720-ad77-31e667ea8b5e', '1a9e5537-c5db-4d4f-aebf-bc7d26e8b923', '705f3227-149b-4f8f-8143-c5a7862ae01b', 1, 7.95, 7.95, NULL, '2026-02-13 16:42:20.420284+00', '2026-02-13 16:42:20.420284+00'),
	('c4aa5683-ff3d-4913-8d07-53f44b5c7e57', '2fc3ac6a-410b-4db4-9552-9aa98bdb11d5', 'cbc83e75-b56a-4726-a132-1de6f5ef0eea', 1, 12.50, 12.50, NULL, '2026-02-13 18:36:07.413665+00', '2026-02-13 18:36:07.413665+00');


--
-- Data for Name: fc_menu_item_option_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: fc_menu_item_option_choices; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: fc_cart_item_options; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: fc_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: fc_feedback; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: fc_layouts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: fc_order_events; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: fc_order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: fc_order_item_options; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: fc_preferences; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: mvnte_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: mvnte_parental_controls; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: mvnte_preferences; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: mvnte_titles; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: mvnte_view_history; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- PostgreSQL database dump complete
--

RESET ALL;
