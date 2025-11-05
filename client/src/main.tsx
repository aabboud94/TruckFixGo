import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Prevent infinite reload loop caused by Vite HMR bug
(() => {
  const RELOAD_KEY = 'vite_reload_time';
  const MAX_RELOADS = 3;
  const TIME_WINDOW = 2000; // 2 seconds
  
  const now = Date.now();
  const reloadTimes = JSON.parse(sessionStorage.getItem(RELOAD_KEY) || '[]');
  
  // Clean old entries
  const recentReloads = reloadTimes.filter((time: number) => now - time < TIME_WINDOW);
  
  if (recentReloads.length >= MAX_RELOADS) {
    // Too many reloads in short time, stop the loop
    console.warn('[HMR] Detected reload loop, stopping further reloads');
    // Clear the storage to reset after user manually refreshes
    sessionStorage.removeItem(RELOAD_KEY);
    
    // Override Vite HMR to prevent further reloads
    if (import.meta.hot) {
      // Disable HMR for this module
      import.meta.hot.dispose(() => {
        // Cleanup on dispose
      });
      // Don't accept updates
      import.meta.hot.accept(() => {
        // Do nothing on update
      });
    }
  } else {
    // Track this reload
    recentReloads.push(now);
    sessionStorage.setItem(RELOAD_KEY, JSON.stringify(recentReloads));
  }
})();

createRoot(document.getElementById("root")!).render(<App />);
