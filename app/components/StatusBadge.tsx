import type { JobStatus } from "@/lib/types";

const STATUS_STYLES: Record<JobStatus, string> = {
  NOT_STARTED: "bg-gray-100 text-gray-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  FORM_FILLED: "bg-indigo-100 text-indigo-700",
  READY_FOR_SUBMISSION: "bg-amber-100 text-amber-700",
  SCREENSHOT_CAPTURED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<JobStatus, string> = {
  NOT_STARTED: "Not Started",
  PROCESSING: "Processing…",
  FORM_FILLED: "Form Filled",
  READY_FOR_SUBMISSION: "Ready for Submission",
  SCREENSHOT_CAPTURED: "Screenshot Captured",
  FAILED: "Failed",
};

export default function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
