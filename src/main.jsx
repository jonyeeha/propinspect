import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import CompletePage from "./complete.jsx";

// Simple router: /complete?token=xxx goes to CompletePage, everything else to App
const isComplete = window.location.pathname === "/complete";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {isComplete ? <CompletePage /> : <App />}
  </React.StrictMode>
);
