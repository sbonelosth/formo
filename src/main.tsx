import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
    <div className="relative min-h-screen">
        <App />
        <footer className="absolute bottom-0 left-0 right-0 border-t border-footer py-6">
            <div className="container mx-auto px-4 text-center">
                <p className="mono-label text-muted-foreground text-[0.625rem]">
                    © {new Date().getFullYear()} abumanga project. All rights reserved.
                </p>
            </div>
        </footer>
    </div>
);
