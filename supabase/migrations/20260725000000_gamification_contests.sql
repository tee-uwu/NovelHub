-- ============================================================
-- Gamification, In-line Comments, and Contests Migration
-- ============================================================

-- 1. Add Gamification columns to Profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS xp INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_streak INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_read_date TIMESTAMPTZ;

-- 2. Add paragraph_index to Comments
ALTER TABLE public.comments
ADD COLUMN IF NOT EXISTS paragraph_index INT;

-- 3. Create Contests Table
CREATE TABLE IF NOT EXISTS public.contests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  prize TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create Contest Entries Table
CREATE TABLE IF NOT EXISTS public.contest_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  novel_id UUID NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT contest_entries_novel_unique UNIQUE (contest_id, novel_id)
);

-- RLS for Contests
GRANT SELECT ON public.contests TO anon, authenticated;
GRANT ALL ON public.contests TO service_role;

ALTER TABLE public.contests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contests are viewable by everyone"
  ON public.contests FOR SELECT USING (true);

CREATE POLICY "Only admins can manage contests"
  ON public.contests FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));


-- RLS for Contest Entries
GRANT SELECT ON public.contest_entries TO anon, authenticated;
GRANT INSERT, DELETE ON public.contest_entries TO authenticated;
GRANT ALL ON public.contest_entries TO service_role;

ALTER TABLE public.contest_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contest entries are viewable by everyone"
  ON public.contest_entries FOR SELECT USING (true);

CREATE POLICY "Authors can enter their own novels"
  ON public.contest_entries FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.novels WHERE id = novel_id AND author_id = auth.uid()));

CREATE POLICY "Authors can remove their entries"
  ON public.contest_entries FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage contest entries"
  ON public.contest_entries FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Trigger for contest_entries (No updated_at needed)

-- 5. RPC for Updating Reading Streak
CREATE OR REPLACE FUNCTION public.update_reading_streak(user_uuid UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_read TIMESTAMPTZ;
  v_current_streak INT;
  v_longest_streak INT;
  v_today DATE := (now() AT TIME ZONE 'UTC')::DATE;
  v_last_date DATE;
BEGIN
  -- Get user's current streak info
  SELECT last_read_date, current_streak, longest_streak 
  INTO v_last_read, v_current_streak, v_longest_streak
  FROM public.profiles
  WHERE id = user_uuid;

  IF v_last_read IS NULL THEN
    -- First time reading
    UPDATE public.profiles
    SET 
      last_read_date = now(),
      current_streak = 1,
      longest_streak = GREATEST(longest_streak, 1),
      xp = xp + 50
    WHERE id = user_uuid;
  ELSE
    v_last_date := (v_last_read AT TIME ZONE 'UTC')::DATE;

    IF v_last_date = v_today THEN
      -- Already read today, just add a small amount of XP, cap it if you want, but for now just 10 XP
      UPDATE public.profiles
      SET xp = xp + 10
      WHERE id = user_uuid;
    ELSIF v_last_date = v_today - INTERVAL '1 day' THEN
      -- Read yesterday, increment streak
      UPDATE public.profiles
      SET 
        last_read_date = now(),
        current_streak = current_streak + 1,
        longest_streak = GREATEST(longest_streak, current_streak + 1),
        xp = xp + 50
      WHERE id = user_uuid;
    ELSE
      -- Missed a day or more, reset streak
      UPDATE public.profiles
      SET 
        last_read_date = now(),
        current_streak = 1,
        longest_streak = GREATEST(longest_streak, 1),
        xp = xp + 50
      WHERE id = user_uuid;
    END IF;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_reading_streak(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_reading_streak(UUID) TO authenticated;
