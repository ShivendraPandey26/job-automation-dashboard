import type { Page, FrameLocator } from 'playwright';

export interface Candidate {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    github: string;
    education: string;
    experience: string;
    skills: string[];
    resumePath: string;
}

type FormContext = Page | FrameLocator;

interface FieldResult {
    filled: string[];
    skipped: string[];
}

// Maps candidate data to common form labels
function buildFieldMap(
    candidate: Candidate
): Array<[RegExp, string]> {
    return [
        [/first name/i, candidate.firstName],
        [/last name/i, candidate.lastName],
        [/^email/i, candidate.email],
        [/phone/i, candidate.phone],
        [/location/i, candidate.location],
        [/linkedin/i, candidate.linkedin],
        [/github/i, candidate.github],
    ];
}

// Fills fields that can be identified by their labels
export async function fillKnownFields(
    formContext: FormContext,
    candidate: Candidate
): Promise<FieldResult> {
    const fieldMap = buildFieldMap(candidate);

    const filled: string[] = [];
    const skipped: string[] = [];

    for (const [labelPattern, value] of fieldMap) {
        try {
            const field = formContext
                .getByLabel(labelPattern)
                .first();

            const count = await field.count();

            if (count > 0) {
                await field.fill(value);

                filled.push(labelPattern.source);

                console.log(
                    `Filled field: ${labelPattern.source}`
                );
            } else {
                skipped.push(labelPattern.source);

                console.log(
                    `Skipped field: ${labelPattern.source}`
                );
            }
        } catch (error) {
            skipped.push(labelPattern.source);

            console.log(
                `Could not fill field: ${labelPattern.source}`
            );
        }
    }

    return {
        filled,
        skipped,
    };
}