import { JSONFilePreset } from 'lowdb/node';

// ---- Types ----

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

export interface DbSchema {
    jobs: Job[];
    batchProgress: BatchProgress;
}

const defaultData: DbSchema = {
    jobs: [],
    batchProgress: {
        processed: 0,
        total: 0,
        running: false,
        startedAt: null,
        finishedAt: null,
    },
};
type Database = Awaited<ReturnType<typeof JSONFilePreset<DbSchema>>>;

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
    if (!dbInstance) {
        dbInstance = await JSONFilePreset<DbSchema>(
            './data/db.json',
            defaultData
        );
    }

    return dbInstance;
}

// ---- Helper to build a properly-shaped job ----

type CreateJobInput = Pick<
    Job,
    | 'jobId'
    | 'title'
    | 'company'
    | 'location'
    | 'description'
    | 'jobUrl'
    | 'applicationUrl'
    | 'source'
>;

export function createJob(input: CreateJobInput): Job {
    return {
        ...input,
        status: 'NOT_STARTED',
        screenshotPath: null,
        failureReason: null,
    };
}

export interface BatchProgress {
    processed: number;
    total: number;
    running: boolean;
    startedAt: string | null;
    finishedAt: string | null;
}


export async function updateBatchProgress(fields: Partial<BatchProgress>): Promise<void> {
    const db = await getDb();
    Object.assign(db.data.batchProgress, fields);
    await db.write();
}