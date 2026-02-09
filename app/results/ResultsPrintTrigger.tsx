"use client";

import { useEffect, useRef } from "react";

export default function ResultsPrintTrigger({ printNow }: { printNow: boolean }) {
  const done = useRef(false);

  useEffect(() => {
    if (!printNow || done.current) return;
    done.current = true;
    const t = setTimeout(() => window.print(), 500);
    return () => clearTimeout(t);
  }, [printNow]);

  return null;
}
