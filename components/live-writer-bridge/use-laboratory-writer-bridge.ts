"use client";

import React from "react";
import { fetchPublic } from "@/lib/api";
import {
    applyPublicationProfileToBlock,
    applyPublicationProfileToMarkdown,
} from "@/lib/laboratory-publication-profile";

import { type LiveWriterTargetOption } from "@/components/live-writer-bridge/use-live-writer-targets";
import {
    findLiveWriterTargetBySelection,
    type WriterBridgeBlockData,
    type WriterBridgePublicationProfile,
} from "@/lib/live-writer-bridge";
import { exportLocalScientificObject, createLocalScientificObject } from "@/lib/ecosystem/local-object-store";
import { getEcosystemObjectHref, getEcosystemTransferHref, type EcosystemApp } from "@/lib/ecosystem/apps";
import { publishScientificObjectTransfer } from "@/lib/ecosystem/transfer";
import { resolveActiveProjectId } from "@/lib/ecosystem/project-context";

type WriterBridgeExportState = "idle" | "copied" | "sent";
type WriterBridgeGuideMode = "copy" | "send" | null;

type UseLaboratoryWriterBridgeOptions = {
    ready: boolean;
    sourceLabel: string;
    liveTargets: LiveWriterTargetOption[];
    selectedLiveTargetId: string;
    setExportState: React.Dispatch<React.SetStateAction<WriterBridgeExportState>>;
    setGuideMode?: React.Dispatch<React.SetStateAction<WriterBridgeGuideMode>>;
    buildMarkdown: () => string;
    buildBlock: (targetId: string) => WriterBridgeBlockData;
    publicationProfile: WriterBridgePublicationProfile;
    getSavedResultMeta?: () => { id?: string | null; revision?: number | null; scientificObjectId?: string | null } | null;
    getDraftMeta?: (block: WriterBridgeBlockData) => {
        title?: string;
        abstract?: string;
        keywords?: string;
    };
};

export function useLaboratoryWriterBridge(options: UseLaboratoryWriterBridgeOptions) {
    const {
        ready,
        sourceLabel,
        liveTargets,
        selectedLiveTargetId,
        setExportState,
        setGuideMode,
        buildMarkdown,
        buildBlock,
        publicationProfile,
        getSavedResultMeta,
        getDraftMeta,
    } = options;

    const closeGuide = React.useCallback(() => {
        setGuideMode?.(null);
    }, [setGuideMode]);

    const copyMarkdownExport = React.useCallback(async () => {
        if (!ready) {
            return;
        }

        const block = applyPublicationProfileToBlock(buildBlock(`${sourceLabel.toLowerCase().replace(/\s+/g, "-")}-copy`), publicationProfile);
        await navigator.clipboard.writeText(applyPublicationProfileToMarkdown(buildMarkdown(), block, publicationProfile));
        setExportState("copied");
        closeGuide();
    }, [buildBlock, buildMarkdown, closeGuide, publicationProfile, ready, setExportState, sourceLabel]);

    const sendToApp = React.useCallback(async (targetApp: Extract<EcosystemApp, "notebook" | "writer">) => {
        if (!ready) {
            return;
        }

        const baseBlock = buildBlock(`${sourceLabel.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`);
        const block = applyPublicationProfileToBlock(baseBlock, publicationProfile);
        const savedMeta = getSavedResultMeta?.();
        if (savedMeta?.id) {
            block.savedResultId = savedMeta.id;
            block.savedResultRevision = savedMeta.revision ?? undefined;
        }
        const draftMeta = getDraftMeta?.(block);

        const activeProjectId = resolveActiveProjectId();
        // A lab can be opened directly, without a selected Project. Keep the
        // same Scientific Object transport in that case so cross-origin
        // deployments never depend on another app's localStorage.
        const transferProjectId = activeProjectId || "unassigned-transfer";
        if (targetApp === "writer" || targetApp === "notebook") {
            let objectId = savedMeta?.scientificObjectId || null;
            try {
                if (!objectId) {
                    const object = await createLocalScientificObject({
                        projectId: transferProjectId,
                        kind: "calculation",
                        domain: `mathematics/${sourceLabel.toLowerCase().replace(/\s+/g, "-")}`,
                        title: block.title,
                        sourceApp: "math",
                        payload: {
                            type: "laboratory-result",
                            title: block.title,
                            summary: block.summary,
                            report_markdown: applyPublicationProfileToMarkdown(buildMarkdown(), block, publicationProfile),
                            structured_payload: block,
                        },
                        metadata: draftMeta,
                        provenance: {
                            sourceApp: "math",
                            engine: "Axion Mathematics Laboratory",
                            executionTarget: "this-device",
                            finishedAt: new Date().toISOString(),
                        },
                    });
                    objectId = object.id;
                }
                const transfer = await publishScientificObjectTransfer(await exportLocalScientificObject(objectId));
                setExportState("sent");
                closeGuide();
                window.location.assign(getEcosystemTransferHref(targetApp, transfer.transferId, activeProjectId));
                return;
            } catch (error) {
                console.error("Scientific Object relay failed; falling back to same-origin object import", error);
                if (!activeProjectId || !objectId) {
                    return;
                }
                window.location.assign(getEcosystemObjectHref(targetApp, activeProjectId, objectId));
                return;
            }
        }
    }, [buildBlock, buildMarkdown, closeGuide, getDraftMeta, getSavedResultMeta, publicationProfile, ready, setExportState, sourceLabel]);

    const sendToWriter = React.useCallback(() => sendToApp("writer"), [sendToApp]);
    const sendToNotebook = React.useCallback(() => sendToApp("notebook"), [sendToApp]);

    const pushLiveResult = React.useCallback(() => {
        const run = async () => {
            if (!ready) {
                return;
            }

            const target = findLiveWriterTargetBySelection(liveTargets, selectedLiveTargetId);
            if (!target || !target.paperId) {
                return;
            }

            const block = applyPublicationProfileToBlock(buildBlock(target.id), publicationProfile);
            const savedMeta = getSavedResultMeta?.();
            block.savedResultId = savedMeta?.id ?? block.savedResultId ?? target.savedResultId;
            block.savedResultRevision = savedMeta?.revision ?? block.savedResultRevision ?? target.savedResultRevision;

            const response = await fetchPublic(`/api/builder/papers/${target.paperId}/live-sync/`, {
                method: "POST",
                body: JSON.stringify({
                    block_id: target.id,
                    block,
                    saved_result_id: block.savedResultId,
                }),
            });

            if (!response.ok) {
                throw new Error(`Live sync failed with status ${response.status}`);
            }
            closeGuide();
        };

        void run().catch((error) => {
            console.error("Failed to push live laboratory result", error);
        });
    }, [buildBlock, closeGuide, getSavedResultMeta, liveTargets, publicationProfile, ready, selectedLiveTargetId, sourceLabel]);

    return {
        copyMarkdownExport,
        sendToWriter,
        sendToNotebook,
        pushLiveResult,
    };
}
