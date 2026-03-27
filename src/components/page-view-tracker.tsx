"use client";

import { useEffect, useRef } from "react";
import { logPageView } from "@/lib/analytics";

export function PageViewTracker({ listingId }: { listingId: string }) {
    const tracked = useRef(false);

    useEffect(() => {
        if (!tracked.current) {
            logPageView(listingId);
            tracked.current = true;
        }
    }, [listingId]);

    return null;
}
