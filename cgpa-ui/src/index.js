// src/index.js
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

// If your index.html has <div id="root"></div>
const container = document.getElementById("root");
const root = createRoot(container);

// React 18 entry
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
