import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ jobId: string }> }
) {
    const { jobId } = await params;
    const db = await getDb();
    const job = db.data.jobs.find((j) => j.jobId === jobId);

    if (!job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({
        status: job.status,
        failureReason: job.failureReason,
        screenshotPath: job.screenshotPath,
    });
}