import { Outlet } from "react-router-dom";
import { AuthProvider } from "../context/auth.js";
import { PvpProvider } from "../context/pvp.js";
import { ToastProvider } from "../context/toast.js";
import { SWRProvider } from "../lib/swr.js";
import { ErrorBoundary } from "../components/layout/ErrorBoundary.js";

export function RootLayout() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <PvpProvider>
          <ToastProvider>
            <SWRProvider>
              <Outlet />
            </SWRProvider>
          </ToastProvider>
        </PvpProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
