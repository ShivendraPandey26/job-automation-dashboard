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

  const progressPct =
    batchProgress && batchProgress.total > 0
      ? Math.round((batchProgress.processed / batchProgress.total) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Job applications
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {loading
                ? "Loading your pipeline…"
                : `${jobs.length} job${jobs.length === 1 ? "" : "s"} tracked`}
            </p>
          </div>

          <button
            onClick={handleApplyAll}
            disabled={batchProgress?.running || loading || jobs.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            {batchProgress?.running ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Applying to all…
              </>
            ) : (
              <>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Apply to all
              </>
            )}
          </button>
        </div>

        {/* Batch progress */}
        {batchProgress?.running && (
          <div className="mb-6 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-indigo-900">
                Processing applications
              </p>
              <p className="text-sm tabular-nums text-indigo-700">
                {batchProgress.processed} / {batchProgress.total}
              </p>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-indigo-100">
              <div
                className="h-2 rounded-full bg-indigo-600 transition-all duration-500 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-6">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search jobs by title or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
            <svg
              className="mt-0.5 h-5 w-5 shrink-0 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">
                Could not load jobs
              </p>
              <p className="mt-0.5 text-sm text-red-600">{error}</p>
            </div>
            <button
              onClick={() => {
                setLoading(true);
                fetchJobs();
              }}
              className="shrink-0 rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl border border-slate-200 bg-white p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-slate-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-3/4 rounded bg-slate-100" />
                    <div className="h-3 w-1/2 rounded bg-slate-100" />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-3 w-full rounded bg-slate-100" />
                  <div className="h-3 w-5/6 rounded bg-slate-100" />
                </div>
                <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4">
                  <div className="h-7 w-20 rounded-lg bg-slate-100" />
                  <div className="ml-auto h-7 w-16 rounded-lg bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filteredJobs.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <svg
                className="h-6 w-6 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
                />
              </svg>
            </div>
            <p className="mt-4 text-sm font-medium text-slate-700">
              {jobs.length === 0
                ? "No jobs tracked yet"
                : "No jobs match your search"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {jobs.length === 0
                ? "Jobs you add will show up here."
                : "Try a different title or keyword."}
            </p>
            {search && jobs.length > 0 && (
              <button
                onClick={() => setSearch("")}
                className="mt-4 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Clear search
              </button>
            )}
          </div>
        )}

        {/* Job grid */}
        {!loading && !error && filteredJobs.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredJobs.map((job) => (
              <JobCard
                key={job.jobId}
                job={job}
                onApply={handleApply}
                isApplying={applyingIds.has(job.jobId)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
