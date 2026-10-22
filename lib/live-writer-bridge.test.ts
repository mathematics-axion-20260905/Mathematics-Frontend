import { afterEach, describe, expect, it } from "vitest";

import {
    createLaboratoryWriterDraftHref,
    createLiveWriterPublishAck,
    createLiveWriterPublishMessage,
    extractWriterBridgeTargets,
    flattenStoredWriterTargets,
    markStoredWriterTargetAcknowledged,
    markStoredWriterTargetPending,
    queueWriterImport,
    readQueuedWriterImport,
    removeQueuedWriterImport,
    removeStoredWriterTargetSession,
    readStoredWriterTargetSyncs,
    serializeWriterBridgeBlock,
    upsertStoredWriterTargetSession,
} from "./live-writer-bridge";

afterEach(() => {
    window.localStorage.clear();
});

describe("live writer bridge storage", () => {
    it("stores and flattens writer targets", () => {
        upsertStoredWriterTargetSession({
            writerId: "writer-1",
            documentTitle: "Draft A",
            lastSeen: Date.now(),
            targets: [
                {
                    id: "target-1",
                    title: "Block A",
                    status: "waiting",
                    generatedAt: new Date().toISOString(),
                },
            ],
        });

        const targets = flattenStoredWriterTargets();
        expect(targets).toHaveLength(1);
        expect(targets[0]?.writerId).toBe("writer-1");
        expect(targets[0]?.documentTitle).toBe("Draft A");
    });

    it("drops removed writer sessions", () => {
        upsertStoredWriterTargetSession({
            writerId: "writer-1",
            documentTitle: "Draft A",
            lastSeen: Date.now(),
            targets: [],
        });

        removeStoredWriterTargetSession("writer-1");
        expect(flattenStoredWriterTargets()).toEqual([]);
    });

    it("increments publish revisions from stored sync history", () => {
        markStoredWriterTargetPending({
            writerId: "writer-1",
            targetId: "target-1",
            revision: 2,
            publishedAt: new Date("2026-03-20T09:00:00.000Z").toISOString(),
            sourceLabel: "Notebook Studio",
            blockTitle: "Block A",
            documentTitle: "Draft A",
        });

        const publishMessage = createLiveWriterPublishMessage({
            writerId: "writer-1",
            targetId: "target-1",
            sourceLabel: "Integral Studio",
            payload: {
                id: "target-1",
                status: "ready",
                moduleSlug: "integral-studio",
                kind: "integral",
                title: "Integral Block",
                summary: "Summary",
                generatedAt: new Date("2026-03-20T09:05:00.000Z").toISOString(),
                metrics: [],
            },
        });

        expect(publishMessage.revision).toBe(3);
        expect(publishMessage.payload.sync?.revision).toBe(3);
        expect(publishMessage.payload.sync?.sourceLabel).toBe("Integral Studio");
    });

    it("marks acknowledged sync state after writer ack", () => {
        const publishMessage = createLiveWriterPublishMessage({
            writerId: "writer-1",
            targetId: "target-1",
            sourceLabel: "Notebook Studio",
            payload: {
                id: "target-1",
                status: "ready",
                moduleSlug: "notebook-studio",
                kind: "notebook",
                title: "Notebook Block",
                summary: "Summary",
                generatedAt: new Date("2026-03-20T09:10:00.000Z").toISOString(),
                metrics: [],
            },
        });

        markStoredWriterTargetPending({
            writerId: publishMessage.writerId,
            targetId: publishMessage.targetId,
            revision: publishMessage.revision,
            publishedAt: publishMessage.publishedAt,
            sourceLabel: publishMessage.sourceLabel,
            blockTitle: publishMessage.payload.title,
            documentTitle: "Draft A",
        });

        const ack = createLiveWriterPublishAck({
            message: publishMessage,
            acknowledgedAt: new Date("2026-03-20T09:11:00.000Z").toISOString(),
            documentTitle: "Draft A",
            blockTitle: publishMessage.payload.title,
        });
        markStoredWriterTargetAcknowledged(ack);

        expect(readStoredWriterTargetSyncs()).toEqual([
            expect.objectContaining({
                writerId: "writer-1",
                targetId: "target-1",
                revision: publishMessage.revision,
                state: "acknowledged",
                documentTitle: "Draft A",
                blockTitle: "Notebook Block",
                sourceLabel: "Notebook Studio",
            }),
        ]);
    });

    it("extracts writer targets with section context", () => {
        const content = [
            "# Main Article",
            "",
            "## Integral section",
            "",
            serializeWriterBridgeBlock({
                id: "target-1",
                status: "waiting",
                moduleSlug: "live-writer-bridge",
                kind: "placeholder",
                title: "Integral result block",
                summary: "waiting",
                generatedAt: new Date("2026-03-20T09:00:00.000Z").toISOString(),
                metrics: [],
            }),
        ].join("\n");

        expect(extractWriterBridgeTargets(content)).toEqual([
            expect.objectContaining({
                id: "target-1",
                title: "Integral result block",
                sectionLabel: "Integral section",
                sectionPath: "Main Article > Integral section",
            }),
        ]);
    });

    it("reads only the queued import requested by importId", () => {
        const firstRequestId = queueWriterImport("First payload");
        const secondRequestId = queueWriterImport("Second payload");

        expect(createLaboratoryWriterDraftHref(secondRequestId)).toContain(`importId=${encodeURIComponent(secondRequestId)}`);
        expect(readQueuedWriterImport(firstRequestId)?.markdown).toBe("First payload");
        expect(readQueuedWriterImport(secondRequestId)?.markdown).toBe("Second payload");

        removeQueuedWriterImport(firstRequestId);
        expect(readQueuedWriterImport(firstRequestId)).toBeNull();
        expect(readQueuedWriterImport(secondRequestId)?.markdown).toBe("Second payload");
    });
});
