"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getElectionStatus, getElectionStatusLabel } from "@/lib/election-utils";
import { useConfirmDialog } from "@/components/ConfirmDialog";
import { showToast } from "@/components/Toast";

type Election = {
  id: number;
  name: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  isActive: number;
  code: string;
};

export default function AdminElectionOptions({ election: initial }: { election: Election }) {
  const router = useRouter();
  const [election, setElection] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const { confirm: confirmAction, Dialog: ConfirmDialog } = useConfirmDialog();
  const [form, setForm] = useState({
    name: initial.name,
    academicYear: initial.academicYear,
    startDate: toDatetimeLocal(initial.startDate),
    endDate: toDatetimeLocal(initial.endDate),
    isActive: initial.isActive,
  });

  const status = getElectionStatus({
    isActive: election.isActive,
    startDate: new Date(election.startDate),
    endDate: new Date(election.endDate),
  });
  const statusLabel = getElectionStatusLabel(status);

  function toDatetimeLocal(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  async function saveEdit() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/elections/${election.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          academicYear: form.academicYear,
          startDate: new Date(form.startDate).toISOString(),
          endDate: new Date(form.endDate).toISOString(),
          isActive: form.isActive,
        }),
      });
      const data = await res.json();
      if (data.data) {
        setElection({
          ...election,
          ...data.data,
          startDate: data.data.startDate,
          endDate: data.data.endDate,
        });
        setForm({
          name: data.data.name,
          academicYear: data.data.academicYear,
          startDate: toDatetimeLocal(data.data.startDate),
          endDate: toDatetimeLocal(data.data.endDate),
          isActive: data.data.isActive,
        });
        setEditing(false);
        router.refresh();
        showToast("Election updated", "success");
      } else {
        showToast(data.error || "Failed to update election", "error");
      }
    } finally {
      setSaving(false);
    }
  }

  async function endElection() {
    confirmAction("End this election now? No new votes will be accepted.", () => {
      setSaving(true);
      const now = new Date().toISOString();
      fetch(`/api/admin/elections/${election.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: election.name,
          academicYear: election.academicYear,
          startDate: election.startDate,
          endDate: now,
          isActive: 0,
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.data) {
            setElection({
              ...election,
              ...data.data,
              startDate: data.data.startDate,
              endDate: data.data.endDate,
              isActive: 0,
            });
            setForm((f) => ({ ...f, endDate: toDatetimeLocal(data.data.endDate), isActive: 0 }));
            router.refresh();
            showToast("Election ended", "success");
          } else {
            showToast(data.error || "Failed to end election", "error");
          }
        })
        .finally(() => setSaving(false));
    });
  }

  async function reactivateElection() {
    confirmAction("Reactivate this election? Voting will be allowed again within the current date range.", () => {
      setSaving(true);
      fetch(`/api/admin/elections/${election.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: election.name,
          academicYear: election.academicYear,
          startDate: election.startDate,
          endDate: election.endDate,
          isActive: 1,
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.data) {
            setElection({
              ...election,
              ...data.data,
              startDate: data.data.startDate,
              endDate: data.data.endDate,
              isActive: 1,
            });
            setForm((f) => ({ ...f, isActive: 1 }));
            router.refresh();
            showToast("Election reactivated", "success");
          } else {
            showToast(data.error || "Failed to reactivate election", "error");
          }
        })
        .finally(() => setSaving(false));
    });
  }

  function copyCode() {
    navigator.clipboard.writeText(election.code);
    showToast("Election code copied", "success");
  }

  return (
    <>
      <ConfirmDialog />
      <div className="mb-8 rounded-xl border border-[#dbe0e6] bg-white p-6 dark:border-[#2d394a] dark:bg-[#1a2433]">
      <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-[#617289] dark:text-[#a1b0c3]">
        Election options
      </h2>
      <div className="flex flex-wrap items-center gap-4">
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
            status === "open"
              ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
              : status === "ended"
                ? "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                : status === "scheduled"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
          }`}
        >
          {statusLabel}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#617289] dark:text-[#a1b0c3]">Code:</span>
          <code className="rounded bg-[#f0f2f4] px-2 py-1 font-mono text-sm dark:bg-[#2d394a]">{election.code}</code>
          <button
            type="button"
            onClick={copyCode}
            className="rounded p-1 text-[#617289] hover:bg-[#f0f2f4] hover:text-[#136dec] dark:text-[#a1b0c3] dark:hover:bg-[#2d394a]"
            title="Copy code"
          >
            <span className="material-symbols-outlined text-lg">content_copy</span>
          </button>
        </div>
        <Link
          href={`/results?electionId=${election.id}`}
          className="inline-flex items-center gap-1 rounded-lg border border-[#dbe0e6] bg-white px-3 py-2 text-sm font-medium hover:bg-[#f6f7f8] dark:border-[#2d394a] dark:bg-[#1a2433] dark:hover:bg-[#2d394a]"
        >
          <span className="material-symbols-outlined text-lg">bar_chart</span>
          View results
        </Link>
        <button
          type="button"
          onClick={() => window.open(`/results?electionId=${election.id}&print=1`, "_blank", "width=900,height=700")}
          className="inline-flex items-center gap-1 rounded-lg border border-[#dbe0e6] bg-white px-3 py-2 text-sm font-medium hover:bg-[#f6f7f8] dark:border-[#2d394a] dark:bg-[#1a2433] dark:hover:bg-[#2d394a]"
        >
          <span className="material-symbols-outlined text-lg">print</span>
          Print / Save as PDF
        </button>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-1 rounded-lg border border-[#136dec] bg-[#136dec]/10 px-3 py-2 text-sm font-bold text-[#136dec] hover:bg-[#136dec]/20"
        >
          <span className="material-symbols-outlined text-lg">edit</span>
          Edit election
        </button>
        {(status === "open" || status === "scheduled") && (
          <button
            type="button"
            onClick={endElection}
            disabled={saving}
            className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200 dark:hover:bg-amber-900/50"
          >
            <span className="material-symbols-outlined text-lg">block</span>
            End election
          </button>
        )}
        {(status === "ended" || status === "inactive") && (
          <button
            type="button"
            onClick={reactivateElection}
            disabled={saving}
            className="inline-flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-800 hover:bg-green-100 dark:border-green-800 dark:bg-green-900/30 dark:text-green-200 dark:hover:bg-green-900/50"
          >
            <span className="material-symbols-outlined text-lg">play_circle</span>
            Reactivate
          </button>
        )}
      </div>

      {editing && (
        <div className="mt-6 rounded-lg border border-[#dbe0e6] bg-[#f6f7f8] p-4 dark:border-[#2d394a] dark:bg-[#101822]">
          <h3 className="mb-3 text-sm font-bold text-[#111418] dark:text-white">Edit election</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-[#617289] dark:text-[#a1b0c3]">Name</span>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg border border-[#dbe0e6] bg-white px-3 py-2 text-sm dark:border-[#2d394a] dark:bg-[#1a2433] dark:text-white"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-[#617289] dark:text-[#a1b0c3]">Academic year</span>
              <input
                type="text"
                value={form.academicYear}
                onChange={(e) => setForm((f) => ({ ...f, academicYear: e.target.value }))}
                className="w-full rounded-lg border border-[#dbe0e6] bg-white px-3 py-2 text-sm dark:border-[#2d394a] dark:bg-[#1a2433] dark:text-white"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-[#617289] dark:text-[#a1b0c3]">Start date</span>
              <input
                type="datetime-local"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                className="w-full rounded-lg border border-[#dbe0e6] bg-white px-3 py-2 text-sm dark:border-[#2d394a] dark:bg-[#1a2433] dark:text-white"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-[#617289] dark:text-[#a1b0c3]">End date</span>
              <input
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                className="w-full rounded-lg border border-[#dbe0e6] bg-white px-3 py-2 text-sm dark:border-[#2d394a] dark:bg-[#1a2433] dark:text-white"
              />
            </label>
            <label className="flex items-center gap-2 sm:col-span-2">
              <input
                type="checkbox"
                checked={form.isActive === 1}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked ? 1 : 0 }))}
                className="rounded border-[#dbe0e6] text-[#136dec]"
              />
              <span className="text-sm text-[#111418] dark:text-white">Active (allow voting when within dates)</span>
            </label>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={saveEdit}
              disabled={saving}
              className="rounded-lg bg-[#136dec] px-4 py-2 text-sm font-bold text-white hover:bg-[#0d5bc4] disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg border border-[#dbe0e6] bg-white px-4 py-2 text-sm font-medium dark:border-[#2d394a] dark:bg-[#1a2433]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
