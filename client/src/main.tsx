import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { BUILD_TIME, VERSION } from "./force-reload";

// 🔥 CACHE KILLER: Limpar service workers e cache do navegador
async function killCache() {
  console.log("🧹 Limpando cache e service workers...");
  
  // Matar service workers
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(r => r.unregister()));
  }
  
  // Limpar cache storage
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
  }
  
  console.log("✅ Cache limpo!");
}

killCache().catch(console.error);

console.log(`🎨 MédicoHelp ${VERSION} - Build: ${BUILD_TIME}`);

createRoot(document.getElementById("root")!).render(<App />);
