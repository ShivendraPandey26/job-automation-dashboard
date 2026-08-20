"use client";

import { useEffect, useState, useCallback } from "react";
import type { Job, BatchProgress } from "@/lib/types";
import JobCard from "./components/JobCard";

export default function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applyingIds, setApplyingIds] = useState<Set<string>>(new Set());
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(
    null,
  );

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/jobs");
      if (!res.ok) throw new Error("Failed to load jobs");
      const data = await res.json();
      setJobs(data.jobs);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Poll individual jobs that are currently mid-automation
  useEffect(() => {
    if (applyingIds.size === 0) return;

    const interval = setInterval(async () => {
      await fetchJobs();
      // Stop polling for any job that has reached a terminal state
      setJobs((currentJobs) => {
        setApplyingIds((prev) => {
          const next = new Set(prev);
          for (const id of prev) {
            const job = currentJobs.find((j) => j.jobId === id);
            if (
              job &&
              (job.status === "SCREENSHOT_CAPTURED" || job.status === "FAILED")
            ) {
              next.delete(id);
            }
          }
          return next;
        });
        return currentJobs;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [applyingIds.size, fetchJobs]);

  // Poll batch progress while a batch is running
  useEffect(() => {
    if (!batchProgress?.running) return;

    const interval = setInterval(async () => {
      const res = await fetch("/api/applications/progress");
      const data: BatchProgress = await res.json();
      setBatchProgress(data);
      await fetchJobs();
      if (!data.running) clearInterval(interval);
    }, 2500);

    return () => clearInterval(interval);
  }, [batchProgress?.running, fetchJobs]);

  async function handleApply(jobId: string) {
    setApplyingIds((prev) => new Set(prev).add(jobId));
    await fetch(`/api/applications/${jobId}/apply`, { method: "POST" });
  }

  async function handleApplyAll() {
    const res = await fetch("/api/applications/apply-all", { method: "POST" });
    if (res.status === 409) {
      alert("A batch is already running.");
      return;
    }
    setBatchProgress({
      processed: 0,
      total: jobs.length,
      running: true,
      startedAt: null,
      finishedAt: null,
    });
  }

  const filteredJobs = jobs.filter(
    (job) =>
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.description.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">
          Job Application Dashboard
        </h1>
        <button
          onClick={handleApplyAll}
          disabled={batchProgress?.running}
          className="px-4 py-2 rounded bg-gray-900 text-white text-sm hover:bg-gray-800 disabled:opacity-50"
        >
          {batchProgress?.running ? "Applying to All…" : "Apply to All"}
        </button>
      </div>

      {batchProgress?.running && (
        <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-2">
            Processed {batchProgress.processed} of {batchProgress.total}
          </p>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-gray-900 h-2 rounded-full transition-all"
              style={{
                width: `${batchProgress.total > 0 ? (batchProgress.processed / batchProgress.total) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      <input
        type="text"
        placeholder="Search jobs by title or description…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-6 text-sm"
      />

      {loading && <p className="text-gray-500">Loading jobs…</p>}

      {error && (
        <p className="text-red-600 bg-red-50 rounded p-3 text-sm">
          Could not load jobs: {error}
        </p>
      )}

      {!loading && !error && filteredJobs.length === 0 && (
        <p className="text-gray-500">No jobs found.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredJobs.map((job) => (
          <JobCard
            key={job.jobId}
            job={job}
            onApply={handleApply}
            isApplying={applyingIds.has(job.jobId)}
          />
        ))}
      </div>
    </main>
  );
}
