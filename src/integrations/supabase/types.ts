export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      contests: {
        Row: {
          id: string
          title: string
          description: string
          prize: string
          status: string
          start_date: string
          end_date: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          prize: string
          status?: string
          start_date: string
          end_date: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          prize?: string
          status?: string
          start_date?: string
          end_date?: string
          created_at?: string
        }
        Relationships: []
      }
      contest_entries: {
        Row: {
          id: string
          contest_id: string
          novel_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          contest_id: string
          novel_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          contest_id?: string
          novel_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_entries_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contest_entries_novel_id_fkey"
            columns: ["novel_id"]
            isOneToOne: false
            referencedRelation: "novels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contest_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string
          id: string
          updated_at: string
          role: Database["public"]["Enums"]["user_role"]
          is_banned: boolean
          is_verified: boolean
          badges: string[]
          xp: number
          current_streak: number
          longest_streak: number
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name: string
          id: string
          updated_at?: string
          role?: Database["public"]["Enums"]["user_role"]
          is_banned?: boolean
          is_verified?: boolean
          badges?: string[]
          xp?: number
          current_streak?: number
          longest_streak?: number
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
          role?: Database["public"]["Enums"]["user_role"]
          is_banned?: boolean
          is_verified?: boolean
          badges?: string[]
          xp?: number
          current_streak?: number
          longest_streak?: number
        }
        Relationships: []
      }
      novels: {
        Row: {
          id: string
          author_id: string
          title: string
          slug: string
          synopsis: string
          genre: string
          tags: string[]
          status: Database["public"]["Enums"]["novel_status"]
          cover_color: string | null
          cover_url: string | null
          is_featured: boolean
          is_certified: boolean
          view_count: number
          created_at: string
          updated_at: string
          approval_status: Database["public"]["Enums"]["approval_status"]
          is_editors_choice: boolean
        }
        Insert: {
          id?: string
          author_id: string
          title: string
          slug: string
          synopsis?: string
          genre?: string
          tags?: string[]
          status?: Database["public"]["Enums"]["novel_status"]
          cover_color?: string | null
          cover_url?: string | null
          is_featured?: boolean
          is_certified?: boolean
          view_count?: number
          created_at?: string
          updated_at?: string
          approval_status?: Database["public"]["Enums"]["approval_status"]
          is_editors_choice?: boolean
        }
        Update: {
          id?: string
          author_id?: string
          title?: string
          slug?: string
          synopsis?: string
          genre?: string
          tags?: string[]
          status?: Database["public"]["Enums"]["novel_status"]
          cover_color?: string | null
          cover_url?: string | null
          is_featured?: boolean
          is_certified?: boolean
          view_count?: number
          created_at?: string
          updated_at?: string
          approval_status?: Database["public"]["Enums"]["approval_status"]
          is_editors_choice?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "novels_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      chapters: {
        Row: {
          id: string
          novel_id: string
          chapter_number: number
          title: string
          content: string
          word_count: number
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          novel_id: string
          chapter_number: number
          title: string
          content?: string
          word_count?: number
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          novel_id?: string
          chapter_number?: number
          title?: string
          content?: string
          word_count?: number
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapters_novel_id_fkey"
            columns: ["novel_id"]
            isOneToOne: false
            referencedRelation: "novels"
            referencedColumns: ["id"]
          }
        ]
      }
      reviews: {
        Row: {
          id: string
          novel_id: string
          user_id: string
          rating: number
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          novel_id: string
          user_id: string
          rating: number
          content?: string
          created_at?: string
        }
        Update: {
          id?: string
          novel_id?: string
          user_id?: string
          rating?: number
          content?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_novel_id_fkey"
            columns: ["novel_id"]
            referencedRelation: "novels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      comments: {
        Row: {
          id: string
          chapter_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          chapter_id: string
          user_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          chapter_id?: string
          user_id?: string
          content?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_chapter_id_fkey"
            columns: ["chapter_id"]
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      library_items: {
        Row: {
          id: string
          user_id: string
          novel_id: string
          status: Database["public"]["Enums"]["library_status"]
          current_chapter: number
          progress: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          novel_id: string
          status?: Database["public"]["Enums"]["library_status"]
          current_chapter?: number
          progress?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          novel_id?: string
          status?: Database["public"]["Enums"]["library_status"]
          current_chapter?: number
          progress?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_items_novel_id_fkey"
            columns: ["novel_id"]
            referencedRelation: "novels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "library_items_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      likes: {
        Row: {
          id: string
          user_id: string
          likeable_type: Database["public"]["Enums"]["likeable_type"]
          likeable_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          likeable_type: Database["public"]["Enums"]["likeable_type"]
          likeable_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          likeable_type?: Database["public"]["Enums"]["likeable_type"]
          likeable_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      communities: {
        Row: {
          id: string
          name: string
          description: string
          created_by: string
          tags: string[]
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          created_by: string
          tags?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          created_by?: string
          tags?: string[]
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "communities_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      community_members: {
        Row: {
          id: string
          community_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          id?: string
          community_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          id?: string
          community_id?: string
          user_id?: string
          joined_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_members_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      community_posts: {
        Row: {
          id: string
          community_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          community_id: string
          user_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          community_id?: string
          user_id?: string
          content?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_community_id_fkey"
            columns: ["community_id"]
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_posts_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          link: string | null
          is_read: boolean
          actor_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type?: string
          title: string
          message?: string
          link?: string | null
          is_read?: boolean
          actor_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          link?: string | null
          is_read?: boolean
          actor_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      collaborations: {
        Row: {
          id: string
          novel_id: string
          user_id: string
          role: Database["public"]["Enums"]["user_role"]
          created_at: string
        }
        Insert: {
          id?: string
          novel_id: string
          user_id: string
          role: Database["public"]["Enums"]["user_role"]
          created_at?: string
        }
        Update: {
          id?: string
          novel_id?: string
          user_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaborations_novel_id_fkey"
            columns: ["novel_id"]
            referencedRelation: "novels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborations_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      collab_ads: {
        Row: {
          id: string
          author_id: string
          novel_id: string | null
          title: string
          description: string
          role_needed: Database["public"]["Enums"]["user_role"]
          status: string
          created_at: string
          payment_type: string
          payment_amount: string | null
        }
        Insert: {
          id?: string
          author_id: string
          novel_id?: string | null
          title: string
          description: string
          role_needed: Database["public"]["Enums"]["user_role"]
          status?: string
          created_at?: string
          payment_type?: string
          payment_amount?: string | null
        }
        Update: {
          id?: string
          author_id?: string
          novel_id?: string | null
          title?: string
          description?: string
          role_needed?: Database["public"]["Enums"]["user_role"]
          status?: string
          created_at?: string
          payment_type?: string
          payment_amount?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collab_ads_author_id_fkey"
            columns: ["author_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collab_ads_novel_id_fkey"
            columns: ["novel_id"]
            referencedRelation: "novels"
            referencedColumns: ["id"]
          }
        ]
      }
      collab_applications: {
        Row: {
          id: string
          ad_id: string
          user_id: string
          message: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          ad_id: string
          user_id: string
          message: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          ad_id?: string
          user_id?: string
          message?: string
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collab_applications_ad_id_fkey"
            columns: ["ad_id"]
            referencedRelation: "collab_ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collab_applications_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      chat_rooms: {
        Row: {
          id: string
          created_at: string
        }
        Insert: {
          id?: string
          created_at?: string
        }
        Update: {
          id?: string
          created_at?: string
        }
        Relationships: []
      }
      chat_room_participants: {
        Row: {
          room_id: string
          user_id: string
        }
        Insert: {
          room_id: string
          user_id: string
        }
        Update: {
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_room_participants_room_id_fkey"
            columns: ["room_id"]
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_room_participants_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      chat_messages: {
        Row: {
          id: string
          room_id: string
          sender_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          sender_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          sender_id?: string
          content?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
        update_reading_streak: {
          Args: {
            p_user_id: string
          }
          Returns: void
        }
      get_like_count: {
        Args: {
          p_type: Database["public"]["Enums"]["likeable_type"]
          p_id: string
        }
        Returns: number
      }
    }
    Enums: {
      novel_status: "draft" | "ongoing" | "completed" | "hiatus"
      library_status: "reading" | "saved" | "finished"
      likeable_type: "review" | "comment" | "post"
      user_role: "reader" | "author" | "illustrator" | "editor" | "admin"
      approval_status: "pending" | "approved" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
