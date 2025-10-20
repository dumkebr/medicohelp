/**
 * Clinical Evidence Research Service
 * 
 * Provides scientific literature search capabilities for medical professionals.
 * This service is REFERENCE-ONLY and should NEVER affect medical output logic.
 * 
 * Supported providers:
 * - PubMed (NIH/NCBI E-utilities) - Free, no API key required
 * - Generic search providers (optional, requires API key)
 */

import type { ScientificReference } from "@shared/schema";

// Environment configuration
const SEARCH_PROVIDER = process.env.SEARCH_PROVIDER || "pubmed";
const SEARCH_API_KEY = process.env.SEARCH_API_KEY;
const SEARCH_MAX_SOURCES = parseInt(process.env.SEARCH_MAX_SOURCES || "5", 10);

/**
 * Check if research service is configured and available
 */
export function isResearchAvailable(): boolean {
  // PubMed is always available (no API key required)
  if (SEARCH_PROVIDER === "pubmed") {
    return true;
  }
  
  // Other providers require API key
  return !!SEARCH_API_KEY;
}

/**
 * Search PubMed for scientific articles using NIH/NCBI E-utilities API
 * Free API, no authentication required
 */
async function searchPubMed(query: string, maxResults: number = 5): Promise<ScientificReference[]> {
  try {
    // Step 1: Search for article IDs
    const searchUrl = new URL("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi");
    searchUrl.searchParams.set("db", "pubmed");
    searchUrl.searchParams.set("term", query);
    searchUrl.searchParams.set("retmax", maxResults.toString());
    searchUrl.searchParams.set("retmode", "json");
    searchUrl.searchParams.set("sort", "relevance");

    const searchResponse = await fetch(searchUrl.toString());
    if (!searchResponse.ok) {
      throw new Error(`PubMed search failed: ${searchResponse.statusText}`);
    }

    const searchData = await searchResponse.json();
    const idList: string[] = searchData.esearchresult?.idlist || [];

    if (idList.length === 0) {
      return [];
    }

    // Step 2: Fetch article details
    const summaryUrl = new URL("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi");
    summaryUrl.searchParams.set("db", "pubmed");
    summaryUrl.searchParams.set("id", idList.join(","));
    summaryUrl.searchParams.set("retmode", "json");

    const summaryResponse = await fetch(summaryUrl.toString());
    if (!summaryResponse.ok) {
      throw new Error(`PubMed summary fetch failed: ${summaryResponse.statusText}`);
    }

    const summaryData = await summaryResponse.json();
    const results: ScientificReference[] = [];

    for (const id of idList) {
      const article = summaryData.result?.[id];
      if (!article) continue;

      // Extract authors
      const authors = article.authors
        ?.slice(0, 3)
        .map((a: any) => a.name)
        .join(", ") || "Unknown";

      // Extract publication year
      const year = article.pubdate?.split(" ")[0] || "";

      results.push({
        title: article.title || "Untitled",
        url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
        source: "PubMed",
        authors: authors + (article.authors?.length > 3 ? ", et al." : ""),
        year,
      });
    }

    return results;
  } catch (error: any) {
    console.error("PubMed search error:", error);
    throw new Error(`Erro ao buscar no PubMed: ${error.message}`);
  }
}

/**
 * Search for scientific articles using configured provider
 */
export async function searchScientificLiterature(
  query: string,
  maxSources: number = SEARCH_MAX_SOURCES
): Promise<ScientificReference[]> {
  // Validate max sources
  const validMaxSources = Math.min(Math.max(1, maxSources), 10);

  // Route to appropriate provider
  switch (SEARCH_PROVIDER) {
    case "pubmed":
      return await searchPubMed(query, validMaxSources);

    // Add other providers here in the future
    // case "perplexity":
    //   return await searchPerplexity(query, validMaxSources);

    default:
      throw new Error(`Provider não suportado: ${SEARCH_PROVIDER}`);
  }
}

/**
 * Log research query for analytics (optional)
 */
export function logResearchQuery(
  userId: string | null,
  query: string,
  provider: string,
  resultsCount: number
): void {
  // Log to analytics if needed (this is optional and non-blocking)
  // The actual logging will be done in the route handler
  console.log(`[Research Analytics] User: ${userId || 'anonymous'}, Provider: ${provider}, Query: "${query.substring(0, 50)}...", Results: ${resultsCount}`);
}
