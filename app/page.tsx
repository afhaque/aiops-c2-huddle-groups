"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { HuddleGroup, Member } from "@/lib/types";
import GroupCard from "@/components/GroupCard";

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
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();

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

  const collaborative = groups.filter((g) => g.group_type === "collaborative");
  const individual = groups.filter((g) => g.group_type === "individual");

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

      <section className="mb-12">
        <div className="flex items-center gap-3 mb-5">
          <span className="text-2xl">🤝</span>
          <h2 className="text-xl font-semibold text-gray-800">Collaborative Groups</h2>
          <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
            Commit to meet &amp; work together
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {collaborative.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              members={members.filter((m) => m.group_id === group.id)}
              onAddMember={handleAddMember}
              onRemoveMember={handleRemoveMember}
              onUpdateTheme={handleUpdateTheme}
            />
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-3 mb-5">
          <span className="text-2xl">🧑‍💻</span>
          <h2 className="text-xl font-semibold text-gray-800">Individual Groups</h2>
          <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2.5 py-1 rounded-full">
            Working solo this week
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {individual.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              members={members.filter((m) => m.group_id === group.id)}
              onAddMember={handleAddMember}
              onRemoveMember={handleRemoveMember}
              onUpdateTheme={handleUpdateTheme}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
