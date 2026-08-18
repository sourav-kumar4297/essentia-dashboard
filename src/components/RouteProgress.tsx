"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

interface NavProgressValue {
  pendingHref: string;
  startNav: (href: string) => void;
}

const NavProgressContext = createContext<NavProgressValue>({
  pendingHref: "",
  startNav: () => {},
});

export function useNavProgress() {
  return useContext(NavProgressContext);
}

function pathOf(href: string) {
  return href.split("?")[0];
}

export function NavProgressProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState("");
  const [bar, setBar] = useState<"idle" | "going" | "done">("idle");
  const [width, setWidth] = useState(0);
  const pendingRef = useRef(false);

  const startNav = useCallback(
    (href: string) => {
      if (pathOf(href) === pathname && !href.includes("?")) return;
      pendingRef.current = true;
      setPendingHref(href);
      setBar("going");
      setWidth(14);
      requestAnimationFrame(() => setWidth(72));
    },
    [pathname],
  );

  useEffect(() => {
    if (!pendingRef.current) {
      setPendingHref("");
      return;
    }
    pendingRef.current = false;
    setPendingHref("");
    setWidth(100);
    setBar("done");
    const t = setTimeout(() => {
      setBar("idle");
      setWidth(0);
    }, 280);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <NavProgressContext.Provider value={{ pendingHref, startNav }}>
      {bar !== "idle" && (
        <div
          className={bar === "done" ? "route-progress is-done" : "route-progress"}
          aria-hidden
        >
          <div className="route-progress-bar" style={{ width: `${width}%` }} />
        </div>
      )}
      {children}
    </NavProgressContext.Provider>
  );
}
