import { NextResponse } from 'next/server';
import candidateData from '@/data/candidate.json';

export async function GET() {
    return NextResponse.json({ candidate: candidateData });
}