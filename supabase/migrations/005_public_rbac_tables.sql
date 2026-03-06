-- =============================================================================
-- LGU Integrated Management System — Public Schema (RBAC & User Management)
-- Municipality of Carmen
--
-- Tables: pending_users, roles, modules, facilities,
--         user_roles, role_permissions, user_facilities
-- RPC:    get_current_user_super_admin()
--
-- NOTE: Matches the live database schema exactly.
--       user_roles.user_id and user_facilities.user_id reference auth.users(id),
--       not pending_users(id).  role_module_access does NOT exist in this DB.
-- =============================================================================

-- =============================================================================
-- SECTION 1 — CORE TABLES
-- =============================================================================

-- --------------------------
-- PENDING USERS
-- Registration holding table — users land here first, admin confirms.
-- --------------------------
CREATE TABLE IF NOT EXISTS public.pending_users (
  id           UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   TIMESTAMPTZ      DEFAULT now(),
  email        CHARACTER VARYING UNIQUE,
  username     CHARACTER VARYING,
  is_confirmed BOOLEAN          DEFAULT false
);

-- --------------------------
-- ROLES
-- System roles (e.g. Admin, HR Officer, Encoder)
-- --------------------------
CREATE TABLE IF NOT EXISTS public.roles (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  role_code  TEXT,
  role_name  TEXT
);

-- --------------------------
-- MODULES
-- Dynamic sidebar entries — seeded by 002_seed_lgu_modules.sql
-- --------------------------
CREATE TABLE IF NOT EXISTS public.modules (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ DEFAULT now(),
  module_name TEXT,
  route_path  TEXT,
  icons       TEXT,
  is_active   BOOLEAN     DEFAULT true,
  file_path   TEXT,
  category    TEXT
);

-- --------------------------
-- FACILITIES
-- Physical facilities / offices that users can be assigned to
-- --------------------------
CREATE TABLE IF NOT EXISTS public.facilities (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ DEFAULT now(),
  facility_name TEXT,
  is_active     BOOLEAN     DEFAULT true
);

-- =============================================================================
-- SECTION 2 — JUNCTION / ASSIGNMENT TABLES
-- =============================================================================

-- --------------------------
-- USER → ROLES  (user_id → auth.users)
-- --------------------------
CREATE TABLE IF NOT EXISTS public.user_roles (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id    UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id    UUID        REFERENCES public.roles(id) ON DELETE CASCADE,
  CONSTRAINT unique_user_role UNIQUE (user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON public.user_roles USING btree (role_id);

-- --------------------------
-- ROLE → MODULE PERMISSIONS  (fine-grained CRUD per module)
-- --------------------------
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  role_id    UUID    REFERENCES public.roles(id) ON DELETE CASCADE,
  module_id  UUID    REFERENCES public.modules(id) ON DELETE CASCADE,
  can_select BOOLEAN DEFAULT false,
  can_insert BOOLEAN DEFAULT false,
  can_update BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  CONSTRAINT unique_role_module UNIQUE (role_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id   ON public.role_permissions USING btree (role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_module_id ON public.role_permissions USING btree (module_id);

-- --------------------------
-- USER → FACILITIES  (user_id → auth.users)
-- --------------------------
CREATE TABLE IF NOT EXISTS public.user_facilities (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ DEFAULT now(),
  user_id       UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  facilities_id UUID        REFERENCES public.facilities(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_facilities_user_id       ON public.user_facilities USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_user_facilities_facilities_id ON public.user_facilities USING btree (facilities_id);

-- =============================================================================
-- SECTION 3 — RPC FUNCTIONS
-- =============================================================================

-- Returns true if the currently authenticated user has the 'super_admin' role.
-- user_roles.user_id maps directly to auth.uid().
CREATE OR REPLACE FUNCTION public.get_current_user_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_result BOOLEAN := false;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  SELECT EXISTS (
    SELECT 1
      FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
     WHERE ur.user_id = auth.uid()
       AND r.role_code = 'super_admin'
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- =============================================================================
-- SECTION 4 — ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.pending_users  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilities     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_facilities ENABLE ROW LEVEL SECURITY;

-- Read access for all authenticated users
CREATE POLICY "pending_users_r"     ON public.pending_users     FOR SELECT TO authenticated USING (true);
CREATE POLICY "roles_r"             ON public.roles             FOR SELECT TO authenticated USING (true);
CREATE POLICY "modules_r"           ON public.modules           FOR SELECT TO authenticated USING (true);
CREATE POLICY "facilities_r"        ON public.facilities        FOR SELECT TO authenticated USING (true);
CREATE POLICY "user_roles_r"        ON public.user_roles        FOR SELECT TO authenticated USING (true);
CREATE POLICY "role_permissions_r"  ON public.role_permissions  FOR SELECT TO authenticated USING (true);
CREATE POLICY "user_facilities_r"   ON public.user_facilities   FOR SELECT TO authenticated USING (true);

-- Write access for authenticated users (admin enforcement at app layer)
CREATE POLICY "pending_users_w"     ON public.pending_users     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "roles_w"             ON public.roles             FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "modules_w"           ON public.modules           FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "facilities_w"        ON public.facilities        FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "user_roles_w"        ON public.user_roles        FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "role_permissions_w"  ON public.role_permissions  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "user_facilities_w"   ON public.user_facilities   FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Allow anonymous INSERT on pending_users (registration before login)
CREATE POLICY "pending_users_anon_insert" ON public.pending_users FOR INSERT TO anon WITH CHECK (true);

-- =============================================================================
-- SECTION 5 — GRANTS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;
GRANT INSERT ON public.pending_users TO anon;
