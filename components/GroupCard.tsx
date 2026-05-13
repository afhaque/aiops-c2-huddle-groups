"use client";

import { useState } from "react";
import type { HuddleGroup, Member } from "@/lib/types";

const ROBOT_EMOJI: Record<string, string> = {
  R2D2: "🤖",
  Optimus: "🦾",
  Cortana: "💠",
  Robocop: "🛡️",
  Bender: "🍺",
  T3: "⚡",
  "HAL 9000": "👁️",
  Sonny: "🌟",
  Baymax: "🩺",
  "WALL-E": "♻️",
};

interface Props {
  group: HuddleGroup;
  members: Member[];
  onAddMember: (groupId: number, name: string) => Promise<void>;
  onRemoveMember: (memberId: number) => Promise<void>;
  onUpdateTheme: (groupId: number, theme: string) => Promise<void>;
}

export default function GroupCard({ group, members, onAddMember, onRemoveMember, onUpdateTheme }: Props) {
  const [nameInput, setNameInput] = useState("");
  const [themeInput, setThemeInput] = useState("");
  const [editingTheme, setEditingTheme] = useState(false);
  const [adding, setAdding] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);

  const isCollaborative = group.group_type === "collaborative";
  const emoji = ROBOT_EMOJI[group.robot_name] ?? "🤖";

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed || trimmed.length > 100) return;
    setAdding(true);
    await onAddMember(group.id, trimmed);
    setNameInput("");
    setAdding(false);
  };

  const handleThemeSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = themeInput.trim();
    if (!trimmed) return;
    setSavingTheme(true);
    await onUpdateTheme(group.id, trimmed);
    setThemeInput("");
    setEditingTheme(false);
    setSavingTheme(false);
  };

  const borderColor = isCollaborative ? "border-blue-200" : "border-amber-200";
  const headerBg = isCollaborative ? "bg-blue-50" : "bg-amber-50";

  return (
    <div className={`bg-white rounded-xl border ${borderColor} shadow-sm flex flex-col`}>
      {/* Header */}
      <div className={`${headerBg} rounded-t-xl px-4 py-3 flex items-center gap-2`}>
        <span className="text-2xl">{emoji}</span>
        <div className="min-w-0">
          <h3 className="font-bold text-gray-900 text-base leading-tight">{group.robot_name}</h3>
          <p className="text-xs text-gray-400 truncate font-mono">{group.channel_name}</p>
        </div>
        <span className="ml-auto text-xs bg-white/70 text-gray-500 px-2 py-0.5 rounded-full shrink-0">
          {members.length} {members.length === 1 ? "person" : "people"}
        </span>
      </div>

      <div className="px-4 py-3 flex flex-col gap-3 flex-1">
        {/* Theme (collaborative only) */}
        {isCollaborative && !editingTheme && (
          <div
            className="flex items-start gap-2 cursor-pointer group"
            onClick={() => {
              setThemeInput(group.theme ?? "");
              setEditingTheme(true);
            }}
          >
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide mt-0.5">Theme</span>
            {group.theme ? (
              <span className="text-sm text-gray-700 group-hover:text-blue-700 transition-colors">{group.theme}</span>
            ) : (
              <span className="text-sm text-gray-300 italic group-hover:text-blue-400 transition-colors">
                Click to set a theme...
              </span>
            )}
          </div>
        )}
        {isCollaborative && editingTheme && (
          <form onSubmit={handleThemeSave} className="flex gap-1.5">
            <input
              autoFocus
              type="text"
              value={themeInput}
              onChange={(e) => setThemeInput(e.target.value)}
              placeholder="e.g. Building RAG pipelines"
              className="flex-1 text-sm border border-blue-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0"
              maxLength={200}
            />
            <button
              type="submit"
              disabled={savingTheme || !themeInput.trim()}
              className="text-xs bg-blue-600 text-white px-2.5 py-1.5 rounded-lg disabled:opacity-50 hover:bg-blue-700 transition-colors shrink-0"
            >
              {savingTheme ? "..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setEditingTheme(false)}
              className="text-xs text-gray-400 px-2 py-1.5 hover:text-gray-600 shrink-0"
            >
              ✕
            </button>
          </form>
        )}

        {/* Members list */}
        <div className="flex-1">
          {members.length === 0 ? (
            <p className="text-xs text-gray-300 italic">No one yet — be the first!</p>
          ) : (
            <ul className="space-y-1">
              {members.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-2 group">
                  <span className="text-sm text-gray-700 truncate">{m.name}</span>
                  <button
                    onClick={() => onRemoveMember(m.id)}
                    className="text-gray-200 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0 text-xs"
                    title="Remove"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Add name form */}
        <form onSubmit={handleAdd} className="flex gap-1.5 mt-1">
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Your name"
            maxLength={100}
            className="flex-1 text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-gray-300 min-w-0"
          />
          <button
            type="submit"
            disabled={adding || !nameInput.trim()}
            className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg disabled:opacity-40 hover:bg-gray-700 transition-colors shrink-0"
          >
            {adding ? "..." : "Join"}
          </button>
        </form>
      </div>
    </div>
  );
}
