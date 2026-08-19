import { chromium } from 'playwright';
import path from 'path';
import { fillKnownFields } from './fieldMapper';
import { getDb, type Job } from '@/lib/db';
import candidateData from '@/data/candidate.json';

function guardAgainstSubmit(buttonName: string) {
    console.warn(
        `[SAFETY GUARD] Reached submit stage for "${buttonName}". Refusing to click — stops here by design.`
    );
}

export async function applyToJob(job: Job): Promise<void> {
    const db = await getDb();
    const target = db.data.jobs.find((j) => j.jobId === job.jobId);
    if (!target) return;

    target.status = 'PROCESSING';
    await db.write();

    const browser = await chromium.launch({ headless: true });

    try {
        const page = await browser.newPage();
        await page.goto(job.applicationUrl, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1500);

        // Click Apply if it's a separate button (adjust based on what you found in 6.4)
        const applyButton = page.getByRole('link', { name: /apply/i }).first();
        if (await applyButton.count() > 0) {
            await applyButton.click();
            await page.waitForTimeout(1500);
        }

        // CAPTCHA check — before attempting anything else
        const captchaFrame = page.frames().find(
            (f) => /recaptcha|hcaptcha/i.test(f.url())
        );
        if (captchaFrame) {
            target.status = 'FAILED';
            target.failureReason = 'CAPTCHA detected — manual intervention required';
            await db.write();
            await browser.close();
            return;
        }

        // Adjust this line based on what you found in 6.5 (iframe or not)
        const formContext = page.frameLocator('iframe').first();
        // If your form is NOT in an iframe, use `page` directly instead:
        // const formContext = page;

        const { filled, skipped } = await fillKnownFields(formContext, candidateData);
        console.log(`Job ${job.jobId} — filled: ${filled.length}, skipped: ${skipped.length}`);

        target.status = 'FORM_FILLED';
        await db.write();

        const resumeAbsolutePath = path.resolve(process.cwd(), candidateData.resumePath);
        const fileInput = formContext.locator('input[type="file"]').first();
        if (await fileInput.count() > 0) {
            await fileInput.setInputFiles(resumeAbsolutePath);
            await page.waitForTimeout(1500);
        }

        const submitButton = formContext.getByRole('button', { name: /submit application/i });
        const submitVisible =
            (await submitButton.count()) > 0 && (await submitButton.first().isVisible());

        if (submitVisible) {
            guardAgainstSubmit('Submit Application');
            target.status = 'READY_FOR_SUBMISSION';
            await db.write();

            const screenshotPath = `screenshots/job_${job.jobId}.png`;
            await page.screenshot({ path: screenshotPath, fullPage: true });

            target.status = 'SCREENSHOT_CAPTURED';
            target.screenshotPath = screenshotPath;
            await db.write();
        } else {
            target.status = 'FAILED';
            target.failureReason = 'Could not detect final submit stage';
            await db.write();
        }
    } catch (err) {
        target.status = 'FAILED';
        target.failureReason = (err as Error).message;
        await db.write();
    } finally {
        await browser.close();
    }
}