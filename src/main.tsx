import "neurospark-voice";
import { createRoot } from "react-dom/client";
import { initClientMonitoring } from "./utils/monitoring";
import { registerPwaServiceWorker } from "./utils/pwa";
import { hydrateTextScaleSync } from "./utils/textScale";
import App from "./app/App";
import "./styles/index.css";

hydrateTextScaleSync();
initClientMonitoring();
registerPwaServiceWorker();
createRoot(document.getElementById("root")!).render(<App />);
  