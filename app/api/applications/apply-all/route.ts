import { NextResponse } from 'next/server';
import { applyToAll } from '@/automation/applyToAll';

export async function POST() {
    // Fire and forget, same pattern as the single-job apply route —
    // the whole batch can take minutes, the HTTP response must return instantly.
    applyToAll().catch((err) => {
        console.error('Unhandled error in applyToAll:', err);
    });

    return NextResponse.json({ message: 'Batch application started' });
}