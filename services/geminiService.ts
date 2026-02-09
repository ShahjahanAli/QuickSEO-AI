
import { GoogleGenAI, Type } from "@google/genai";
import { AuditResult, AiInsight, ResearchResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeSecurityWithAi = async (results: AuditResult): Promise<AiInsight[]> => {
  try {
    const findings = results.securityFindings.map(f => ({
      title: f.title,
      status: f.status,
      severity: f.severity
    }));

    const prompt = `Act as a senior Web Security Engineer. Analyze these security findings for a website audit and provide 3-4 professional remediation insights.
    
    Current Findings: ${JSON.stringify(findings)}
    Security Score: ${results.security.score}/100

    Focus on the most critical risks (High Severity 'vulnerable' items).
    Return a JSON array of objects with fields: title, category (must be 'Security'), impact (High/Medium/Low), description, and recommendation.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              category: { type: Type.STRING },
              impact: { type: Type.STRING },
              description: { type: Type.STRING },
              recommendation: { type: Type.STRING },
            },
            required: ["title", "category", "impact", "description", "recommendation"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Gemini Security Analysis Error:", error);
    return [];
  }
};

export const analyzeBacklinksWithAi = async (results: AuditResult): Promise<AiInsight[]> => {
  try {
    const backlinkSummary = results.backlinks.list.map(l => ({
      domain: l.sourceUrl,
      da: l.authority,
      toxic: l.toxicity,
      type: l.type
    }));

    const prompt = `Analyze this website's backlink profile and provide 3-4 professional SEO insights.
    Profile Summary:
    - Total Backlinks: ${results.backlinks.total}
    - Referring Domains: ${results.backlinks.referringDomains}
    - Overall Toxicity: ${results.backlinks.overallToxicity}%
    - Sample Data: ${JSON.stringify(backlinkSummary.slice(0, 10))}

    Return the analysis as a JSON array of objects with fields: title, category, impact (High/Medium/Low), description, and recommendation.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              category: { type: Type.STRING },
              impact: { type: Type.STRING },
              description: { type: Type.STRING },
              recommendation: { type: Type.STRING },
            },
            required: ["title", "category", "impact", "description", "recommendation"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Gemini Backlink Analysis Error:", error);
    return [];
  }
};

export const getResearchData = async (url: string): Promise<ResearchResult> => {
  try {
    const domain = url.replace(/https?:\/\//, '').split('/')[0];
    const prompt = `Perform SEO research for the domain: ${domain}.
    I need keywords, search volume, and content ideas. Respond in JSON format.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mainKeywords: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  keyword: { type: Type.STRING },
                  volume: { type: Type.STRING },
                  difficulty: { type: Type.NUMBER },
                  strategy: { type: Type.STRING },
                },
                required: ["keyword", "volume", "difficulty", "strategy"]
              }
            },
            longTailKeywords: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  phrase: { type: Type.STRING },
                  intent: { type: Type.STRING },
                  opportunity: { type: Type.STRING },
                },
                required: ["phrase", "intent", "opportunity"]
              }
            },
            contentIdeas: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  format: { type: Type.STRING },
                  outline: { type: Type.STRING },
                },
                required: ["title", "format", "outline"]
              }
            }
          },
          required: ["mainKeywords", "longTailKeywords", "contentIdeas"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Research Error:", error);
    return { mainKeywords: [], longTailKeywords: [], contentIdeas: [] };
  }
};
