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

-- 11. ADMIN RLS OVERRIDES
-- Admins can update and delete novels
DROP POLICY IF EXISTS "Admins can update all novels" ON public.novels;
CREATE POLICY "Admins can update all novels" ON public.novels
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins can delete all novels" ON public.novels;
CREATE POLICY "Admins can delete all novels" ON public.novels
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Admins can update and delete chapters
DROP POLICY IF EXISTS "Admins can update all chapters" ON public.chapters;
CREATE POLICY "Admins can update all chapters" ON public.chapters
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins can delete all chapters" ON public.chapters;
CREATE POLICY "Admins can delete all chapters" ON public.chapters
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Admins can update all profiles
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
```
- -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  
 - -   G a m i f i c a t i o n ,   I n - l i n e   C o m m e n t s ,   a n d   C o n t e s t s   M i g r a t i o n  
 - -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  
  
 - -   1 .   A d d   G a m i f i c a t i o n   c o l u m n s   t o   P r o f i l e s  
 A L T E R   T A B L E   p u b l i c . p r o f i l e s  
 A D D   C O L U M N   I F   N O T   E X I S T S   x p   I N T   N O T   N U L L   D E F A U L T   0 ,  
 A D D   C O L U M N   I F   N O T   E X I S T S   c u r r e n t _ s t r e a k   I N T   N O T   N U L L   D E F A U L T   0 ,  
 A D D   C O L U M N   I F   N O T   E X I S T S   l o n g e s t _ s t r e a k   I N T   N O T   N U L L   D E F A U L T   0 ,  
 A D D   C O L U M N   I F   N O T   E X I S T S   l a s t _ r e a d _ d a t e   T I M E S T A M P T Z ;  
  
 - -   2 .   A d d   p a r a g r a p h _ i n d e x   t o   C o m m e n t s  
 A L T E R   T A B L E   p u b l i c . c o m m e n t s  
 A D D   C O L U M N   I F   N O T   E X I S T S   p a r a g r a p h _ i n d e x   I N T ;  
  
 - -   3 .   C r e a t e   C o n t e s t s   T a b l e  
 C R E A T E   T A B L E   I F   N O T   E X I S T S   p u b l i c . c o n t e s t s   (  
     i d   U U I D   P R I M A R Y   K E Y   D E F A U L T   g e n _ r a n d o m _ u u i d ( ) ,  
     t i t l e   T E X T   N O T   N U L L ,  
     d e s c r i p t i o n   T E X T   N O T   N U L L ,  
     p r i z e   T E X T ,  
     s t a r t _ d a t e   T I M E S T A M P T Z   N O T   N U L L ,  
     e n d _ d a t e   T I M E S T A M P T Z   N O T   N U L L ,  
     s t a t u s   T E X T   N O T   N U L L   D E F A U L T   ' a c t i v e '   C H E C K   ( s t a t u s   I N   ( ' a c t i v e ' ,   ' c o m p l e t e d ' ) ) ,  
     c r e a t e d _ a t   T I M E S T A M P T Z   N O T   N U L L   D E F A U L T   n o w ( ) ,  
     u p d a t e d _ a t   T I M E S T A M P T Z   N O T   N U L L   D E F A U L T   n o w ( )  
 ) ;  
  
 - -   4 .   C r e a t e   C o n t e s t   E n t r i e s   T a b l e  
 C R E A T E   T A B L E   I F   N O T   E X I S T S   p u b l i c . c o n t e s t _ e n t r i e s   (  
     i d   U U I D   P R I M A R Y   K E Y   D E F A U L T   g e n _ r a n d o m _ u u i d ( ) ,  
     c o n t e s t _ i d   U U I D   N O T   N U L L   R E F E R E N C E S   p u b l i c . c o n t e s t s ( i d )   O N   D E L E T E   C A S C A D E ,  
     n o v e l _ i d   U U I D   N O T   N U L L   R E F E R E N C E S   p u b l i c . n o v e l s ( i d )   O N   D E L E T E   C A S C A D E ,  
     u s e r _ i d   U U I D   N O T   N U L L   R E F E R E N C E S   p u b l i c . p r o f i l e s ( i d )   O N   D E L E T E   C A S C A D E ,  
     c r e a t e d _ a t   T I M E S T A M P T Z   N O T   N U L L   D E F A U L T   n o w ( ) ,  
     C O N S T R A I N T   c o n t e s t _ e n t r i e s _ n o v e l _ u n i q u e   U N I Q U E   ( c o n t e s t _ i d ,   n o v e l _ i d )  
 ) ;  
  
 - -   R L S   f o r   C o n t e s t s  
 G R A N T   S E L E C T   O N   p u b l i c . c o n t e s t s   T O   a n o n ,   a u t h e n t i c a t e d ;  
 G R A N T   A L L   O N   p u b l i c . c o n t e s t s   T O   s e r v i c e _ r o l e ;  
  
 A L T E R   T A B L E   p u b l i c . c o n t e s t s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;  
  
 C R E A T E   P O L I C Y   " C o n t e s t s   a r e   v i e w a b l e   b y   e v e r y o n e "  
     O N   p u b l i c . c o n t e s t s   F O R   S E L E C T   U S I N G   ( t r u e ) ;  
  
 C R E A T E   P O L I C Y   " O n l y   a d m i n s   c a n   m a n a g e   c o n t e s t s "  
     O N   p u b l i c . c o n t e s t s   F O R   A L L   T O   a u t h e n t i c a t e d  
     U S I N G   ( E X I S T S   ( S E L E C T   1   F R O M   p u b l i c . p r o f i l e s   W H E R E   i d   =   a u t h . u i d ( )   A N D   r o l e   =   ' a d m i n ' ) )  
     W I T H   C H E C K   ( E X I S T S   ( S E L E C T   1   F R O M   p u b l i c . p r o f i l e s   W H E R E   i d   =   a u t h . u i d ( )   A N D   r o l e   =   ' a d m i n ' ) ) ;  
  
  
 - -   R L S   f o r   C o n t e s t   E n t r i e s  
 G R A N T   S E L E C T   O N   p u b l i c . c o n t e s t _ e n t r i e s   T O   a n o n ,   a u t h e n t i c a t e d ;  
 G R A N T   I N S E R T ,   D E L E T E   O N   p u b l i c . c o n t e s t _ e n t r i e s   T O   a u t h e n t i c a t e d ;  
 G R A N T   A L L   O N   p u b l i c . c o n t e s t _ e n t r i e s   T O   s e r v i c e _ r o l e ;  
  
 A L T E R   T A B L E   p u b l i c . c o n t e s t _ e n t r i e s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;  
  
 C R E A T E   P O L I C Y   " C o n t e s t   e n t r i e s   a r e   v i e w a b l e   b y   e v e r y o n e "  
     O N   p u b l i c . c o n t e s t _ e n t r i e s   F O R   S E L E C T   U S I N G   ( t r u e ) ;  
  
 C R E A T E   P O L I C Y   " A u t h o r s   c a n   e n t e r   t h e i r   o w n   n o v e l s "  
     O N   p u b l i c . c o n t e s t _ e n t r i e s   F O R   I N S E R T   T O   a u t h e n t i c a t e d  
     W I T H   C H E C K   ( a u t h . u i d ( )   =   u s e r _ i d   A N D   E X I S T S   ( S E L E C T   1   F R O M   p u b l i c . n o v e l s   W H E R E   i d   =   n o v e l _ i d   A N D   a u t h o r _ i d   =   a u t h . u i d ( ) ) ) ;  
  
 C R E A T E   P O L I C Y   " A u t h o r s   c a n   r e m o v e   t h e i r   e n t r i e s "  
     O N   p u b l i c . c o n t e s t _ e n t r i e s   F O R   D E L E T E   T O   a u t h e n t i c a t e d  
     U S I N G   ( a u t h . u i d ( )   =   u s e r _ i d ) ;  
  
 C R E A T E   P O L I C Y   " A d m i n s   c a n   m a n a g e   c o n t e s t   e n t r i e s "  
     O N   p u b l i c . c o n t e s t _ e n t r i e s   F O R   A L L   T O   a u t h e n t i c a t e d  
     U S I N G   ( E X I S T S   ( S E L E C T   1   F R O M   p u b l i c . p r o f i l e s   W H E R E   i d   =   a u t h . u i d ( )   A N D   r o l e   =   ' a d m i n ' ) ) ;  
  
 - -   T r i g g e r   f o r   c o n t e s t _ e n t r i e s   ( N o   u p d a t e d _ a t   n e e d e d )  
  
 - -   5 .   R P C   f o r   U p d a t i n g   R e a d i n g   S t r e a k  
 C R E A T E   O R   R E P L A C E   F U N C T I O N   p u b l i c . u p d a t e _ r e a d i n g _ s t r e a k ( u s e r _ u u i d   U U I D )  
 R E T U R N S   V O I D  
 L A N G U A G E   p l p g s q l  
 S E C U R I T Y   D E F I N E R  
 S E T   s e a r c h _ p a t h   =   p u b l i c  
 A S   $ $  
 D E C L A R E  
     v _ l a s t _ r e a d   T I M E S T A M P T Z ;  
     v _ c u r r e n t _ s t r e a k   I N T ;  
     v _ l o n g e s t _ s t r e a k   I N T ;  
     v _ t o d a y   D A T E   : =   ( n o w ( )   A T   T I M E   Z O N E   ' U T C ' ) : : D A T E ;  
     v _ l a s t _ d a t e   D A T E ;  
 B E G I N  
     - -   G e t   u s e r ' s   c u r r e n t   s t r e a k   i n f o  
     S E L E C T   l a s t _ r e a d _ d a t e ,   c u r r e n t _ s t r e a k ,   l o n g e s t _ s t r e a k    
     I N T O   v _ l a s t _ r e a d ,   v _ c u r r e n t _ s t r e a k ,   v _ l o n g e s t _ s t r e a k  
     F R O M   p u b l i c . p r o f i l e s  
     W H E R E   i d   =   u s e r _ u u i d ;  
  
     I F   v _ l a s t _ r e a d   I S   N U L L   T H E N  
         - -   F i r s t   t i m e   r e a d i n g  
         U P D A T E   p u b l i c . p r o f i l e s  
         S E T    
             l a s t _ r e a d _ d a t e   =   n o w ( ) ,  
             c u r r e n t _ s t r e a k   =   1 ,  
             l o n g e s t _ s t r e a k   =   G R E A T E S T ( l o n g e s t _ s t r e a k ,   1 ) ,  
             x p   =   x p   +   5 0  
         W H E R E   i d   =   u s e r _ u u i d ;  
     E L S E  
         v _ l a s t _ d a t e   : =   ( v _ l a s t _ r e a d   A T   T I M E   Z O N E   ' U T C ' ) : : D A T E ;  
  
         I F   v _ l a s t _ d a t e   =   v _ t o d a y   T H E N  
             - -   A l r e a d y   r e a d   t o d a y ,   j u s t   a d d   a   s m a l l   a m o u n t   o f   X P ,   c a p   i t   i f   y o u   w a n t ,   b u t   f o r   n o w   j u s t   1 0   X P  
             U P D A T E   p u b l i c . p r o f i l e s  
             S E T   x p   =   x p   +   1 0  
             W H E R E   i d   =   u s e r _ u u i d ;  
         E L S I F   v _ l a s t _ d a t e   =   v _ t o d a y   -   I N T E R V A L   ' 1   d a y '   T H E N  
             - -   R e a d   y e s t e r d a y ,   i n c r e m e n t   s t r e a k  
             U P D A T E   p u b l i c . p r o f i l e s  
             S E T    
                 l a s t _ r e a d _ d a t e   =   n o w ( ) ,  
                 c u r r e n t _ s t r e a k   =   c u r r e n t _ s t r e a k   +   1 ,  
                 l o n g e s t _ s t r e a k   =   G R E A T E S T ( l o n g e s t _ s t r e a k ,   c u r r e n t _ s t r e a k   +   1 ) ,  
                 x p   =   x p   +   5 0  
             W H E R E   i d   =   u s e r _ u u i d ;  
         E L S E  
             - -   M i s s e d   a   d a y   o r   m o r e ,   r e s e t   s t r e a k  
             U P D A T E   p u b l i c . p r o f i l e s  
             S E T    
                 l a s t _ r e a d _ d a t e   =   n o w ( ) ,  
                 c u r r e n t _ s t r e a k   =   1 ,  
                 l o n g e s t _ s t r e a k   =   G R E A T E S T ( l o n g e s t _ s t r e a k ,   1 ) ,  
                 x p   =   x p   +   5 0  
             W H E R E   i d   =   u s e r _ u u i d ;  
         E N D   I F ;  
     E N D   I F ;  
 E N D ;  
 $ $ ;  
  
 R E V O K E   E X E C U T E   O N   F U N C T I O N   p u b l i c . u p d a t e _ r e a d i n g _ s t r e a k ( U U I D )   F R O M   P U B L I C ,   a n o n ;  
 G R A N T   E X E C U T E   O N   F U N C T I O N   p u b l i c . u p d a t e _ r e a d i n g _ s t r e a k ( U U I D )   T O   a u t h e n t i c a t e d ;  
 