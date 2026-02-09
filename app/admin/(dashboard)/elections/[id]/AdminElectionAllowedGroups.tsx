"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/Toast";

type Group = { id: number; name: string };
type AllowedGroup = { groupId: number; groupName: string };

export default function AdminElectionAllowedGroups({ electionId }: { electionId: number }) {
  const router = useRouter();
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [allowed, setAllowed] = useState<AllowedGroup[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/groups").then((r) => r.json()),
      fetch(`/api/admin/elections/${electionId}/allowed-groups`).then((r) => r.json()),
    ])
      .then(([groupsRes, allowedRes]) => {
        if (groupsRes.data) setAllGroups(groupsRes.data);
        if (allowedRes.data) {
          setAllowed(allowedRes.data);
          setSelectedIds(allowedRes.data.map((a: AllowedGroup) => a.groupId));
        }
      })
      .finally(() => setLoading(false));
  }, [electionId]);

  async function saveAllowedGroups() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/elections/${electionId}/allowed-groups`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupIds: selectedIds }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error ?? "Failed to update", "error");
        setSaving(false);
        return;
      }
      setAllowed(data.data);
      router.refresh();
      showToast(
        selectedIds.length === 0
          ? "All voters can vote (no restriction)"
          : `Only selected groups can vote`,
        "success"
      );
    } catch {
      showToast("Failed to update", "error");
    }
    setSaving(false);
  }

  function toggleGroup(id: number) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  if (loading) return <p className="text-sm text-[#617289] dark:text-[#a1b0c3]">Loading…</p>;

  return (
    <div className="rounded-xl border border-[#dbe0e6] bg-white p-6 dark:border-[#2d394a] dark:bg-[#1a2433]">
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-[#617289] dark:text-[#a1b0c3]">
        Who can vote
      </h2>
      <p className="mb-4 text-sm text-[#617289] dark:text-[#a1b0c3]">
        Leave all unchecked to allow every voter. Select one or more groups to restrict voting to those groups only.
      </p>
      <div className="mb-4 flex flex-wrap gap-3">
        {allGroups.map((g) => (
          <label key={g.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#dbe0e6] bg-[#f6f7f8] px-3 py-2 dark:border-[#2d394a] dark:bg-[#101822]">
            <input
              type="checkbox"
              checked={selectedIds.includes(g.id)}
              onChange={() => toggleGroup(g.id)}
              className="rounded border-[#dbe0e6] text-[#136dec]"
            />
            <span className="text-sm text-[#111418] dark:text-white">{g.name}</span>
          </label>
        ))}
        {allGroups.length === 0 && (
          <p className="text-sm text-[#617289] dark:text-[#a1b0c3]">
            No groups yet. Create groups in Admin → Groups, then assign voters to them.
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={saveAllowedGroups}
        disabled={saving}
        className="rounded-lg bg-[#136dec] px-4 py-2 text-sm font-bold text-white hover:bg-[#136dec]/90 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save allowed groups"}
      </button>
    </div>
  );
}
