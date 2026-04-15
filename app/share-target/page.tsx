"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

function ShareHandler() {
  const params = useSearchParams();

  useEffect(() => {
    const url = params.get("url") || params.get("text");

    if (!url) {
      window.location.href = "/dj/TEST123";
      return;
    }

    const eventCode = localStorage.getItem("dj_guest_event");

    if (eventCode) {
      localStorage.setItem("dj_shared_link", url);
      window.location.href = `/event/${eventCode}`;
    } else {
      window.location.href = "/dj/TEST123";
    }
  }, [params]);

  return null;
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ShareHandler />
    </Suspense>
  );
}