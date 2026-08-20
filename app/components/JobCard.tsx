"use client";

import { useState } from "react";
import type { Job } from "@/lib/types";
import StatusBadge from "./StatusBadge";

interface JobCardProps {
  job: Job;
  onApply: (jobId: string) => void;
  isApplying: boolean;
}

export default function JobCard({ job, onApply, isApplying }: JobCardProps) {
  const [showScreenshot, setShowScreenshot] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg p-5 flex flex-col gap-3 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-gray-900">{job.title}</h3>

          <p className="text-sm text-gray-500">
            {job.company} · {job.location}
          </p>
        </div>

        <StatusBadge status={job.status} />
      </div>

      <p className="text-sm text-gray-600 line-clamp-3">{job.description}</p>

      {job.status === "FAILED" && job.failureReason && (
        <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">
          {job.failureReason}
        </p>
      )}

      <div className="flex items-center gap-2 mt-1 flex-wrap">
        <a
          href={job.jobUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm px-3 py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          View Job
        </a>

        <button
          onClick={() => onApply(job.jobId)}
          disabled={isApplying || job.status === "PROCESSING"}
          className="text-sm px-3 py-1.5 rounded bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {job.status === "PROCESSING" ? "Applying…" : "Apply"}
        </button>

        {job.screenshotPath && (
          <button
            onClick={() => setShowScreenshot(true)}
            className="text-sm px-3 py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            View Screenshot
          </button>
        )}
      </div>

      {showScreenshot && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setShowScreenshot(false)}
        >
          <img
            src={`/api/applications/${job.jobId}/screenshot`}
            alt={`Screenshot for ${job.title}`}
            className="max-h-[90vh] max-w-full rounded shadow-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
