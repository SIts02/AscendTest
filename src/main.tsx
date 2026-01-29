import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { preventDataLeakage } from "@/lib/secureEncryption";

if (import.meta.env.PROD) {
    preventDataLeakage();
}

createRoot(document.getElementById("root")!).render(<App />);