"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/Toast";
import { useConfirmDialog } from "@/components/ConfirmDialog";

type Voter = { id: number; studentId: string; name: string | null; role: string; createdAt: Date };

export default function AdminVotersList({ initialList }: { initialList: Voter[] }) {
  const router = useRouter();
  const [list, setList] = useState(initialList);
  const [studentId, setStudentId] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"voter" | "admin">("voter");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { confirm: confirmAction, Dialog: ConfirmDialog } = useConfirmDialog();

  useEffect(() => {
    setList(initialList);
  }, [initialList]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/voters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: studentId.trim(), name: name.trim() || undefined, password, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed");
        setLoading(false);
        return;
      }
      setList((prev) => [...prev, { id: data.data.id, studentId: data.data.studentId, name: data.data.name, role: data.data.role, createdAt: data.data.createdAt }]);
      setStudentId("");
      setName("");
      setPassword("");
      showToast("Voter added", "success");
    } catch {
      setError("Failed");
    }
    setLoading(false);
  }

  function handleDownloadTemplate() {
    showToast("Template downloaded", "success");
  }

  async function handleUploadCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const res = await fetch("/api/admin/voters/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Upload failed", "error");
        return;
      }
      const { created, skipped, errors, errorMessages } = data.data;
      if (created > 0) {
        router.refresh();
        showToast(`Added ${created} voter(s)${skipped > 0 ? `, ${skipped} skipped (duplicate)` : ""}`, "success");
      }
      if (skipped > 0 && created === 0) {
        showToast(`${skipped} row(s) skipped (duplicate student ID)`, "info");
      }
      if (errors > 0) {
        showToast(`${errors} row(s) had errors. Check format.`, "error");
        if (errorMessages?.length) console.warn("CSV errors:", errorMessages);
      }
      if (created === 0 && skipped === 0 && errors === 0) {
        showToast("No valid rows in CSV", "info");
      }
    } catch {
      showToast("Upload failed", "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function handleDelete(id: number) {
    confirmAction("Delete this voter?", () => {
      fetch(`/api/admin/voters/${id}`, { method: "DELETE" })
        .then((res) => {
          if (res.ok) {
            setList((prev) => prev.filter((v) => v.id !== id));
            showToast("Voter deleted", "success");
          } else {
            showToast("Failed to delete voter", "error");
          }
        });
    });
  }

  return (
    <>
      <ConfirmDialog />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <a
          href="/api/admin/voters/template"
          download="voters_template.csv"
          onClick={handleDownloadTemplate}
          className="inline-flex items-center gap-2 rounded-lg border border-[#dbe0e6] bg-white px-4 py-2 text-sm font-medium hover:bg-[#f6f7f8] dark:border-[#2d394a] dark:bg-[#1a2433] dark:hover:bg-[#2d394a]"
        >
          <span className="material-symbols-outlined text-lg">download</span>
          Download template CSV
        </a>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#dbe0e6] bg-white px-4 py-2 text-sm font-medium hover:bg-[#f6f7f8] dark:border-[#2d394a] dark:bg-[#1a2433] dark:hover:bg-[#2d394a]">
          <span className="material-symbols-outlined text-lg">upload_file</span>
          {uploading ? "Uploading…" : "Upload CSV"}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleUploadCSV}
            disabled={uploading}
          />
        </label>
        <span className="text-xs text-[#617289] dark:text-[#a1b0c3]">
          Template columns: student_id, password, name (optional), role (voter or admin)
        </span>
      </div>
      <form onSubmit={handleAdd} className="mb-8 flex flex-wrap items-end gap-4 rounded-xl border border-[#dbe0e6] bg-white p-4 dark:border-[#2d394a] dark:bg-[#1a2433]">
        <div>
          <label className="block text-xs font-bold text-[#617289] dark:text-[#a1b0c3]">Student ID</label>
          <input
            className="mt-1 rounded-lg border border-[#dbe0e6] px-3 py-2 text-sm dark:border-[#2d394a] dark:bg-[#2d394a] dark:text-white"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-[#617289] dark:text-[#a1b0c3]">Name</label>
          <input
            className="mt-1 rounded-lg border border-[#dbe0e6] px-3 py-2 text-sm dark:border-[#2d394a] dark:bg-[#2d394a] dark:text-white"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-[#617289] dark:text-[#a1b0c3]">Password</label>
          <input
            type="password"
            className="mt-1 rounded-lg border border-[#dbe0e6] px-3 py-2 text-sm dark:border-[#2d394a] dark:bg-[#2d394a] dark:text-white"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-[#617289] dark:text-[#a1b0c3]">Role</label>
          <select
            className="mt-1 rounded-lg border border-[#dbe0e6] px-3 py-2 text-sm dark:border-[#2d394a] dark:bg-[#2d394a] dark:text-white"
            value={role}
            onChange={(e) => setRole(e.target.value as "voter" | "admin")}
          >
            <option value="voter">Voter</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[#136dec] px-4 py-2 text-sm font-bold text-white hover:bg-[#136dec]/90 disabled:opacity-50"
        >
          Add voter
        </button>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </form>
      <div className="overflow-x-auto rounded-xl border border-[#dbe0e6] bg-white dark:border-[#2d394a] dark:bg-[#1a2433]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#dbe0e6] dark:border-[#2d394a]">
              <th className="p-4 font-bold text-[#111418] dark:text-white">ID</th>
              <th className="p-4 font-bold text-[#111418] dark:text-white">Student ID</th>
              <th className="p-4 font-bold text-[#111418] dark:text-white">Name</th>
              <th className="p-4 font-bold text-[#111418] dark:text-white">Role</th>
              <th className="p-4 font-bold text-[#111418] dark:text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((v) => (
              <tr key={v.id} className="border-b border-[#dbe0e6] dark:border-[#2d394a]">
                <td className="p-4 text-[#111418] dark:text-white">{v.id}</td>
                <td className="p-4 text-[#111418] dark:text-white">{v.studentId}</td>
                <td className="p-4 text-[#111418] dark:text-white">{v.name ?? "—"}</td>
                <td className="p-4">
                  <span className={`rounded px-2 py-0.5 text-xs font-bold ${v.role === "admin" ? "bg-[#136dec]/20 text-[#136dec]" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}>
                    {v.role}
                  </span>
                </td>
                <td className="p-4">
                  <button
                    type="button"
                    onClick={() => handleDelete(v.id)}
                    className="text-red-500 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
