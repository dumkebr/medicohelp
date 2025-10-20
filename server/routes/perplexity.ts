import { Router, Request, Response } from "express";
import fetch from "node-fetch";
import OpenAI from "openai";

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// GET /api/medsearch?q=... - Busca no PubMed
router.get("/api/medsearch", async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ error: "Parâmetro 'q' é obrigatório" });
    }

    // Step 1: esearch - buscar IDs
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=8&retmode=json`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json() as any;

    const ids = searchData.esearchresult?.idlist || [];
    if (ids.length === 0) {
      return res.json({ results: [] });
    }

    // Step 2: esummary - buscar detalhes
    const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json`;
    const summaryResponse = await fetch(summaryUrl);
    const summaryData = await summaryResponse.json() as any;

    const results = ids.map((id: string) => {
      const article = summaryData.result?.[id];
      if (!article) return null;

      return {
        id,
        title: article.title || "Título não disponível",
        journal: article.source || article.fulljournalname || "Revista não disponível",
        year: article.pubdate?.split(" ")[0] || "Ano não disponível",
        authors: article.authors?.map((a: any) => a.name) || [],
        url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`
      };
    }).filter(Boolean);

    res.json({ results });
  } catch (error: any) {
    console.error("Erro na busca PubMed:", error);
    res.status(500).json({ 
      error: "Erro ao buscar artigos",
      message: error.message 
    });
  }
});

// POST /api/medsummary - Resume fontes com citações
router.post("/api/medsummary", async (req: Request, res: Response) => {
  try {
    const { question, sources } = req.body;

    if (!question || !sources || !Array.isArray(sources)) {
      return res.status(400).json({ 
        error: "Campos 'question' e 'sources' (array) são obrigatórios" 
      });
    }

    // Construir bibliografia
    let bibliography = "";
    sources.forEach((source: any, index: number) => {
      bibliography += `[${index + 1}] ${source.title}. ${source.journal}, ${source.year}. ${source.url}\n`;
    });

    // Prompt para OpenAI
    const prompt = `Você é um assistente médico especializado.

Pergunta: ${question}

Fontes disponíveis:
${bibliography}

Com base nas fontes acima, forneça um resumo técnico respondendo à pergunta. Use citações no formato [n] ao mencionar informações específicas de cada fonte.

Ao final, inclua uma seção "Fontes:" listando todas as referências numeradas.

Seja conciso, técnico e baseie-se apenas nas fontes fornecidas.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: "Você é um assistente médico que resume literatura científica com citações precisas."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const summary = completion.choices[0]?.message?.content || "Resumo não disponível";

    res.json({ summary });
  } catch (error: any) {
    console.error("Erro ao gerar resumo:", error);
    res.status(500).json({ 
      error: "Erro ao gerar resumo",
      message: error.message 
    });
  }
});

export default router;
