# Supabase SQL Additions for Roles & Collaborations

> **How to use**: Copy the entire SQL block below and paste it into your Supabase Dashboard → SQL Editor → New Query → Run.

```sql
-- ============================================================
-- NovelHub Schema Additions: Roles, Collaborations & Chat
-- ============================================================

-- 1. ENUMS & COLUMN ALTERATIONS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('reader', 'author', 'illustrator', 'editor', 'admin');
  END IF;
END
$$;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role public.user_role NOT NULL DEFAULT 'reader';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS badges TEXT[] NOT NULL DEFAULT '{}';

-- Enforce unique usernames (display_name)
ALTER TABLE public.profiles ADD CONSTRAINT unique_display_name UNIQUE (display_name);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_status') THEN
    CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');
  END IF;
END
$$;

ALTER TABLE public.novels ADD COLUMN IF NOT EXISTS approval_status public.approval_status NOT NULL DEFAULT 'pending';
ALTER TABLE public.novels ADD COLUMN IF NOT EXISTS is_editors_choice BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.collab_ads ADD COLUMN IF NOT EXISTS payment_type TEXT NOT NULL DEFAULT 'volunteer';
ALTER TABLE public.collab_ads ADD COLUMN IF NOT EXISTS payment_amount TEXT;

-- Add visual illustrations columns to chapters
ALTER TABLE public.chapters ADD COLUMN IF NOT EXISTS featured_images TEXT[] NOT NULL DEFAULT '{}';

-- 2. HELPER: Ban Checking Function
CREATE OR REPLACE FUNCTION public.is_banned(u_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT is_banned FROM public.profiles WHERE id = u_id;
$$;

-- 3. COLLABORATORS TABLE
CREATE TABLE IF NOT EXISTS public.collaborations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  novel_id UUID NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.user_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(novel_id, user_id)
);

ALTER TABLE public.collaborations ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON public.collaborations TO authenticated;
GRANT SELECT ON public.collaborations TO anon;
GRANT ALL ON public.collaborations TO service_role;

DROP POLICY IF EXISTS "Collabs are public select" ON public.collaborations;
CREATE POLICY "Collabs are public select" ON public.collaborations
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Novel owners can add collaborators" ON public.collaborations;
CREATE POLICY "Novel owners can add collaborators" ON public.collaborations
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.novels WHERE id = novel_id AND author_id = auth.uid())
  );

DROP POLICY IF EXISTS "Novel owners can remove collaborators" ON public.collaborations;
CREATE POLICY "Novel owners can remove collaborators" ON public.collaborations
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.novels WHERE id = novel_id AND author_id = auth.uid())
  );

-- 4. COLLAB ADS (Job Board Advertisements)
CREATE TABLE IF NOT EXISTS public.collab_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  novel_id UUID REFERENCES public.novels(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  role_needed public.user_role NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.collab_ads ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collab_ads TO authenticated;
GRANT SELECT ON public.collab_ads TO anon;
GRANT ALL ON public.collab_ads TO service_role;

DROP POLICY IF EXISTS "Ads are public select" ON public.collab_ads;
CREATE POLICY "Ads are public select" ON public.collab_ads
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authors can insert ads" ON public.collab_ads;
CREATE POLICY "Authors can insert ads" ON public.collab_ads
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = author_id AND NOT public.is_banned(auth.uid())
  );

DROP POLICY IF EXISTS "Authors can update/delete their own ads" ON public.collab_ads;
CREATE POLICY "Authors can update/delete their own ads" ON public.collab_ads
  FOR ALL TO authenticated USING (auth.uid() = author_id);

-- 5. COLLAB APPLICATIONS (Interest signals)
CREATE TABLE IF NOT EXISTS public.collab_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES public.collab_ads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(ad_id, user_id)
);

ALTER TABLE public.collab_applications ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collab_applications TO authenticated;
GRANT ALL ON public.collab_applications TO service_role;

DROP POLICY IF EXISTS "Applicants can select/insert their own apps" ON public.collab_applications;
CREATE POLICY "Applicants can select/insert their own apps" ON public.collab_applications
  FOR ALL TO authenticated USING (
    auth.uid() = user_id OR EXISTS (
      SELECT 1 FROM public.collab_ads WHERE id = ad_id AND author_id = auth.uid()
    )
  );

-- 6. DIRECT MESSAGING (Chat rooms)
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_room_participants (
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (room_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.chat_rooms, public.chat_room_participants, public.chat_messages TO authenticated;

-- Policies for chat_rooms
DROP POLICY IF EXISTS "Select rooms you participate in" ON public.chat_rooms;
CREATE POLICY "Select rooms you participate in" ON public.chat_rooms
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.chat_room_participants WHERE room_id = id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Anyone can create rooms" ON public.chat_rooms;
CREATE POLICY "Anyone can create rooms" ON public.chat_rooms
  FOR INSERT TO authenticated WITH CHECK (true);

-- Policies for chat_room_participants
DROP POLICY IF EXISTS "Manage participants of rooms you participate in" ON public.chat_room_participants;
DROP POLICY IF EXISTS "Select participants of rooms you participate in" ON public.chat_room_participants;
CREATE POLICY "Select participants of rooms you participate in" ON public.chat_room_participants
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.chat_room_participants p WHERE p.room_id = room_id AND p.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Anyone can insert participants" ON public.chat_room_participants;
CREATE POLICY "Anyone can insert participants" ON public.chat_room_participants
  FOR INSERT TO authenticated WITH CHECK (true);

-- Policies for chat_messages
DROP POLICY IF EXISTS "Manage messages in your rooms" ON public.chat_messages;
DROP POLICY IF EXISTS "Select messages in your rooms" ON public.chat_messages;
CREATE POLICY "Select messages in your rooms" ON public.chat_messages
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.chat_room_participants WHERE room_id = chat_messages.room_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Insert messages in your rooms" ON public.chat_messages;
CREATE POLICY "Insert messages in your rooms" ON public.chat_messages
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = sender_id AND EXISTS (
      SELECT 1 FROM public.chat_room_participants WHERE room_id = chat_messages.room_id AND user_id = auth.uid()
    )
  );

-- 7. TRIGGER: Upgrade Reader to Author when writing a novel
CREATE OR REPLACE FUNCTION public.upgrade_to_author()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET role = 'author'
  WHERE id = NEW.author_id AND role = 'reader';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_novel_created_upgrade_author') THEN
    CREATE TRIGGER on_novel_created_upgrade_author
      AFTER INSERT ON public.novels
      FOR EACH ROW EXECUTE FUNCTION public.upgrade_to_author();
  END IF;
END
$$;

-- 8. UPDATE RLS: Approved or own novels only
DROP POLICY IF EXISTS "Novels are viewable by everyone" ON public.novels;
CREATE POLICY "Novels are viewable by everyone" ON public.novels
  FOR SELECT USING (
    approval_status = 'approved' 
    OR auth.uid() = author_id 
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 9. SEED ENHANCEMENT: Mark existing seeded novels as approved and authors as author role
UPDATE public.novels SET approval_status = 'approved';
UPDATE public.profiles SET role = 'author' WHERE id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003'
);

-- 10. NOVEL VIEWS UNIQUE TRACKING
CREATE TABLE IF NOT EXISTS public.novel_views (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  novel_id UUID NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, novel_id)
);

ALTER TABLE public.novel_views ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.novel_views TO authenticated;

CREATE OR REPLACE FUNCTION public.track_novel_view()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.novels
  SET view_count = view_count + 1
  WHERE id = NEW.novel_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_novel_view_inserted ON public.novel_views;
CREATE TRIGGER on_novel_view_inserted
  AFTER INSERT ON public.novel_views
  FOR EACH ROW EXECUTE FUNCTION public.track_novel_view();

CREATE OR REPLACE FUNCTION public.increment_view_count(novel_uuid UUID)
RETURNS VOID AS $$
DECLARE
  curr_user UUID;
BEGIN
  curr_user := auth.uid();
  IF curr_user IS NOT NULL THEN
    INSERT INTO public.novel_views (user_id, novel_id) 
    VALUES (curr_user, novel_uuid)
    ON CONFLICT (user_id, novel_id) DO NOTHING;
  ELSE
    UPDATE public.novels
    SET view_count = view_count + 1
    WHERE id = novel_uuid;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```
