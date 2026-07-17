-- ============================================================
--  NovelHub — Full Schema Migration
--  Paste this entire file into the Supabase SQL Editor and
--  click "Run" to set up all tables, policies, and seed data.
-- ============================================================

-- ─── Enable extensions ────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- fast ilike search on title/synopsis

-- ─── ENUM types ───────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE novel_status AS ENUM ('draft', 'ongoing', 'completed', 'hiatus');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE library_status AS ENUM ('reading', 'saved', 'finished');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'new_chapter', 'new_comment', 'new_review', 'new_follower',
    'new_like', 'community_post', 'mention'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── NOVELS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.novels (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  slug          TEXT NOT NULL,
  synopsis      TEXT,
  genre         TEXT,
  tags          TEXT[] DEFAULT '{}',
  cover_url     TEXT,
  status        novel_status NOT NULL DEFAULT 'ongoing',
  is_featured   BOOLEAN NOT NULL DEFAULT false,
  is_certified  BOOLEAN NOT NULL DEFAULT false,
  view_count    BIGINT NOT NULL DEFAULT 0,
  chapter_count INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT novels_slug_unique UNIQUE (slug)
);

CREATE INDEX IF NOT EXISTS novels_genre_idx       ON public.novels (genre);
CREATE INDEX IF NOT EXISTS novels_featured_idx    ON public.novels (is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS novels_certified_idx   ON public.novels (is_certified) WHERE is_certified = true;
CREATE INDEX IF NOT EXISTS novels_view_count_idx  ON public.novels (view_count DESC);
CREATE INDEX IF NOT EXISTS novels_title_trgm_idx  ON public.novels USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS novels_synopsis_trgm_idx ON public.novels USING gin (synopsis gin_trgm_ops);

GRANT SELECT ON public.novels TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.novels TO authenticated;
GRANT ALL ON public.novels TO service_role;

ALTER TABLE public.novels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Novels are viewable by everyone"
  ON public.novels FOR SELECT USING (true);

CREATE POLICY "Authors can insert their own novels"
  ON public.novels FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own novels"
  ON public.novels FOR UPDATE TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete their own novels"
  ON public.novels FOR DELETE TO authenticated
  USING (auth.uid() = author_id);

CREATE TRIGGER novels_set_updated_at
  BEFORE UPDATE ON public.novels
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── CHAPTERS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chapters (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  novel_id       UUID NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
  chapter_number INT NOT NULL,
  title          TEXT NOT NULL,
  content        TEXT NOT NULL DEFAULT '',
  word_count     INT NOT NULL DEFAULT 0,
  published_at   TIMESTAMPTZ DEFAULT now(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chapters_novel_chapter_unique UNIQUE (novel_id, chapter_number)
);

CREATE INDEX IF NOT EXISTS chapters_novel_idx ON public.chapters (novel_id, chapter_number ASC);

GRANT SELECT ON public.chapters TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chapters TO authenticated;
GRANT ALL ON public.chapters TO service_role;

ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chapters are viewable by everyone"
  ON public.chapters FOR SELECT USING (true);

CREATE POLICY "Novel authors can insert chapters"
  ON public.chapters FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.novels WHERE id = novel_id AND author_id = auth.uid())
  );

CREATE POLICY "Novel authors can update chapters"
  ON public.chapters FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.novels WHERE id = novel_id AND author_id = auth.uid())
  );

CREATE POLICY "Novel authors can delete chapters"
  ON public.chapters FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.novels WHERE id = novel_id AND author_id = auth.uid())
  );

CREATE TRIGGER chapters_set_updated_at
  BEFORE UPDATE ON public.chapters
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-maintain chapter_count on novels
CREATE OR REPLACE FUNCTION public.sync_chapter_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.novels SET chapter_count = chapter_count + 1 WHERE id = NEW.novel_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.novels SET chapter_count = GREATEST(0, chapter_count - 1) WHERE id = OLD.novel_id;
  END IF;
  RETURN NULL;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.sync_chapter_count() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER chapters_sync_count
  AFTER INSERT OR DELETE ON public.chapters
  FOR EACH ROW EXECUTE FUNCTION public.sync_chapter_count();

-- ─── REVIEWS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reviews (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  novel_id   UUID NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating     SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content    TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT reviews_user_novel_unique UNIQUE (user_id, novel_id)
);

CREATE INDEX IF NOT EXISTS reviews_novel_idx ON public.reviews (novel_id);
CREATE INDEX IF NOT EXISTS reviews_user_idx  ON public.reviews (user_id);

GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert reviews"
  ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
  ON public.reviews FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
  ON public.reviews FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER reviews_set_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── COMMENTS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS comments_chapter_idx ON public.comments (chapter_id, created_at DESC);

GRANT SELECT ON public.comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone"
  ON public.comments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert comments"
  ON public.comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON public.comments FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.comments FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER comments_set_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── LIBRARY ITEMS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.library_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  novel_id        UUID NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
  status          library_status NOT NULL DEFAULT 'saved',
  current_chapter INT NOT NULL DEFAULT 0,
  progress        NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT library_user_novel_unique UNIQUE (user_id, novel_id)
);

CREATE INDEX IF NOT EXISTS library_user_idx  ON public.library_items (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS library_novel_idx ON public.library_items (novel_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.library_items TO authenticated;
GRANT ALL ON public.library_items TO service_role;

ALTER TABLE public.library_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own library"
  ON public.library_items FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their own library"
  ON public.library_items FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own library items"
  ON public.library_items FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own library items"
  ON public.library_items FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER library_items_set_updated_at
  BEFORE UPDATE ON public.library_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── COMMUNITIES ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.communities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  created_by  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tags        TEXT[] DEFAULT '{}',
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS communities_created_at_idx ON public.communities (created_at DESC);

GRANT SELECT ON public.communities TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.communities TO authenticated;
GRANT ALL ON public.communities TO service_role;

ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Communities are viewable by everyone"
  ON public.communities FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create communities"
  ON public.communities FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update their communities"
  ON public.communities FOR UPDATE TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Creators can delete their communities"
  ON public.communities FOR DELETE TO authenticated
  USING (auth.uid() = created_by);

CREATE TRIGGER communities_set_updated_at
  BEFORE UPDATE ON public.communities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── COMMUNITY MEMBERS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.community_members (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT community_members_unique UNIQUE (community_id, user_id)
);

CREATE INDEX IF NOT EXISTS cm_community_idx ON public.community_members (community_id);
CREATE INDEX IF NOT EXISTS cm_user_idx      ON public.community_members (user_id);

GRANT SELECT ON public.community_members TO anon;
GRANT SELECT, INSERT, DELETE ON public.community_members TO authenticated;
GRANT ALL ON public.community_members TO service_role;

ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Community members are viewable by everyone"
  ON public.community_members FOR SELECT USING (true);

CREATE POLICY "Authenticated users can join communities"
  ON public.community_members FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave communities"
  ON public.community_members FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ─── COMMUNITY POSTS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.community_posts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cp_community_idx ON public.community_posts (community_id, created_at DESC);

GRANT SELECT ON public.community_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_posts TO authenticated;
GRANT ALL ON public.community_posts TO service_role;

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Community posts are viewable by everyone"
  ON public.community_posts FOR SELECT USING (true);

CREATE POLICY "Authenticated users can post in communities"
  ON public.community_posts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
  ON public.community_posts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
  ON public.community_posts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER community_posts_set_updated_at
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── LIKES (polymorphic) ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.likes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  likeable_type TEXT NOT NULL CHECK (likeable_type IN ('review', 'comment', 'post')),
  likeable_id   UUID NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT likes_unique UNIQUE (user_id, likeable_type, likeable_id)
);

CREATE INDEX IF NOT EXISTS likes_likeable_idx ON public.likes (likeable_type, likeable_id);
CREATE INDEX IF NOT EXISTS likes_user_idx     ON public.likes (user_id);

GRANT SELECT ON public.likes TO anon;
GRANT SELECT, INSERT, DELETE ON public.likes TO authenticated;
GRANT ALL ON public.likes TO service_role;

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes are viewable by everyone"
  ON public.likes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like"
  ON public.likes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike"
  ON public.likes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ─── FOLLOWS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.follows (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT follows_unique UNIQUE (follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS follows_follower_idx  ON public.follows (follower_id);
CREATE INDEX IF NOT EXISTS follows_following_idx ON public.follows (following_id);

GRANT SELECT ON public.follows TO anon;
GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
GRANT ALL ON public.follows TO service_role;

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follows are viewable by everyone"
  ON public.follows FOR SELECT USING (true);

CREATE POLICY "Authenticated users can follow"
  ON public.follows FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON public.follows FOR DELETE TO authenticated
  USING (auth.uid() = follower_id);

-- ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  type       notification_type NOT NULL,
  entity_id  UUID,
  message    TEXT NOT NULL,
  is_read    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_idx  ON public.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_unread_idx ON public.notifications (user_id, is_read) WHERE is_read = false;

GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can mark their own notifications as read"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- ─── RPC: increment_view_count ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_view_count(novel_uuid UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.novels
  SET view_count = view_count + 1
  WHERE id = novel_uuid;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.increment_view_count(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_view_count(UUID) TO authenticated;

-- ─── RPC: get_novel_rating ────────────────────────────────────────────────────
-- Returns average rating and review count for a novel
CREATE OR REPLACE FUNCTION public.get_novel_rating(novel_uuid UUID)
RETURNS TABLE (avg_rating NUMERIC, review_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
    SELECT ROUND(AVG(rating)::NUMERIC, 1), COUNT(*)
    FROM public.reviews
    WHERE novel_id = novel_uuid;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.get_novel_rating(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_novel_rating(UUID) TO anon, authenticated;

-- ─── SEED DATA ────────────────────────────────────────────────────────────────
-- Creates a system/bot author profile and inserts sample novels + communities.
-- Safe to run multiple times (uses INSERT ... ON CONFLICT DO NOTHING).

DO $$
DECLARE
  seed_author_id UUID := '00000000-0000-0000-0000-000000000001';
  novel_lotm     UUID;
  novel_rezero   UUID;
  novel_tbate    UUID;
  novel_orv      UUID;
  novel_tcf      UUID;
  novel_solo     UUID;
  novel_scls     UUID;
  novel_extra    UUID;
  novel_sclr     UUID;
  comm_fantasy   UUID;
  comm_mystery   UUID;
  comm_romance   UUID;
  comm_isekai    UUID;
BEGIN

  -- Seed author profile (safe — only if auth.users row exists is NOT required for seed;
  -- we insert directly using service_role context)
  INSERT INTO public.profiles (id, display_name, bio)
  VALUES (seed_author_id, 'NovelHub Staff', 'Official NovelHub seed account.')
  ON CONFLICT (id) DO NOTHING;

  -- ── Novels ──────────────────────────────────────────────────────────────────

  INSERT INTO public.novels
    (id, author_id, title, slug, synopsis, genre, tags, status, is_featured, is_certified, view_count, chapter_count)
  VALUES
    (gen_random_uuid(), seed_author_id,
     'Lord of the Mysteries',
     'lord-of-the-mysteries',
     'With the rising tide of steam power and machinery, who can come close to being a Beyonder? Shrouded in the fog of history and darkness, who or what is the lurking evil that murmurs into our ears? Waking up to be Zhou Mingrui, Klein Moretti finds himself in an unfamiliar world.',
     'Fantasy', ARRAY['Mystery','Steampunk','Lovecraftian'], 'completed', true, true, 4200000, 1432)
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO novel_lotm;

  INSERT INTO public.novels
    (id, author_id, title, slug, synopsis, genre, tags, status, is_featured, is_certified, view_count, chapter_count)
  VALUES
    (gen_random_uuid(), seed_author_id,
     'Re:ZERO — Starting Life in Another World',
     're-zero-starting-life-in-another-world',
     'When Subaru Natsuki leaves the convenience store, the last thing he expects is to be wrenched from his everyday life and dropped into a fantasy world.',
     'Isekai', ARRAY['Time Loop','Drama','Fantasy'], 'ongoing', true, false, 3100000, 300)
  ON CONFLICT (slug) DO NOTHING;

  INSERT INTO public.novels
    (id, author_id, title, slug, synopsis, genre, tags, status, is_featured, is_certified, view_count, chapter_count)
  VALUES
    (gen_random_uuid(), seed_author_id,
     'The Beginning After The End',
     'the-beginning-after-the-end',
     'King Grey has unrivaled strength, wealth, and prestige in a world governed by martial ability — yet solitude lingers behind great power.',
     'Fantasy', ARRAY['Reincarnation','Action','Magic'], 'ongoing', true, false, 2900000, 400)
  ON CONFLICT (slug) DO NOTHING;

  INSERT INTO public.novels
    (id, author_id, title, slug, synopsis, genre, tags, status, is_featured, is_certified, view_count, chapter_count)
  VALUES
    (gen_random_uuid(), seed_author_id,
     'Omniscient Reader''s Viewpoint',
     'omniscient-readers-viewpoint',
     'Dokja has been reading a web novel for over a decade. Then the story becomes reality — and he''s the only one who knows how it ends.',
     'Fantasy', ARRAY['Apocalypse','System','Meta'], 'completed', false, true, 3800000, 551)
  ON CONFLICT (slug) DO NOTHING;

  INSERT INTO public.novels
    (id, author_id, title, slug, synopsis, genre, tags, status, is_featured, is_certified, view_count, chapter_count)
  VALUES
    (gen_random_uuid(), seed_author_id,
     'Trash of the Count''s Family',
     'trash-of-the-counts-family',
     'Transmigrated into a novel as the trashy third son of a fallen noble, he must rebuild the family before the story''s tragic ending arrives.',
     'Isekai', ARRAY['Comedy','Transmigration','Nobles'], 'ongoing', false, true, 2400000, 900)
  ON CONFLICT (slug) DO NOTHING;

  INSERT INTO public.novels
    (id, author_id, title, slug, synopsis, genre, tags, status, is_featured, is_certified, view_count, chapter_count)
  VALUES
    (gen_random_uuid(), seed_author_id,
     'Solo Leveling',
     'solo-leveling',
     'The weakest hunter of mankind gains a mysterious system that lets him level up without limit.',
     'Action', ARRAY['System','Gates','Hunter'], 'completed', false, true, 3500000, 270)
  ON CONFLICT (slug) DO NOTHING;

  INSERT INTO public.novels
    (id, author_id, title, slug, synopsis, genre, tags, status, is_featured, is_certified, view_count, chapter_count)
  VALUES
    (gen_random_uuid(), seed_author_id,
     'The S-Classes That I Raised',
     'the-s-classes-that-i-raised',
     'A hunter with no combat ability discovers his true talent — nurturing the world''s strongest S-Class awakeners.',
     'Action', ARRAY['System','Hunter','Support'], 'ongoing', false, true, 2100000, 350)
  ON CONFLICT (slug) DO NOTHING;

  INSERT INTO public.novels
    (id, author_id, title, slug, synopsis, genre, tags, status, is_featured, is_certified, view_count, chapter_count)
  VALUES
    (gen_random_uuid(), seed_author_id,
     'The Novel''s Extra',
     'the-novels-extra',
     'A writer wakes up inside his own unfinished novel — as a nameless extra with knowledge of every plot twist.',
     'Fantasy', ARRAY['Transmigration','Magic School','Meta'], 'completed', false, true, 1900000, 430)
  ON CONFLICT (slug) DO NOTHING;

  INSERT INTO public.novels
    (id, author_id, title, slug, synopsis, genre, tags, status, is_featured, is_certified, view_count, chapter_count)
  VALUES
    (gen_random_uuid(), seed_author_id,
     'Second Life Ranker',
     'second-life-ranker',
     'To avenge his twin brother, Yeon-woo climbs the Tower of the Sun — armed with his brother''s diary and hidden power.',
     'Fantasy', ARRAY['Tower','Action','Revenge'], 'completed', false, true, 2100000, 500)
  ON CONFLICT (slug) DO NOTHING;

  -- ── Chapters for Lord of the Mysteries (sample) ─────────────────────────────
  -- Only seed chapters if the novel was freshly inserted
  SELECT id INTO novel_lotm FROM public.novels WHERE slug = 'lord-of-the-mysteries';

  IF novel_lotm IS NOT NULL THEN
    INSERT INTO public.chapters (novel_id, chapter_number, title, content, word_count, published_at)
    VALUES
      (novel_lotm, 1, 'Crimson Dawn',
       'Lost and penniless, those few words were all he could think of. Well, penniless wasn''t quite right. He did have his wallet in his pocket, and setting aside the fact that he had an abundance of small change and very few notes, it couldn''t be denied that he had his assets on him.

More than enough to go to the nearest mall to do some shopping and eat some lunch. Even so, he could only be called penniless. "Looks like the currency around here is completely different after all…"

Flipping the rare ridged 10 yen coin he was holding, the youth sighed deeply.',
       420, now() - interval '30 days'),

      (novel_lotm, 2, 'The Silent Pact',
       'Klein sat at his desk, quill in hand, staring at the sequence pathway spread before him. The seven bottles gleamed faintly in the candlelight — each one a step closer to the divine, each one a step closer to madness.',
       380, now() - interval '29 days'),

      (novel_lotm, 3, 'Ashes of the Old World',
       'The Nighthawks convened at midnight, their faces hidden beneath wide-brimmed hats. Klein recognized the symbols stitched into their coats — the eye, the key, the crown.',
       440, now() - interval '28 days'),

      (novel_lotm, 4, 'Whispers in the Fog',
       'In the tavern by the docks, a rumor spread: someone had seen a Beyonder walking through walls in the merchant district. Klein sipped his coffee and pretended not to notice the way every Nighthawk in the room had gone still.',
       390, now() - interval '27 days')
    ON CONFLICT (novel_id, chapter_number) DO NOTHING;
  END IF;

  -- ── Communities ─────────────────────────────────────────────────────────────
  INSERT INTO public.communities (name, description, created_by, tags)
  VALUES
    ('Fantasy Novel Lovers',
     'A community for fans of fantasy novels to share, discuss, and discover amazing stories.',
     seed_author_id, ARRAY['Fantasy','Discussion'])
  ON CONFLICT DO NOTHING;

  INSERT INTO public.communities (name, description, created_by, tags)
  VALUES
    ('Mystery Solvers',
     'Share theories, discuss plot twists, and solve puzzles together.',
     seed_author_id, ARRAY['Mystery','Thriller'])
  ON CONFLICT DO NOTHING;

  INSERT INTO public.communities (name, description, created_by, tags)
  VALUES
    ('Romance Readers',
     'Share your favorite couples, discuss tropes, and find new books.',
     seed_author_id, ARRAY['Romance','Contemporary'])
  ON CONFLICT DO NOTHING;

  INSERT INTO public.communities (name, description, created_by, tags)
  VALUES
    ('Isekai Explorers',
     'Discuss otherworld adventures, power systems, and your favorite transmigrations.',
     seed_author_id, ARRAY['Isekai','Power Systems'])
  ON CONFLICT DO NOTHING;

  -- Seed members for each community (the seed author joins all)
  SELECT id INTO comm_fantasy FROM public.communities WHERE name = 'Fantasy Novel Lovers';
  SELECT id INTO comm_mystery FROM public.communities WHERE name = 'Mystery Solvers';
  SELECT id INTO comm_romance FROM public.communities WHERE name = 'Romance Readers';
  SELECT id INTO comm_isekai  FROM public.communities WHERE name = 'Isekai Explorers';

  IF comm_fantasy IS NOT NULL THEN
    INSERT INTO public.community_members (community_id, user_id) VALUES (comm_fantasy, seed_author_id) ON CONFLICT DO NOTHING;
    INSERT INTO public.community_members (community_id, user_id) VALUES (comm_mystery, seed_author_id) ON CONFLICT DO NOTHING;
    INSERT INTO public.community_members (community_id, user_id) VALUES (comm_romance, seed_author_id) ON CONFLICT DO NOTHING;
    INSERT INTO public.community_members (community_id, user_id) VALUES (comm_isekai,  seed_author_id) ON CONFLICT DO NOTHING;

    -- Sample posts
    INSERT INTO public.community_posts (community_id, user_id, content)
    VALUES
      (comm_fantasy, seed_author_id, 'Just finished reading the latest chapter of "Lord of the Mysteries" and I''m absolutely blown away! The world-building is incredible and the plot twists just keep coming. Who else is reading this masterpiece?'),
      (comm_fantasy, seed_author_id, 'Looking for recommendations similar to "Re:ZERO". I love the time loop concept and the character development. Any suggestions for novels with similar themes?'),
      (comm_fantasy, seed_author_id, 'Just published my first fantasy novel on the platform! It''s been a dream of mine for years. Thank you to this amazing community for all the support during my writing journey.')
    ON CONFLICT DO NOTHING;
  END IF;

END $$;

-- ─── Grant read access to sequence counts ─────────────────────────────────────
-- (community_members aggregate used in useCommunity hook)
GRANT SELECT ON public.community_members TO anon;
