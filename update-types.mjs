import fs from "fs";
let content = fs.readFileSync("src/integrations/supabase/types.ts", "utf8");

// Add xp, current_streak, longest_streak to profiles Row
content = content.replace(
  /badges: string\[\]\r?\n\s+\}/,
  "badges: string[]\n          xp: number\n          current_streak: number\n          longest_streak: number\n        }"
);
// Insert
content = content.replace(
  /badges\?: string\[\]\r?\n\s+\}/,
  "badges?: string[]\n          xp?: number\n          current_streak?: number\n          longest_streak?: number\n        }"
);
// Update
content = content.replace(
  /badges\?: string\[\]\r?\n\s+\}\r?\n\s+Relationships: \[\]/,
  "badges?: string[]\n          xp?: number\n          current_streak?: number\n          longest_streak?: number\n        }\n        Relationships: []"
);

// Add contests and contest_entries tables
const newTables = `
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
      }`;

content = content.replace(/Tables: \{/, "Tables: {" + newTables);

// Add function update_reading_streak
const newFunction = `
        update_reading_streak: {
          Args: {
            p_user_id: string
          }
          Returns: void
        }`;

content = content.replace(/Functions: \{/, "Functions: {" + newFunction);

fs.writeFileSync("src/integrations/supabase/types.ts", content);
console.log("Types updated");
