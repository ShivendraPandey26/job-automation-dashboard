export type JobStatus =
    | 'NOT_STARTED'
    | 'PROCESSING'
    | 'FORM_FILLED'
    | 'READY_FOR_SUBMISSION'
    | 'SCREENSHOT_CAPTURED'
    | 'FAILED';

export interface Job {
    jobId: string;
    title: string;
    company: string;
    location: string;
    description: string;
    jobUrl: string;
    applicationUrl: string;
    source: string;
    status: JobStatus;
    screenshotPath: string | null;
    failureReason: string | null;
}

export interface BatchProgress {
    processed: number;
    total: number;
    running: boolean;
    startedAt: string | null;
    finishedAt: string | null;
}