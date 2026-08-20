import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const db = await getDb();
    const job = db.data.jobs.find((j) => j.jobId === id);

    if (!job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({ job });
}