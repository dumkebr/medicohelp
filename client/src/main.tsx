import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css"; // Import direto (cache busting via HTML)
import "./styles/theme.css?v=2025-10-23-TEAL"; // Theme teal marcante
import { BUILD_TIME, VERSION } from "./force-reload";

const __BUILD_VERSION__ = "ATENDIMENTO-TEAL";

// 🔥 FORÇAR RELOAD TOTAL - Deletar TUDO
localStorage.clear();
sessionStorage.clear();

// 🔥 CACHE KILLER: Matar service workers e limpar caches antigos
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()));
  if (window.caches) caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
}

console.log(`🎨 MédicoHelp ${VERSION} - Build: ${BUILD_TIME} (v${__BUILD_VERSION__})`);

createRoot(document.getElementById("root")!).render(<App />);
