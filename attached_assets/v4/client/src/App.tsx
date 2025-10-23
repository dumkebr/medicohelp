
import "./styles/theme.css?ver=2025-10-23-09";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import ChatPanel from "./pages/ChatPanel";

export default function App(){
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing/>} />
        <Route path="/chat" element={<ChatPanel/>} />
        <Route path="*" element={<Navigate to="/" replace/>} />
      </Routes>
    </HashRouter>
  );
}
