export type GroupType = "collaborative" | "individual";

export interface HuddleGroup {
  id: number;
  channel_name: string;
  robot_name: string;
  group_type: GroupType;
  theme: string | null;
  channel_number: number;
  created_at: string;
}

export interface Member {
  id: number;
  group_id: number;
  name: string;
  created_at: string;
}

export type Database = {
  public: {
    Tables: {
      huddle_groups: {
        Row: HuddleGroup;
        Insert: Omit<HuddleGroup, "id" | "created_at">;
        Update: Partial<Omit<HuddleGroup, "id" | "created_at">>;
      };
      members: {
        Row: Member;
        Insert: Omit<Member, "id" | "created_at">;
        Update: Partial<Omit<Member, "id" | "created_at">>;
      };
    };
  };
};
