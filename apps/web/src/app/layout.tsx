import { Outlet } from "react-router-dom";
import { AuthProvider } from "../context/auth.js";
import { SWRProvider } from "../lib/swr.js";

export function RootLayout() {
  return (
    <AuthProvider>
      <SWRProvider>
        <Outlet />
      </SWRProvider>
    </AuthProvider>
  );
}
