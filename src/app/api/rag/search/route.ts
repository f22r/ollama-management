import { NextRequest, NextResponse } from 'next/server';
import { getRagChunks } from '@/lib/db/queries';
import { hybridSearch, quickSearch, highlightMatches } from '@/lib/rag/hybrid-search';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            query,
            seasonId,
            topK = 10,
            useSemanticSearch = false,
            bm25Weight = 0.5,
            semanticWeight = 0.5,
        } = body;

        if (!query || !seasonId) {
            return NextResponse.json(
                { error: 'Query and seasonId are required' },
                { status: 400 }
            );
        }

        // Get approved chunks from the season
        const chunks = getRagChunks(seasonId, true);

        if (chunks.length === 0) {
            return NextResponse.json({ results: [], count: 0 });
        }

        // Format as documents
        const documents = chunks.map(chunk => ({
            id: chunk.id,
            content: chunk.content,
            source: chunk.source,
        }));

        let results;

        if (useSemanticSearch) {
            // Full hybrid search with embeddings
            results = await hybridSearch(query, documents, {
                topK,
                bm25Weight,
                semanticWeight,
            });
        } else {
            // Fast BM25-only search
            results = quickSearch(query, documents, topK);
        }

        // Add highlighted content
        const highlightedResults = results.map(r => ({
            ...r,
            highlighted: highlightMatches(r.content, query),
        }));

        return NextResponse.json({
            results: highlightedResults,
            count: highlightedResults.length,
            totalChunks: chunks.length,
            searchType: useSemanticSearch ? 'hybrid' : 'bm25',
        });
    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json(
            { error: 'Search failed' },
            { status: 500 }
        );
    }
}
