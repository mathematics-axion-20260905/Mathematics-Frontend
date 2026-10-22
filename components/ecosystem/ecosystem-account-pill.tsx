"use client";

import React, { useEffect, useState } from "react";
import { Check, Mail, User, X } from "lucide-react";
import {
    connectGmailAccount,
    disconnectEcosystemAccount,
    getEcosystemAccount,
    subscribeEcosystemAccount,
    type EcosystemAccount,
} from "@/lib/ecosystem/identity";

export function EcosystemAccountPill() {
    const [account, setAccount] = useState<EcosystemAccount | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [emailInput, setEmailInput] = useState("");

    useEffect(() => {
        setAccount(getEcosystemAccount());
        const unsubscribe = subscribeEcosystemAccount((acc) => {
            setAccount(acc);
        });
        return unsubscribe;
    }, []);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (emailInput.trim() && emailInput.includes("@")) {
            const acc = connectGmailAccount(emailInput.trim());
            setAccount(acc);
            setIsEditing(false);
        }
    };

    return (
        <div className="relative inline-flex items-center">
            {account ? (
                <button
                    type="button"
                    onClick={() => {
                        setEmailInput(account.email);
                        setIsEditing(!isEditing);
                    }}
                    title="Yagona Gmail hisobi (ekotizim bo'ylab bog'langan)"
                    className="flex items-center gap-1.5 rounded-full border border-border/70 bg-background/80 px-2.5 py-1 text-[11px] font-medium text-foreground transition hover:border-foreground/40 hover:bg-muted/40"
                >
                    <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500/10 text-red-500 font-bold text-[9px]">
                        G
                    </span>
                    <span className="max-w-[130px] truncate text-muted-foreground">{account.email}</span>
                </button>
            ) : (
                <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1 rounded-full border border-dashed border-indigo-500/40 bg-indigo-500/10 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20"
                >
                    <Mail className="h-3 w-3" />
                    <span>Gmail ulash</span>
                </button>
            )}

            {isEditing && (
                <div className="absolute right-0 top-8 z-50 w-72 rounded-2xl border border-border bg-card p-3 shadow-xl backdrop-blur-md animate-in fade-in-50">
                    <div className="flex items-center justify-between border-b border-border/50 pb-2 text-xs">
                        <span className="font-bold text-foreground">Yagona Gmail hisobi</span>
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="rounded p-1 text-muted-foreground hover:bg-muted"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    <form onSubmit={handleSave} className="mt-2.5 space-y-2">
                        <p className="text-[10px] leading-relaxed text-muted-foreground">
                            Barcha dasturlar (Math, Writer, Notebook) bitta Gmail bilan bog'lanadi va ob'yektlar avtomatik sinxronlanadi.
                        </p>
                        <input
                            type="email"
                            required
                            placeholder="username@gmail.com"
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            className="w-full rounded-xl border border-border/80 bg-background px-3 py-1.5 text-xs outline-none focus:border-indigo-500"
                        />
                        <div className="flex items-center justify-between gap-2 pt-1">
                            {account && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        disconnectEcosystemAccount();
                                        setAccount(null);
                                        setIsEditing(false);
                                    }}
                                    className="text-[10px] text-red-500 hover:underline"
                                >
                                    Uzish
                                </button>
                            )}
                            <button
                                type="submit"
                                className="ml-auto flex items-center gap-1 rounded-xl bg-foreground px-3 py-1 text-xs font-bold text-background hover:opacity-90"
                            >
                                <Check className="h-3 w-3" />
                                <span>Saqlash</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
