import { createRoot } from "react-dom/client";
import { initClientMonitoring } from "./utils/monitoring";
import { registerPwaServiceWorker } from "./utils/pwa";
import App from "./app/App";
import "./styles/index.css";

initClientMonitoring();
registerPwaServiceWorker();
createRoot(document.getElementById("root")!).render(<App />);
  