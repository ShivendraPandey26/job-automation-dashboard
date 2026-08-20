import { getDb } from '@/lib/db';
import { mapJob } from './mapJob';

const BOARD_SLUG = process.env.GREENHOUSE_BOARD_SLUG ?? 'sigmacomputing';
const COMPANY_DISPLAY_NAME = 'Sigma Computing';
const MAX_JOBS = 15;

export async function scrapeJobs() {
    const url = `https://boards-api.greenhouse.io/v1/boards/${BOARD_SLUG}/jobs?content=true`;

    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Greenhouse API responded with ${res.status}`);
    }

    const data = await res.json();
    const rawJobs = data.jobs as any[];

    const mapped = rawJobs.map((raw) => mapJob(raw, COMPANY_DISPLAY_NAME));

    const deduped = Array.from(
        new Map(mapped.map((job) => [job.jobId, job])).values()
    );

    const finalJobs = deduped.slice(0, MAX_JOBS);

    const db = await getDb();
    db.data.jobs = finalJobs;
    await db.write();

    return finalJobs;
}