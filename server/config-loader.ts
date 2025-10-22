import fs from "fs";
import path from "path";

export interface ClinicoConfig {
  meta: {
    template: string;
    language: string;
    style: {
      uppercase: boolean;
      tone: string;
      show_references: boolean;
    };
  };
  behavior: {
    mode: string;
    description: string;
    universal: boolean;
  };
  guardrails: {
    never_invent_vitals: boolean;
    ask_if_missing_vitals: boolean;
    ask_prompt_examples: string[];
    must_follow_guidelines: string[];
    prohibited: string[];
    mandatory_phrases: {
      contraindications_prefix: string;
      dose_format: string;
    };
  };
  output: {
    title: string;
    sections: Array<{
      heading: string;
      body: string;
    }>;
    references: string[];
  };
  context_schema: {
    [key: string]: any;
  };
}

let cachedConfig: ClinicoConfig | null = null;

/**
 * Carrega a configuração do modo clínico do arquivo JSON
 */
export function loadClinicoConfig(): ClinicoConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    const configPath = path.join(process.cwd(), "config", "medicohelp.clinico.v1.json");
    const configContent = fs.readFileSync(configPath, "utf-8");
    cachedConfig = JSON.parse(configContent);
    
    console.log("✅ Configuração clínica carregada:", cachedConfig?.meta?.template);
    return cachedConfig!;
  } catch (error) {
    console.error("❌ Erro ao carregar config/medicohelp.clinico.v1.json:", error);
    
    // Fallback config mínima
    const fallbackConfig: ClinicoConfig = {
      meta: {
        template: "medicohelp.clinico.v1",
        language: "pt-BR",
        style: {
          uppercase: false,
          tone: "clinico-direto",
          show_references: false
        }
      },
      behavior: {
        mode: "CLINICO",
        description: "Responde de forma clínica e direta",
        universal: true
      },
      guardrails: {
        never_invent_vitals: true,
        ask_if_missing_vitals: true,
        ask_prompt_examples: [
          "Para definir a conduta corretamente, poderia me informar os sinais vitais atuais do paciente?"
        ],
        must_follow_guidelines: ["SBC/AMB/CFM", "ESC/AHA/ACC"],
        prohibited: [
          "inventar valores de sinais vitais",
          "supor estabilidade clínica sem dados"
        ],
        mandatory_phrases: {
          contraindications_prefix: "⚠️ Evitar se",
          dose_format: "Dose: {dose} {via} em {tempo}"
        }
      },
      output: {
        title: "",
        sections: [
          { heading: "1️⃣ Avaliar estabilidade / gravidade", body: "" },
          { heading: "2️⃣ Conduta principal", body: "" },
          { heading: "3️⃣ Investigar e corrigir causas", body: "" },
          { heading: "4️⃣ Suporte e monitorização", body: "" },
          { heading: "5️⃣ Critérios de internação / alta e seguimento", body: "" }
        ],
        references: []
      },
      context_schema: {}
    };
    
    cachedConfig = fallbackConfig;
    return fallbackConfig;
  }
}

/**
 * Constrói o system prompt usando a configuração carregada
 */
export function buildClinicoSystemPrompt(config: ClinicoConfig): string {
  const sections = config.output.sections
    .map(s => s.heading)
    .join("\n");

  const guardrails = `
GUARDRAILS OBRIGATÓRIOS:
- NUNCA invente: ${config.guardrails.prohibited.join(", ")}
- SEMPRE siga: ${config.guardrails.must_follow_guidelines.join(", ")}
- SEMPRE use "${config.guardrails.mandatory_phrases.contraindications_prefix}" para contraindicações
- Formato de dose: ${config.guardrails.mandatory_phrases.dose_format}

PERGUNTAR SE FALTAR DADOS:
${config.guardrails.ask_if_missing_vitals ? "Se sinais vitais, peso ou idade forem necessários para a conduta e não foram informados, PERGUNTE usando frases como:" : ""}
${config.guardrails.ask_prompt_examples.map(ex => `- "${ex}"`).join("\n")}
`.trim();

  return `
${config.behavior.description}

ESTRUTURA DA RESPOSTA (OBRIGATÓRIA):
${sections}

${guardrails}

IMPORTANTE:
- Nunca use checklist ou bullet points vazios
- Seja direto e objetivo como um médico experiente
- Forneça doses específicas e condutas práticas
- Se faltar informação crítica (PA, peso, idade), PERGUNTE antes de dar conduta
`.trim();
}
