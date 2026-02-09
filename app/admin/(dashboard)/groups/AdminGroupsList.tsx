"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/Toast";
import { useConfirmDialog } from "@/components/ConfirmDialog";

type Group = { id: number; name: string };

export default function AdminGroupsList() {
  const router = useRouter();
  const [list, setList] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const { confirm: confirmAction, Dialog: ConfirmDialog } = useConfirmDialog();

  useEffect(() => {
    fetch("/api/admin/groups")
      .then((r) => r.json())
      .then((res) => {
        if (res.data) setList(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error ?? "Failed to create group", "error");
        setSaving(false);
        return;
      }
      setList((prev) => [...prev, data.data]);
      setName("");
      router.refresh();
      showToast("Group created", "success");
    } catch {
      showToast("Failed to create group", "error");
    }
    setSaving(false);
  }

  function startEdit(g: Group) {
    setEditingId(g.id);
    setEditName(g.name);
  }

  async function saveEdit() {
    if (editingId == null || !editName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/groups/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error ?? "Failed to update group", "error");
        setSaving(false);
        return;
      }
      setList((prev) => prev.map((g) => (g.id === editingId ? { ...g, name: data.data.name } : g)));
      setEditingId(null);
      router.refresh();
      showToast("Group updated", "success");
    } catch {
      showToast("Failed to update group", "error");
    }
    setSaving(false);
  }

  function handleDelete(g: Group) {
    confirmAction(`Delete group "${g.name}"? Voters will be unassigned from this group.`, () => {
      fetch(`/api/admin/groups/${g.id}`, { method: "DELETE" })
        .then((res) => {
          if (res.ok) {
            setList((prev) => prev.filter((x) => x.id !== g.id));
            router.refresh();
            showToast("Group deleted", "success");
          } else {
            res.json().then((d) => showToast(d.error ?? "Failed to delete group", "error"));
          }
        });
    });
  }

  if (loading) {
    return <p className="text-[#617289] dark:text-[#a1b0c3]">Loading groups…</p>;
  }

  return (
    <>
      <ConfirmDialog />
      <form onSubmit={handleAdd} className="mb-8 flex flex-wrap items-end gap-4 rounded-xl border border-[#dbe0e6] bg-white p-4 dark:border-[#2d394a] dark:bg-[#1a2433]">
        <div>
          <label className="block text-xs font-bold text-[#617289] dark:text-[#a1b0c3]">Group name</label>
          <input
            className="mt-1 rounded-lg border border-[#dbe0e6] px-3 py-2 text-sm dark:border-[#2d394a] dark:bg-[#2d394a] dark:text-white"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Grade 11"
            required
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[#136dec] px-4 py-2 text-sm font-bold text-white hover:bg-[#136dec]/90 disabled:opacity-50"
        >
          Add group
        </button>
      </form>
      <div className="overflow-x-auto rounded-xl border border-[#dbe0e6] bg-white dark:border-[#2d394a] dark:bg-[#1a2433]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#dbe0e6] dark:border-[#2d394a]">
              <th className="p-4 font-bold text-[#111418] dark:text-white">ID</th>
              <th className="p-4 font-bold text-[#111418] dark:text-white">Name</th>
              <th className="p-4 font-bold text-[#111418] dark:text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td colSpan={3} className="p-4 text-[#617289] dark:text-[#a1b0c3]">
                  No groups yet. Create one above.
                </td>
              </tr>
            )}
            {list.map((g) => (
              <tr key={g.id} className="border-b border-[#dbe0e6] dark:border-[#2d394a]">
                <td className="p-4 text-[#111418] dark:text-white">{g.id}</td>
                <td className="p-4">
                  {editingId === g.id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="rounded border border-[#dbe0e6] px-2 py-1 text-sm dark:border-[#2d394a] dark:bg-[#2d394a] dark:text-white"
                      autoFocus
                    />
                  ) : (
                    <span className="text-[#111418] dark:text-white">{g.name}</span>
                  )}
                </td>
                <td className="p-4 flex flex-wrap gap-2">
                  {editingId === g.id ? (
                    <>
                      <button
                        type="button"
                        onClick={saveEdit}
                        disabled={saving}
                        className="text-[#136dec] hover:underline disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="text-[#617289] hover:underline dark:text-[#a1b0c3]"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => startEdit(g)}
                        className="text-[#136dec] hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(g)}
                        className="text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
