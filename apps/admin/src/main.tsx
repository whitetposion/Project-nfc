import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminGate } from "./auth/AdminGate";
import { Dashboard } from "./pages/Dashboard";
import { TemplateEditor } from "./pages/TemplateEditor";
import "@gifting/ui/src/tokens.css";
import "./auth/gate.css";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AdminGate>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/templates/new" element={<TemplateEditor />} />
          </Routes>
        </BrowserRouter>
      </AdminGate>
    </QueryClientProvider>
  </React.StrictMode>
);
