"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import type { HuddleGroup, Member } from "@/lib/types";
import GroupCard from "@/components/GroupCard";

interface GroupSectionProps {
  title: string;
  emoji: string;
  badge: string;
  badgeClass: string;
  groups: HuddleGroup[];
  gridCols: string;
  membersByGroupId: Record<number, Member[]>;
  onAddMember: (groupId: number, name: string) => Promise<void>;
  onRemoveMember: (memberId: number) => Promise<void>;
  onUpdateTheme: (groupId: number, theme: string) => Promise<void>;
  className?: string;
}

function GroupSection({ title, emoji, badge, badgeClass, groups, gridCols, membersByGroupId, onAddMember, onRemoveMember, onUpdateTheme, className }: GroupSectionProps) {
  return (
    <section className={className}>
      <div className="flex items-center gap-3 mb-5">
        <span className="text-2xl">{emoji}</span>
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
        <span className={`${badgeClass} text-xs font-medium px-2.5 py-1 rounded-full`}>{badge}</span>
      </div>
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridCols} gap-5`}>
        {groups.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            members={membersByGroupId[group.id] ?? []}
            onAddMember={onAddMember}
            onRemoveMember={onRemoveMember}
            onUpdateTheme={onUpdateTheme}
          />
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const [groups, setGroups] = useState<HuddleGroup[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const [{ data: groupData }, { data: memberData }] = await Promise.all([
      supabase.from("huddle_groups").select("*").order("channel_number"),
      supabase.from("members").select("*").order("created_at"),
    ]);
    if (groupData) setGroups(groupData);
    if (memberData) setMembers(memberData);
  }, []);

  useEffect(() => {
    fetchData().then(() => setLoading(false));

    const membersChannel = supabase
      .channel("members-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "members" }, fetchData)
      .subscribe();

    const groupsChannel = supabase
      .channel("groups-changes")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "huddle_groups" }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(membersChannel);
      supabase.removeChannel(groupsChannel);
    };
  }, [fetchData]);

  const handleAddMember = async (groupId: number, name: string) => {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 100) return;
    await supabase.from("members").insert({ group_id: groupId, name: trimmed });
  };

  const handleRemoveMember = async (memberId: number) => {
    await supabase.from("members").delete().eq("id", memberId);
  };

  const handleUpdateTheme = async (groupId: number, theme: string) => {
    const trimmed = theme.trim();
    if (!trimmed) return;
    await supabase.from("huddle_groups").update({ theme: trimmed }).eq("id", groupId);
  };

  const membersByGroupId = useMemo(() => {
    const map: Record<number, Member[]> = {};
    for (const m of members) {
      (map[m.group_id] ??= []).push(m);
    }
    return map;
  }, [members]);

  const collaborative = useMemo(() => groups.filter((g) => g.group_type === "collaborative"), [groups]);
  const individual = useMemo(() => groups.filter((g) => g.group_type === "individual"), [groups]);

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center text-gray-400 text-lg">Loading huddle groups...</div>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Ops Cohort 2 — Huddle Groups</h1>
        <p className="text-gray-500 text-base max-w-xl mx-auto">
          Pick a group for this week. Add your name to commit. Collaborative groups meet at least once and choose a shared theme.
        </p>
      </div>

      <GroupSection
        title="Collaborative Groups"
        emoji="🤝"
        badge="Commit to meet & work together"
        badgeClass="bg-blue-100 text-blue-700"
        groups={collaborative}
        gridCols="lg:grid-cols-3"
        membersByGroupId={membersByGroupId}
        onAddMember={handleAddMember}
        onRemoveMember={handleRemoveMember}
        onUpdateTheme={handleUpdateTheme}
        className="mb-12"
      />

      <GroupSection
        title="Individual Groups"
        emoji="🧑‍💻"
        badge="Working solo this week"
        badgeClass="bg-amber-100 text-amber-700"
        groups={individual}
        gridCols="lg:grid-cols-4"
        membersByGroupId={membersByGroupId}
        onAddMember={handleAddMember}
        onRemoveMember={handleRemoveMember}
        onUpdateTheme={handleUpdateTheme}
      />
    </main>
  );
}
