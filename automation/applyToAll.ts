import { getDb, updateBatchProgress } from '@/lib/db';
import { applyToJob } from './applyToJob';

export async function applyToAll(): Promise<void> {
    const db = await getDb();
    const jobs = db.data.jobs;

    await updateBatchProgress({
        processed: 0,
        total: jobs.length,
        running: true,
        startedAt: new Date().toISOString(),
        finishedAt: null,
    });

    for (const job of jobs) {
        try {
            await applyToJob(job);
        } catch (err) {
            // applyToJob already handles its own internal failures and writes
            // status: 'FAILED' to the job itself. This catch is a last-resort
            // safety net in case something outside that (e.g. a bug in applyToJob
            // itself) throws unexpectedly — it must NEVER be allowed to stop the loop.
            console.error(`Unexpected error processing job ${job.jobId}:`, err);
        }

        const current = await getDb();
        await updateBatchProgress({ processed: current.data.batchProgress.processed + 1 });
    }

    await updateBatchProgress({ running: false, finishedAt: new Date().toISOString() });
}