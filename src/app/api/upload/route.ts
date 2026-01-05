
import { NextRequest, NextResponse } from 'next/server';
const pdf = require('pdf-parse');

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        let text = '';

        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
            const data = await pdf(buffer);
            text = data.text;
        } else {
            // Assume text/markdown
            text = buffer.toString('utf-8');
        }

        // Basic cleaning
        text = text.replace(/\n\s*\n/g, '\n\n').trim();

        return NextResponse.json({
            filename: file.name,
            text: text
        });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Failed to process file' }, { status: 500 });
    }
}
