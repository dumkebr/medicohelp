/* ===================== MÉDICOHELP - SCRIPT BASE (SPA React + Wouter) =====================
   - Integração com roteador interno via window.MedicoHelp.navigate(url)
   - Ganchos: createHistory (SOAP), openVoice, openUploader, atalhos (evidence, calculators, medprime)
   - Fallbacks seguros se a API global não existir
   ========================================================================== */

(function () {
  // ---- Rotas canônicas da plataforma --------------------------------------
  const ROUTES = {
    home: "/",
    history: "/",             // História Clínica (home após login)
    voice: "/",               // Modo Voz (chamada)
    upload: "/",              // Upload de exames e laudos
    calculators: "/medprime", // Calculadoras clínicas
    evidence: "/",            // Fundamentação teórica
    medprime: "/medprime",    // Posologia
    avancado: "/avancado"     // Hub avançado
  };

  // WhatsApp (Brasil) — número informado
  const WHATSAPP_NUMBER = "554491065757";
  const WHATSAPP_DEFAULT_MSG =
    "Olá, Dra. Clarice! Sou médico e quero testar o Modo Voz do MédicoHelp.";

  // ---- Utilidades ----------------------------------------------------------
  function ensureNamespace() {
    if (!window.MedicoHelp) window.MedicoHelp = {};
    return window.MedicoHelp;
  }

  function canUse(fn) {
    return typeof fn === "function";
  }

  function openWhatsApp(message = WHATSAPP_DEFAULT_MSG) {
    const link = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(link, "_blank", "noopener,noreferrer");
  }

  // ---- API pública (integra com Wouter via API global) ---------------------
  const api = ensureNamespace();

  /**
   * Navegação SPA (Wouter) — usa window.MedicoHelp.navigate(url)
   * Se não existir, cai pra window.location.href (tradicional).
   */
  api.navigate = function (routeKeyOrUrl) {
    const url = ROUTES[routeKeyOrUrl] || routeKeyOrUrl || "/";
    if (canUse(window.MedicoHelp.navigate)) {
      try {
        return window.MedicoHelp.navigate(url); // Wouter interno
      } catch {
        window.location.href = url; // fallback duro
      }
    } else {
      window.location.href = url; // fallback clássico
    }
  };

  /**
   * Abre História Clínica (SOAP por padrão)
   * Se houver handler nativo (__OPEN_HISTORY__), usa. Senão, navega para a rota com hash de modo.
   */
  api.createHistory = function ({ mode = "SOAP" } = {}) {
    if (canUse(window.__OPEN_HISTORY__)) return window.__OPEN_HISTORY__({ mode });
    // passa modo via hash/query pra tela ler
    api.navigate(`${ROUTES.history}#mode=${encodeURIComponent(mode)}`);
  };

  /**
   * Modo Voz — "ligar para a Dra. Clarice"
   * Se houver handler nativo (__OPEN_VOICE__), usa. Senão, abre WhatsApp.
   */
  api.openVoice = function () {
    if (canUse(window.__OPEN_VOICE__)) return window.__OPEN_VOICE__();
    openWhatsApp("Olá, Dra. Clarice! Quero iniciar o Modo Voz agora.");
  };

  /**
   * Upload de exames/laudos
   */
  api.openUploader = function () {
    if (canUse(window.__OPEN_UPLOADER__)) return window.__OPEN_UPLOADER__();
    api.navigate(ROUTES.upload);
  };

  // Acessos rápidos
  api.openCalculators = function () { api.navigate(ROUTES.calculators); };
  api.openEvidence    = function () { api.navigate(ROUTES.evidence);    };
  api.openMedPrime    = function () { api.navigate(ROUTES.medprime);     };

  // ---- Auto-bind de botões por data-attributes -----------------------------
  function bindButtons() {
    // data-mh-action="history|voice|upload|calculators|evidence|medprime|whatsapp"
    document.querySelectorAll("[data-mh-action]").forEach((el) => {
      const action = (el.getAttribute("data-mh-action") || "").toLowerCase().trim();

      el.addEventListener("click", (ev) => {
        ev.preventDefault();
        switch (action) {
          case "history":
            api.createHistory({ mode: el.getAttribute("data-mode") || "SOAP" });
            break;
          case "voice":
            api.openVoice();
            break;
          case "upload":
            api.openUploader();
            break;
          case "calculators":
            api.openCalculators();
            break;
          case "evidence":
            api.openEvidence();
            break;
          case "medprime":
            api.openMedPrime();
            break;
          case "whatsapp":
            openWhatsApp();
            break;
          default:
            if (action) api.navigate(action);
        }
      });
    });
  }

  // ---- Inicialização -------------------------------------------------------
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindButtons);
  } else {
    bindButtons();
  }

  // Log discreto
  try {
    console.debug("[MédicoHelp] script.js (SPA React + Wouter) carregado. Rotas:", ROUTES);
  } catch {}
})();
