import { useEffect } from "react";

/**
 * Keeps a CSS custom property (--app-height) in sync with the current viewport height.
 * Mobile browsers often use dynamic toolbars that change `100vh`, so we compute the
 * actual inner height and expose it for layout containers.
 */
export function useViewportHeight() {
  useEffect(() => {
    const updateViewportHeight = () => {
      if (typeof window === "undefined") return;
      document.documentElement.style.setProperty("--app-height", `${window.innerHeight}px`);
    };

    updateViewportHeight();
    window.addEventListener("resize", updateViewportHeight);
    window.addEventListener("orientationchange", updateViewportHeight);
    return () => {
      window.removeEventListener("resize", updateViewportHeight);
      window.removeEventListener("orientationchange", updateViewportHeight);
    };
  }, []);
}

export default useViewportHeight;
