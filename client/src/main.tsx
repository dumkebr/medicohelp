import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { BUILD_TIME, VERSION } from "./force-reload";

console.log(`🎨 MédicoHelp ${VERSION} - Build: ${BUILD_TIME}`);

createRoot(document.getElementById("root")!).render(<App />);
