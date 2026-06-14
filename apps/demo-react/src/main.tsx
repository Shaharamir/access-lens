import React from "react";
import { createRoot } from "react-dom/client";
import "@workspace/ui/globals.css";
import { App } from "./App.js";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Missing #root element");
}

createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
