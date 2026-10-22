"use client";

export interface EcosystemAccount {
    email: string;
    displayName: string;
    avatarUrl?: string;
    provider: "google" | "local";
    connectedAt: string;
}

const STORAGE_KEY = "axion_ecosystem_account";
const BROADCAST_CHANNEL_NAME = "axion_ecosystem_identity";

const DEFAULT_ACCOUNT: EcosystemAccount = {
    email: "researcher@gmail.com",
    displayName: "Ilmiy Tadqiqotchi",
    provider: "google",
    connectedAt: new Date().toISOString(),
};

export function getEcosystemAccount(): EcosystemAccount {
    if (typeof window === "undefined") {
        return DEFAULT_ACCOUNT;
    }
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            return JSON.parse(raw) as EcosystemAccount;
        }
    } catch {
        // Fallback on parse error
    }
    return DEFAULT_ACCOUNT;
}

export function setEcosystemAccount(account: EcosystemAccount): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
    try {
        const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        bc.postMessage({ type: "ACCOUNT_CHANGED", account });
        bc.close();
    } catch {}
    window.dispatchEvent(new CustomEvent("axion:account_changed", { detail: account }));
}

export function connectGmailAccount(email: string, displayName?: string): EcosystemAccount {
    const account: EcosystemAccount = {
        email,
        displayName: displayName || email.split("@")[0],
        provider: "google",
        connectedAt: new Date().toISOString(),
    };
    setEcosystemAccount(account);
    return account;
}

export function disconnectEcosystemAccount(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
    try {
        const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        bc.postMessage({ type: "ACCOUNT_DISCONNECTED" });
        bc.close();
    } catch {}
    window.dispatchEvent(new CustomEvent("axion:account_changed", { detail: null }));
}

export function subscribeEcosystemAccount(callback: (account: EcosystemAccount | null) => void): () => void {
    if (typeof window === "undefined") return () => {};

    const handleCustom = (e: Event) => {
        const detail = (e as CustomEvent).detail;
        callback(detail);
    };

    let bc: BroadcastChannel | null = null;
    try {
        bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        bc.onmessage = (event) => {
            if (event.data?.type === "ACCOUNT_CHANGED") {
                callback(event.data.account);
            } else if (event.data?.type === "ACCOUNT_DISCONNECTED") {
                callback(null);
            }
        };
    } catch {}

    window.addEventListener("axion:account_changed", handleCustom);

    return () => {
        window.removeEventListener("axion:account_changed", handleCustom);
        bc?.close();
    };
}
