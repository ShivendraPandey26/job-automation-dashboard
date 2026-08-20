import { createJob, type Job } from '@/lib/db';

interface RawGreenhouseJob {
    id: number;
    title: string;
    location: { name: string };
    absolute_url: string;
    content?: string;
}

export function mapJob(raw: RawGreenhouseJob, source: string): Job {
    return createJob({
        jobId: String(raw.id),
        title: raw.title,
        company: source,
        location: raw.location?.name ?? 'Not specified',
        description: stripHtml(raw.content ?? '').slice(0, 300),
        jobUrl: raw.absolute_url,
        applicationUrl: raw.absolute_url,
        source,
    });
}

function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}