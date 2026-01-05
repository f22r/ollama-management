/**
 * BM25 + Semantic Hybrid Search for RAG
 * 
 * Combines keyword-based BM25 scoring with semantic similarity
 * for fast and accurate document retrieval.
 */

// BM25 parameters
const K1 = 1.5;  // Term frequency saturation
const B = 0.75;  // Document length normalization

interface Document {
    id: string;
    content: string;
    source?: string;
}

interface SearchResult {
    id: string;
    content: string;
    source?: string;
    score: number;
    bm25Score: number;
    semanticScore: number;
}

/**
 * Tokenize text into terms
 */
function tokenize(text: string): string[] {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(term => term.length > 1);
}

/**
 * Calculate term frequency in a document
 */
function termFrequency(term: string, tokens: string[]): number {
    return tokens.filter(t => t === term).length;
}

/**
 * Calculate Inverse Document Frequency
 */
function idf(term: string, allDocTokens: string[][]): number {
    const docsWithTerm = allDocTokens.filter(tokens => tokens.includes(term)).length;
    if (docsWithTerm === 0) return 0;
    return Math.log((allDocTokens.length - docsWithTerm + 0.5) / (docsWithTerm + 0.5) + 1);
}

/**
 * Calculate BM25 score for a document given a query
 */
function bm25Score(
    queryTokens: string[],
    docTokens: string[],
    allDocTokens: string[][],
    avgDocLength: number
): number {
    let score = 0;
    const docLength = docTokens.length;

    for (const term of queryTokens) {
        const tf = termFrequency(term, docTokens);
        const idfValue = idf(term, allDocTokens);

        const numerator = tf * (K1 + 1);
        const denominator = tf + K1 * (1 - B + B * (docLength / avgDocLength));

        score += idfValue * (numerator / denominator);
    }

    return score;
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
}

/**
 * Get embeddings from Ollama
 */
async function getEmbedding(text: string, model: string = 'nomic-embed-text'): Promise<number[]> {
    try {
        const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
        const response = await fetch(`${ollamaUrl}/api/embeddings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model,
                prompt: text,
            }),
        });

        if (!response.ok) {
            console.warn('Embedding API failed, falling back to BM25 only');
            return [];
        }

        const data = await response.json();
        return data.embedding || [];
    } catch (error) {
        console.warn('Failed to get embedding:', error);
        return [];
    }
}

/**
 * Hybrid search combining BM25 and semantic search
 * 
 * @param query - Search query
 * @param documents - Array of documents to search
 * @param options - Search options
 * @returns Ranked search results
 */
export async function hybridSearch(
    query: string,
    documents: Document[],
    options: {
        topK?: number;
        bm25Weight?: number;
        semanticWeight?: number;
        embeddingModel?: string;
        useSemanticSearch?: boolean;
    } = {}
): Promise<SearchResult[]> {
    const {
        topK = 10,
        bm25Weight = 0.5,
        semanticWeight = 0.5,
        embeddingModel = 'nomic-embed-text',
        useSemanticSearch = true,
    } = options;

    if (documents.length === 0) return [];

    // Tokenize all documents
    const allDocTokens = documents.map(doc => tokenize(doc.content));
    const queryTokens = tokenize(query);

    // Calculate average document length
    const avgDocLength = allDocTokens.reduce((sum, tokens) => sum + tokens.length, 0) / allDocTokens.length;

    // Calculate BM25 scores
    const bm25Scores = documents.map((doc, i) => ({
        id: doc.id,
        content: doc.content,
        source: doc.source,
        bm25Score: bm25Score(queryTokens, allDocTokens[i], allDocTokens, avgDocLength),
    }));

    // Normalize BM25 scores
    const maxBm25 = Math.max(...bm25Scores.map(r => r.bm25Score), 0.001);
    const normalizedBm25 = bm25Scores.map(r => ({
        ...r,
        bm25ScoreNorm: r.bm25Score / maxBm25,
    }));

    // Get semantic scores if enabled
    let finalResults: SearchResult[];

    if (useSemanticSearch) {
        // Get query embedding
        const queryEmbedding = await getEmbedding(query, embeddingModel);

        if (queryEmbedding.length > 0) {
            // Get document embeddings (in practice, these should be pre-computed and stored)
            const docEmbeddings = await Promise.all(
                documents.map(doc => getEmbedding(doc.content.slice(0, 512), embeddingModel))
            );

            // Calculate semantic scores
            const semanticScores = docEmbeddings.map(embedding =>
                embedding.length > 0 ? cosineSimilarity(queryEmbedding, embedding) : 0
            );

            // Normalize semantic scores
            const maxSemantic = Math.max(...semanticScores, 0.001);
            const normalizedSemantic = semanticScores.map(s => s / maxSemantic);

            // Combine scores using Reciprocal Rank Fusion (RRF) style weighting
            finalResults = normalizedBm25.map((r, i) => ({
                id: r.id,
                content: r.content,
                source: r.source,
                bm25Score: r.bm25Score,
                semanticScore: semanticScores[i],
                score: (bm25Weight * r.bm25ScoreNorm) + (semanticWeight * normalizedSemantic[i]),
            }));
        } else {
            // Fallback to BM25 only
            finalResults = normalizedBm25.map(r => ({
                id: r.id,
                content: r.content,
                source: r.source,
                bm25Score: r.bm25Score,
                semanticScore: 0,
                score: r.bm25ScoreNorm,
            }));
        }
    } else {
        // BM25 only
        finalResults = normalizedBm25.map(r => ({
            id: r.id,
            content: r.content,
            source: r.source,
            bm25Score: r.bm25Score,
            semanticScore: 0,
            score: r.bm25ScoreNorm,
        }));
    }

    // Sort by combined score and return top K
    return finalResults
        .filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
}

/**
 * Fast BM25-only search (no embeddings required)
 * Use this for quick keyword search
 */
export function quickSearch(
    query: string,
    documents: Document[],
    topK: number = 10
): SearchResult[] {
    if (documents.length === 0) return [];

    const allDocTokens = documents.map(doc => tokenize(doc.content));
    const queryTokens = tokenize(query);
    const avgDocLength = allDocTokens.reduce((sum, tokens) => sum + tokens.length, 0) / allDocTokens.length;

    const results = documents.map((doc, i) => ({
        id: doc.id,
        content: doc.content,
        source: doc.source,
        bm25Score: bm25Score(queryTokens, allDocTokens[i], allDocTokens, avgDocLength),
        semanticScore: 0,
        score: 0,
    }));

    // Normalize and set as final score
    const maxScore = Math.max(...results.map(r => r.bm25Score), 0.001);
    results.forEach(r => r.score = r.bm25Score / maxScore);

    return results
        .filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
}

/**
 * Highlight matched terms in text
 */
export function highlightMatches(text: string, query: string): string {
    const queryTerms = tokenize(query);
    let result = text;

    for (const term of queryTerms) {
        const regex = new RegExp(`\\b(${term})\\b`, 'gi');
        result = result.replace(regex, '**$1**');
    }

    return result;
}
