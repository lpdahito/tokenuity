"use client";

import { useEffect, useState } from "react";

export function AnimatedEllipsis({ interval = 500 }: { interval?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setCount((c) => (c + 1) % 4), interval);
    return () => clearInterval(id);
  }, [interval]);

  return (
    <span aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span key={i} className={i < count ? "opacity-100" : "opacity-0"}>
          .
        </span>
      ))}
    </span>
  );
}