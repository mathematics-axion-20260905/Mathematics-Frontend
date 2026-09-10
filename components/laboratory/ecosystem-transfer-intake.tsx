"use client";

import React from "react";

import { importLocalScientificObject } from "@/lib/ecosystem/local-object-store";
import { discardScientificObjectTransfer, fetchScientificObjectTransfer } from "@/lib/ecosystem/transfer";

export function EcosystemTransferIntake() {
    const [message, setMessage] = React.useState<string | null>(null);

    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const transferId = params.get("transferId");
        if (params.get("source") !== "transfer" || !transferId) return;

        void fetchScientificObjectTransfer(transferId)
            .then(async (transfer) => {
                const object = await importLocalScientificObject(transfer.payload);
                await discardScientificObjectTransfer(transferId);
                setMessage(`Scientific Object received: ${object.title}`);
            })
            .catch((error) => setMessage(error instanceof Error ? error.message : "Scientific Object transfer failed."));
    }, []);

    if (!message) return null;
    return <div className="mx-auto mt-4 max-w-6xl rounded-xl border border-[var(--ax-work-line)] bg-[var(--ax-surface)] px-4 py-3 text-xs text-[var(--ax-text-soft)]">{message}</div>;
}
