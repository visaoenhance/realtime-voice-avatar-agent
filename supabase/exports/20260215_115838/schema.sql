

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
