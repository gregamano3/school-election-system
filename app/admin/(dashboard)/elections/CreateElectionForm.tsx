"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import { showToast } from "@/components/Toast";

export default function CreateElectionForm() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    academicYear: "",
    startDate: "",
    endDate: "",
    isActive: 1,
  });

  function toDatetimeLocal(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function getDefaultDates() {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() + 1);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { start: toDatetimeLocal(start), end: toDatetimeLocal(end) };
  }

  function handleOpen() {
    const { start, end } = getDefaultDates();
    setForm({
      name: "",
      academicYear: "",
      startDate: start,
      endDate: end,
      isActive: 1,
    });
    setIsOpen(true);
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.academicYear.trim()) {
      showToast("Please fill in all required fields", "error");
      return;
    }
    if (new Date(form.startDate) >= new Date(form.endDate)) {
      showToast("End date must be after start date", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/elections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          academicYear: form.academicYear.trim(),
          startDate: new Date(form.startDate).toISOString(),
          endDate: new Date(form.endDate).toISOString(),
          isActive: form.isActive,
        }),
      });
      const data = await res.json();
      if (data.data) {
        showToast("Election created successfully", "success");
        setIsOpen(false);
        router.push(`/admin/elections/${data.data.id}`);
        router.refresh();
      } else {
        showToast(data.error || "Failed to create election", "error");
      }
    } catch (e) {
      showToast("Failed to create election", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-2 rounded-lg bg-[#136dec] px-4 py-2 text-sm font-bold text-white hover:bg-[#0d5bc4]"
      >
        <span className="material-symbols-outlined">add</span>
        Create election
      </button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Create new election">
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[#111418] dark:text-white">
              Election name <span className="text-red-500">*</span>
            </span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. 2024-2025 Student Government"
              className="w-full rounded-lg border border-[#dbe0e6] bg-white px-3 py-2 text-sm dark:border-[#2d394a] dark:bg-[#1a2433] dark:text-white"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[#111418] dark:text-white">
              Academic year <span className="text-red-500">*</span>
            </span>
            <input
              type="text"
              value={form.academicYear}
              onChange={(e) => setForm((f) => ({ ...f, academicYear: e.target.value }))}
              placeholder="e.g. 2024-2025"
              className="w-full rounded-lg border border-[#dbe0e6] bg-white px-3 py-2 text-sm dark:border-[#2d394a] dark:bg-[#1a2433] dark:text-white"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-[#111418] dark:text-white">Start date</span>
              <input
                type="datetime-local"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                className="w-full rounded-lg border border-[#dbe0e6] bg-white px-3 py-2 text-sm dark:border-[#2d394a] dark:bg-[#1a2433] dark:text-white"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-[#111418] dark:text-white">End date</span>
              <input
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                className="w-full rounded-lg border border-[#dbe0e6] bg-white px-3 py-2 text-sm dark:border-[#2d394a] dark:bg-[#1a2433] dark:text-white"
              />
            </label>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isActive === 1}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked ? 1 : 0 }))}
              className="rounded border-[#dbe0e6] text-[#136dec]"
            />
            <span className="text-sm text-[#111418] dark:text-white">Active (allow voting when within dates)</span>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg border border-[#dbe0e6] bg-white px-4 py-2 text-sm font-medium dark:border-[#2d394a] dark:bg-[#1a2433]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="rounded-lg bg-[#136dec] px-4 py-2 text-sm font-bold text-white hover:bg-[#0d5bc4] disabled:opacity-50"
            >
              {saving ? "Creating…" : "Create"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
