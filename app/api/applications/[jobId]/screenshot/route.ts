import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ jobId: string }> }
) {
    const { jobId } = await params;
    const db = await getDb();
    const job = db.data.jobs.find((j) => j.jobId === jobId);

    if (!job || !job.screenshotPath) {
        return NextResponse.json({ error: 'Screenshot not available' }, { status: 404 });
    }

    const absolutePath = path.resolve(process.cwd(), job.screenshotPath);

    try {
        const fileBuffer = await fs.readFile(absolutePath);
        return new NextResponse(fileBuffer, {
            headers: { 'Content-Type': 'image/png' },
        });
    } catch {
        return NextResponse.json({ error: 'Screenshot file missing on disk' }, { status: 404 });
    }
}