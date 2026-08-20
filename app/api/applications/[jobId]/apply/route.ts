import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { applyToJob } from '@/automation/applyToJob';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ jobId: string }> }
) {
    const { jobId } = await params;
    const db = await getDb();
    const job = db.data.jobs.find((j) => j.jobId === jobId);

    if (!job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    applyToJob(job).catch((err) => {
        console.error(`Unhandled error applying to job ${jobId}:`, err);
    });

    return NextResponse.json({ message: 'Application started', jobId });
}