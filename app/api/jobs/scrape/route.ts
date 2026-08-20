import { NextResponse } from 'next/server';
import { scrapeJobs } from '@/scraper/scrape';

export async function POST() {
    try {
        const jobs = await scrapeJobs();
        return NextResponse.json({ success: true, count: jobs.length, jobs });
    } catch (err) {
        console.error('Scrape failed:', err);
        return NextResponse.json(
            { success: false, error: (err as Error).message },
            { status: 500 }
        );
    }
}