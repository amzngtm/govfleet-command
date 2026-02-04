import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { initializeSecurity } from "./security";

// Initialize government-grade security on app startup
if (typeof document !== "undefined") {
  // Dynamically import applySecurityHeaders to avoid chunking issues
  import("./security/securityHeaders").then(({ applySecurityHeaders }) => {
    applySecurityHeaders();
  });
  initializeSecurity();
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
