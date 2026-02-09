"use client";

import { useState, useRef } from "react";
import Modal from "./Modal";

type Party = {
  id: number;
  name: string;
};

export type CandidateFormData = {
  name: string;
  grade: string;
  bio: string;
  partyId: number | null;
  imageUrl: string | null;
};

export function useCandidateDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<{
    parties: Party[];
    onConfirm: (data: CandidateFormData) => void;
  } | null>(null);

  const open = (parties: Party[], onConfirm: (data: CandidateFormData) => void) => {
    setConfig({ parties, onConfirm });
    setIsOpen(true);
  };

  const Dialog = () => {
    const [name, setName] = useState("");
    const [grade, setGrade] = useState("");
    const [bio, setBio] = useState("");
    const [partyId, setPartyId] = useState<number | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleConfirm = () => {
      if (name.trim()) {
        config?.onConfirm({
          name: name.trim(),
          grade: grade.trim(),
          bio: bio.trim(),
          partyId,
          imageUrl: imageUrl || null,
        });
        setIsOpen(false);
        setName("");
        setGrade("");
        setBio("");
        setPartyId(null);
        setImageUrl(null);
        setUploadError("");
      }
    };

    const handleCancel = () => {
      setIsOpen(false);
      setName("");
      setGrade("");
      setBio("");
      setPartyId(null);
      setImageUrl(null);
      setUploadError("");
    };

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploadError("");
      const allowed = ["image/jpeg", "image/png"];
      if (!allowed.includes(file.type)) {
        setUploadError("Only JPG and PNG are allowed.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setUploadError("File must be under 5MB.");
        return;
      }
      setUploading(true);
      try {
        const formData = new FormData();
        formData.set("file", file);
        const res = await fetch("/api/admin/candidates/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.data?.url) {
          setImageUrl(data.data.url);
        } else {
          setUploadError(data.error || "Upload failed");
        }
      } catch {
        setUploadError("Upload failed");
      } finally {
        setUploading(false);
        e.target.value = "";
      }
    }

    if (!config) return null;

    return (
      <Modal isOpen={isOpen} onClose={handleCancel} title="Add candidate">
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[#111418] dark:text-white">
              Photo (optional)
            </span>
            <div className="flex items-center gap-4">
              {imageUrl ? (
                <div className="flex items-center gap-3">
                  <img
                    src={imageUrl}
                    alt="Candidate"
                    className="h-20 w-20 rounded-lg object-cover border border-[#dbe0e6] dark:border-[#2d394a]"
                  />
                  <button
                    type="button"
                    onClick={() => setImageUrl(null)}
                    className="text-sm text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                  <span className="inline-flex items-center gap-2 rounded-lg border border-[#dbe0e6] bg-white px-3 py-2 text-sm dark:border-[#2d394a] dark:bg-[#1a2433]">
                    {uploading ? "Uploading…" : "Choose JPG or PNG (max 5MB)"}
                  </span>
                </label>
              )}
            </div>
            {uploadError && <p className="mt-1 text-xs text-red-500">{uploadError}</p>}
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[#111418] dark:text-white">
              Full name <span className="text-red-500">*</span>
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              autoFocus
              className="w-full rounded-lg border border-[#dbe0e6] bg-white px-3 py-2 text-sm dark:border-[#2d394a] dark:bg-[#1a2433] dark:text-white"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[#111418] dark:text-white">Grade</span>
            <input
              type="text"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="e.g. 11th Grade"
              className="w-full rounded-lg border border-[#dbe0e6] bg-white px-3 py-2 text-sm dark:border-[#2d394a] dark:bg-[#1a2433] dark:text-white"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[#111418] dark:text-white">Bio</span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Short bio"
              rows={3}
              className="w-full rounded-lg border border-[#dbe0e6] bg-white px-3 py-2 text-sm dark:border-[#2d394a] dark:bg-[#1a2433] dark:text-white"
            />
          </label>
          {config.parties.length > 0 && (
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-[#111418] dark:text-white">Party</span>
              <select
                value={partyId || ""}
                onChange={(e) => setPartyId(e.target.value ? parseInt(e.target.value, 10) : null)}
                className="w-full rounded-lg border border-[#dbe0e6] bg-white px-3 py-2 text-sm dark:border-[#2d394a] dark:bg-[#1a2433] dark:text-white"
              >
                <option value="">Independent</option>
                {config.parties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg border border-[#dbe0e6] bg-white px-4 py-2 text-sm font-medium dark:border-[#2d394a] dark:bg-[#1a2433]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!name.trim()}
              className="rounded-lg bg-[#136dec] px-4 py-2 text-sm font-bold text-white hover:bg-[#0d5bc4] disabled:opacity-50"
            >
              Add candidate
            </button>
          </div>
        </div>
      </Modal>
    );
  };

  return { open, Dialog };
}
