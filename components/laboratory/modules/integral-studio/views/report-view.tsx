import React from "react";

import { LaboratoryReportLayout, type ReportGeneratorFormat } from "@/components/laboratory/laboratory-report-layout";
import type { WriterBridgePublicationProfile } from "@/lib/live-writer-bridge";

import { AnnotationPanel } from "../components/annotation-panel";
import { StudioMetricCard } from "../presentation-types";

type LiveTarget = {
    id: string;
    title: string;
};

type ReportViewProps = {
    reportExecutiveCards: StudioMetricCard[];
    reportSupportCards: StudioMetricCard[];
    reportSkeletonMarkdown: string;
    copyMarkdownExport: () => void;
    saveResult: () => void | Promise<unknown>;
    saveState: "idle" | "saving" | "saved" | "error";
    saveError: string | null;
    lastSavedResultTitle: string | null;
    sendToWriter: () => void;
    sendToNotebook: () => void;
    reportReadinessCards: StudioMetricCard[];
    annotationPanelProps: React.ComponentProps<typeof AnnotationPanel>;
    liveTargets: LiveTarget[];
    selectedLiveTargetId: string | null;
    setSelectedLiveTargetId: (id: string) => void;
    pushLiveResult: () => void;
    publicationProfile: WriterBridgePublicationProfile;
    setPublicationProfile: (profile: WriterBridgePublicationProfile) => void;
    reportFormat: ReportGeneratorFormat;
    setReportFormat: (format: ReportGeneratorFormat) => void;
};

export function ReportView({
    reportExecutiveCards,
    reportSupportCards,
    reportSkeletonMarkdown,
    copyMarkdownExport,
    saveResult,
    saveState,
    saveError,
    lastSavedResultTitle,
    sendToWriter,
    sendToNotebook,
    reportReadinessCards,
    annotationPanelProps,
    liveTargets,
    selectedLiveTargetId,
    setSelectedLiveTargetId,
    pushLiveResult,
    publicationProfile,
    setPublicationProfile,
    reportFormat,
    setReportFormat,
}: ReportViewProps) {
    return (
        <LaboratoryReportLayout
            executiveCards={reportExecutiveCards}
            supportCards={reportSupportCards}
            readinessCards={reportReadinessCards}
            reportMarkdown={reportSkeletonMarkdown}
            publicationProfile={publicationProfile}
            setPublicationProfile={setPublicationProfile}
            copyMarkdownExport={copyMarkdownExport}
            saveResult={saveResult}
            saveState={saveState}
            saveError={saveError}
            lastSavedResultTitle={lastSavedResultTitle}
            sendToWriter={sendToWriter}
            sendToNotebook={sendToNotebook}
            pushLiveResult={pushLiveResult}
            liveTargets={liveTargets}
            selectedLiveTargetId={selectedLiveTargetId}
            setSelectedLiveTargetId={setSelectedLiveTargetId}
            annotationNode={<AnnotationPanel {...annotationPanelProps} />}
            reportTitle="Generated Report"
            reportFormat={reportFormat}
            setReportFormat={setReportFormat}
        />
    );
}
