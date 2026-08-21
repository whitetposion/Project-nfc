import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminGate } from "./auth/AdminGate";
import { AdminNav } from "./components/AdminNav";
import { Dashboard } from "./pages/Dashboard";
import { ProductsPage } from "./pages/ProductsPage";
import { ProductEditor } from "./pages/ProductEditor";
import { AdminOrdersPage } from "./pages/AdminOrdersPage";
import { TemplateEditor } from "./pages/TemplateEditor";
import "@gifting/ui/src/tokens.css";
import "./auth/gate.css";
import "./styles.css";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AdminGate>
        <BrowserRouter>
          <AdminNav />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductEditor />} />
            <Route path="/orders" element={<AdminOrdersPage />} />
            <Route path="/templates/new" element={<TemplateEditor />} />
          </Routes>
        </BrowserRouter>
      </AdminGate>
    </QueryClientProvider>
  </React.StrictMode>
);
