import { createContext, useContext, useCallback, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

type TransitionType = "forwards" | "backwards" | "drill-in" | "drill-out" | "swap";

interface RouteTransitionContextValue {
  push: (url: string, transition?: TransitionType) => void;
  replace: (url: string) => void;
  back: () => void;
}

const RouteTransitionContext = createContext<RouteTransitionContextValue | null>(null);

function startTransition(cb: () => void) {
  if ("startViewTransition" in document) {
    (document as Document & { startViewTransition: (cb: () => void) => void }).startViewTransition(cb);
  } else {
    cb();
  }
}

export function RouteTransitionProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  const push = useCallback(
    (url: string, _transition?: TransitionType) => {
      startTransition(() => { void navigate(url); });
    },
    [navigate],
  );

  const replace = useCallback(
    (url: string) => {
      void navigate(url, { replace: true });
    },
    [navigate],
  );

  const back = useCallback(() => {
    void navigate(-1);
  }, [navigate]);

  return (
    <RouteTransitionContext.Provider value={{ push, replace, back }}>
      {children}
    </RouteTransitionContext.Provider>
  );
}

export function useRouteTransition(): RouteTransitionContextValue {
  const ctx = useContext(RouteTransitionContext);
  if (!ctx) throw new Error("useRouteTransition must be used within RouteTransitionProvider");
  return ctx;
}
