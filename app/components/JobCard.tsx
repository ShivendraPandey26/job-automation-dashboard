"use client";

import { useState } from "react";
import { decode } from "html-entities";
import type { Job } from "@/lib/types";
import StatusBadge from "./StatusBadge";

interface JobCardProps {
  job: Job;
  onApply: (jobId: string) => void;
  isApplying: boolean;
}

export default function JobCard({ job, onApply, isApplying }: JobCardProps) {
  const [showScreenshot, setShowScreenshot] = useState(false);
  const [imageStatus, setImageStatus] = useState<
    "loading" | "loaded" | "error"
  >("loading");

  const companyInitial = job.company?.charAt(0).toUpperCase() ?? "?";
  const screenshotUrl = `/api/applications/${job.jobId}/screenshot`;
  const description = decode(job.description);

  function openScreenshot() {
    setImageStatus("loading");
    setShowScreenshot(true);
  }

  return (
    <div className="group relative flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-sm font-semibold text-indigo-600 ring-1 ring-inset ring-indigo-100">
            {companyInitial}
          </div>

          <div className="min-w-0">
            <h3 className="truncate font-semibold text-slate-900 leading-tight">
              {job.title}
            </h3>
            <p className="mt-0.5 truncate text-sm text-slate-500">
              {job.company}
              <span className="mx-1.5 text-slate-300">·</span>
              {job.location}
            </p>
          </div>
        </div>

        <div className="shrink-0">
          <StatusBadge status={job.status} />
        </div>
      </div>

      {/* Description (rich HTML from the job posting, entity-decoded) */}
      <div
        className="prose prose-sm line-clamp-3 max-w-none text-sm leading-relaxed text-slate-600 prose-p:my-0 prose-a:text-indigo-600"
        dangerouslySetInnerHTML={{ __html: description }}
      />

      {/* Failure reason */}
      {job.status === "FAILED" && job.failureReason && (
        <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2">
          <svg
            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500"
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
          <p className="text-xs leading-relaxed text-red-700">
            {job.failureReason}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-1 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
        <a
          href={job.jobUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1"
        >
          View job
          <svg
            className="h-3.5 w-3.5 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 6H18m0 0v4.5M18 6l-7.5 7.5M6 10.5V18h7.5"
            />
          </svg>
        </a>

        {job.screenshotPath && (
          <button
            onClick={openScreenshot}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1"
          >
            <svg
              className="h-3.5 w-3.5 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 12V4.5A1.5 1.5 0 014.5 3h15a1.5 1.5 0 011.5 1.5V15a1.5 1.5 0 01-1.5 1.5h-6M6.75 7.5a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
              />
            </svg>
            Screenshot
          </button>
        )}

        <button
          onClick={() => onApply(job.jobId)}
          disabled={isApplying || job.status === "PROCESSING"}
          className="ml-auto inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1"
        >
          {job.status === "PROCESSING" || isApplying ? (
            <>
              <svg
                className="h-3.5 w-3.5 animate-spin"
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
              Applying…
            </>
          ) : (
            "Apply"
          )}
        </button>
      </div>

      {/* Screenshot modal */}
      {showScreenshot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm"
          onClick={() => setShowScreenshot(false)}
        >
          <div
            className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <p className="truncate pr-4 text-sm font-medium text-slate-700">
                {job.title} — screenshot
              </p>
              <div className="flex shrink-0 items-center gap-1">
                <a
                  href={screenshotUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  aria-label="Open screenshot in new tab"
                  title="Open in new tab"
                >
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
                      d="M13.5 6H18m0 0v4.5M18 6l-7.5 7.5M6 10.5V18h7.5"
                    />
                  </svg>
                </a>
                <button
                  onClick={() => setShowScreenshot(false)}
                  aria-label="Close"
                  className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Image area */}
            <div className="relative flex min-h-[300px] flex-1 items-center justify-center overflow-auto bg-slate-100">
              {imageStatus === "loading" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <svg
                    className="h-6 w-6 animate-spin"
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
                  <p className="text-xs">Loading screenshot…</p>
                </div>
              )}

              {imageStatus === "error" && (
                <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200">
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
                        d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      Couldn&rsquo;t load this screenshot
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      It may not have finished saving yet, or the file is
                      missing.
                    </p>
                  </div>
                  <button
                    onClick={() => setImageStatus("loading")}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    Try again
                  </button>
                </div>
              )}

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={showScreenshot ? screenshotUrl : "idle"}
                src={screenshotUrl}
                alt={`Screenshot for ${job.title}`}
                onLoad={() => setImageStatus("loaded")}
                onError={() => setImageStatus("error")}
                className={`max-h-[calc(90vh-56px)] w-auto max-w-full object-contain transition-opacity duration-200 ${
                  imageStatus === "loaded" ? "opacity-100" : "opacity-0"
                }`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
