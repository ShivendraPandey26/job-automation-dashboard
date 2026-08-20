import { chromium, type Page, type FrameLocator } from 'playwright';
import path from 'path';
import { fillKnownFields } from './fieldMapper';
import { getDb, type Job } from '@/lib/db';
import candidateData from '@/data/candidate.json';

const NAVIGATION_TIMEOUT_MS = 20_000;
const SETTLE_DELAY_MS = 1500;

function guardAgainstSubmit(buttonName: string): void {
    console.warn(
        `[SAFETY GUARD] Reached submit stage for "${buttonName}". ` +
        `Refusing to click — automation stops here by design.`
    );
}

/** Phrases Greenhouse commonly shows when a posting is no longer accepting applicants. */
const CLOSED_POSTING_PATTERNS = [
    /no longer accepting applications/i,
    /position has been filled/i,
    /this job is no longer available/i,
];

async function updateStatus(
    jobId: string,
    fields: Partial<Pick<Job, 'status' | 'failureReason' | 'screenshotPath'>>
): Promise<void> {
    const db = await getDb();
    const target = db.data.jobs.find((j) => j.jobId === jobId);
    if (!target) return;
    Object.assign(target, fields);
    await db.write();
}

/** Detects whether the application form lives inside an iframe or directly on the page. */
async function resolveFormContext(page: Page): Promise<Page | FrameLocator> {
    const iframeCount = await page.locator('iframe').count();
    if (iframeCount > 0) {
        return page.frameLocator('iframe').first();
    }
    return page;
}

async function captureFailureEvidence(page: Page, jobId: string): Promise<string | null> {
    try {
        const evidencePath = `screenshots/job_${jobId}_failure.png`;
        await page.screenshot({ path: evidencePath, fullPage: true });
        return evidencePath;
    } catch {
        // If even the failure screenshot can't be captured, don't let that mask the real error.
        return null;
    }
}

export async function applyToJob(job: Job): Promise<void> {
    await updateStatus(job.jobId, { status: 'PROCESSING' });

    let browser;
    try {
        browser = await chromium.launch({ headless: true });
    } catch (err) {
        await updateStatus(job.jobId, {
            status: 'FAILED',
            failureReason: `Browser launch failed: ${(err as Error).message}`,
        });
        return;
    }

    try {
        const page = await browser.newPage();

        // --- Navigation ---
        try {
            await page.goto(job.applicationUrl, {
                waitUntil: 'domcontentloaded',
                timeout: NAVIGATION_TIMEOUT_MS,
            });
        } catch (err) {
            throw new Error(`Application page timeout or navigation failure: ${(err as Error).message}`);
        }
        await page.waitForTimeout(SETTLE_DELAY_MS);

        // --- Job no longer available ---
        const bodyText = (await page.textContent('body')) ?? '';
        const isClosed = CLOSED_POSTING_PATTERNS.some((pattern) => pattern.test(bodyText));
        if (isClosed) {
            const evidence = await captureFailureEvidence(page, job.jobId);
            await updateStatus(job.jobId, {
                status: 'FAILED',
                failureReason: 'Job posting is no longer available',
                screenshotPath: evidence,
            });
            return;
        }

        // --- Click "Apply" if the form isn't already on this page ---
        const applyButton = page.getByRole('link', { name: /apply/i }).first();
        if ((await applyButton.count()) > 0) {
            await applyButton.click();
            await page.waitForTimeout(SETTLE_DELAY_MS);
        }

        // --- CAPTCHA / anti-bot check — before attempting anything else ---
        const captchaFrame = page.frames().find((f) => /recaptcha|hcaptcha/i.test(f.url()));
        if (captchaFrame) {
            const evidence = await captureFailureEvidence(page, job.jobId);
            await updateStatus(job.jobId, {
                status: 'FAILED',
                failureReason: 'CAPTCHA detected — manual intervention required',
                screenshotPath: evidence,
            });
            return;
        }

        // --- Resolve form context (iframe vs. direct page), detected at runtime ---
        const formContext = await resolveFormContext(page);

        // --- Fill known fields ---
        const { filled, skipped } = await fillKnownFields(formContext, candidateData);
        console.log(`Job ${job.jobId} — filled: ${filled.length}, skipped: ${skipped.length}`);

        if (filled.length === 0) {
            // Nothing matched at all — almost always means the form/iframe structure
            // differs from what fillKnownFields expects, not a real "no fields" case.
            const evidence = await captureFailureEvidence(page, job.jobId);
            await updateStatus(job.jobId, {
                status: 'FAILED',
                failureReason: 'No known fields could be matched on this form',
                screenshotPath: evidence,
            });
            return;
        }

        await updateStatus(job.jobId, { status: 'FORM_FILLED' });

        // --- Resume upload ---
        try {
            const resumeAbsolutePath = path.resolve(process.cwd(), candidateData.resumePath);
            const fileInput = formContext.locator('input[type="file"]').first();
            if ((await fileInput.count()) > 0) {
                await fileInput.setInputFiles(resumeAbsolutePath);
                await page.waitForTimeout(SETTLE_DELAY_MS);
            }
        } catch (err) {
            console.warn(`Job ${job.jobId} — resume upload failed:`, (err as Error).message);
        }

        // --- Detect final stage ---
        const submitButton = formContext.getByRole('button', { name: /submit application/i });
        const submitVisible =
            (await submitButton.count()) > 0 && (await submitButton.first().isVisible());

        if (submitVisible) {
            guardAgainstSubmit('Submit Application');
            await updateStatus(job.jobId, { status: 'READY_FOR_SUBMISSION' });

            const screenshotPath = `screenshots/job_${job.jobId}.png`;
            await page.screenshot({ path: screenshotPath, fullPage: true });

            await updateStatus(job.jobId, {
                status: 'SCREENSHOT_CAPTURED',
                screenshotPath,
            });
        } else {
            const evidence = await captureFailureEvidence(page, job.jobId);
            await updateStatus(job.jobId, {
                status: 'FAILED',
                failureReason: 'Could not detect final submit stage',
                screenshotPath: evidence,
            });
        }
    } catch (err) {
        await updateStatus(job.jobId, {
            status: 'FAILED',
            failureReason: (err as Error).message,
        });
    } finally {
        await browser.close();
    }
}