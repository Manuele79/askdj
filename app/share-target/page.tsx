"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function ShareTargetPage() {
  const params = useSearchParams();

  useEffect(() => {
    const url = params.get("url") || params.get("text");

    if (!url) {
      window.location.href = "/dj/TEST123";
      return;
    }

    // prendi ultimo evento salvato (guest)
    const eventCode = localStorage.getItem("dj_guest_event");

    if (eventCode) {
      // salva temporaneamente il link
      localStorage.setItem("dj_shared_link", url);

      // vai all'evento
      window.location.href = `/event/${eventCode}`;
    } else {
      // fallback: vai in DJ
      window.location.href = "/dj/TEST123";
    }
  }, [params]);

  return null;
}