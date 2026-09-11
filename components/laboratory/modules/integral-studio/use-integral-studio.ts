import React from "react";
import { 
    IntegralMode, 
    IntegralExperienceLevel, 
    IntegralWorkspaceTab, 
    IntegralAnnotation, 
    IntegralSavedExperiment, 
    IntegralSolvePhase, 
    IntegralSolveSnapshot, 
    IntegralAnalyticSolveResponse, 
    IntegralComputationSummary, 
    IntegralSolveMethod,
    SingleIntegralSummary,
    DoubleIntegralSummary, 
    TripleIntegralSummary,
    IntegralCoordinateSystem
} from "./types";
import { 
    experienceLevelBlocks, 
    levelTabs, 
    integralNotebookBlocks, 
    integralPresetDescriptions, 
    INTEGRAL_WORKFLOW_TEMPLATES,
    INTEGRAL_PRESETS,
} from "./constants";
import { usePersistedLabCollection } from "@/components/laboratory/use-persisted-lab-collection";
import { useLaboratoryNotebook } from "@/components/laboratory/laboratory-notebook";
import { useLiveWriterTargets } from "@/components/live-writer-bridge/use-live-writer-targets";
import { 
    areSolveSnapshotsEqual, 
    buildAveragedProfile,
    generateSweepValues,
    isFiniteInput,
    parseBoundValue
} from "./utils";
import { LaboratoryModuleMeta } from "@/lib/laboratory";
import { LaboratorySignal } from "@/components/laboratory/laboratory-signal-panel";

// Services (Moved to local)
import { IntegralClassificationService } from "./services/classification-service";
import { LaboratoryMathService } from "./services/math-service";
import { LaboratorySolveService } from "./services/solve-service";
import { GeometryLaneService } from "./services/geometry-lane-service";

// Shared Services
import { LaboratoryFormattingService } from "@/components/laboratory/services/formatting-service";
import { createClientId } from "@/lib/client-id";

const STUDIO_SHOWCASE_TEMPLATE_ID = "studio-walkthrough";
const STUDIO_SHOWCASE_SNAPSHOT: IntegralSolveSnapshot = {
    mode: "single",
    coordinates: "cartesian",
    expression: "sin(x) + x^2 / 5",
    lower: "0",
    upper: "3.14",
    xMin: "-6.28",
    xMax: "6.28",
    yMin: "-6.28",
    yMax: "6.28",
    zMin: "-2",
    zMax: "2",
    segments: "96",
    xResolution: "34",
    yResolution: "34",
    zResolution: "12",
};
const STUDIO_SHOWCASE_SWEEP = {
    start: "12",
    end: "96",
    count: "5",
};

export function useIntegralStudio(module: LaboratoryModuleMeta) {
    const [mode, setMode] = React.useState<IntegralMode>(STUDIO_SHOWCASE_SNAPSHOT.mode);
    const [coordinates, setCoordinates] = React.useState<IntegralCoordinateSystem>(STUDIO_SHOWCASE_SNAPSHOT.coordinates);
    const [experienceLevel, setExperienceLevel] = React.useState<IntegralExperienceLevel>("advanced");
    const [activeTab, setActiveTab] = React.useState<IntegralWorkspaceTab>("solve");
    const [expression, setExpression] = React.useState(STUDIO_SHOWCASE_SNAPSHOT.expression);
    const [lower, setLower] = React.useState(STUDIO_SHOWCASE_SNAPSHOT.lower);
    const [upper, setUpper] = React.useState(STUDIO_SHOWCASE_SNAPSHOT.upper);
    const [xMin, setXMin] = React.useState(STUDIO_SHOWCASE_SNAPSHOT.xMin);
    const [xMax, setXMax] = React.useState(STUDIO_SHOWCASE_SNAPSHOT.xMax);
    const [yMin, setYMin] = React.useState(STUDIO_SHOWCASE_SNAPSHOT.yMin);
    const [yMax, setYMax] = React.useState(STUDIO_SHOWCASE_SNAPSHOT.yMax);
    const [zMin, setZMin] = React.useState(STUDIO_SHOWCASE_SNAPSHOT.zMin);
    const [zMax, setZMax] = React.useState(STUDIO_SHOWCASE_SNAPSHOT.zMax);

    const [segments, setSegments] = React.useState(STUDIO_SHOWCASE_SNAPSHOT.segments);
    const [xResolution, setXResolution] = React.useState(STUDIO_SHOWCASE_SNAPSHOT.xResolution);
    const [yResolution, setYResolution] = React.useState(STUDIO_SHOWCASE_SNAPSHOT.yResolution);
    const [zResolution, setZResolution] = React.useState(STUDIO_SHOWCASE_SNAPSHOT.zResolution);
    const [sweepStart, setSweepStart] = React.useState(STUDIO_SHOWCASE_SWEEP.start);
    const [sweepEnd, setSweepEnd] = React.useState(STUDIO_SHOWCASE_SWEEP.end);
    const [sweepCount, setSweepCount] = React.useState(STUDIO_SHOWCASE_SWEEP.count);
    const [annotationTitle, setAnnotationTitle] = React.useState("");
    const [annotationNote, setAnnotationNote] = React.useState("");
    const [experimentLabel, setExperimentLabel] = React.useState("");
    const [activeTemplateId, setActiveTemplateId] = React.useState<string | null>(STUDIO_SHOWCASE_TEMPLATE_ID);
    const [annotations, setAnnotations] = usePersistedLabCollection<IntegralAnnotation>("mathsphere-lab-integral-annotations");
    const [savedExperiments, setSavedExperiments] = usePersistedLabCollection<IntegralSavedExperiment>("mathsphere-lab-integral-experiments");
    const [exportState, setExportState] = React.useState<"idle" | "copied" | "sent">("idle");
    const [guideMode, setGuideMode] = React.useState<"copy" | "send" | null>(null);
    const [solvedRequest, setSolvedRequest] = React.useState<IntegralSolveSnapshot | null>(null);
    const [numericalRequest, setNumericalRequest] = React.useState<IntegralSolveSnapshot | null>(null);
    const [solvePhase, setSolvePhase] = React.useState<IntegralSolvePhase>("idle");
    const [solveErrorMessage, setSolveErrorMessage] = React.useState("");
    const [analyticSolution, setAnalyticSolution] = React.useState<IntegralAnalyticSolveResponse | null>(null);
    const [solveMethod, setSolveMethod] = React.useState<IntegralSolveMethod>("auto");

    const initialNotebookBlocks = React.useMemo(() => [...experienceLevelBlocks.advanced], []);

    const notebook = useLaboratoryNotebook<any>({
        storageKey: "mathsphere-lab-integral-notebook",
        definitions: integralNotebookBlocks,
        defaultBlocks: initialNotebookBlocks,
    });
    const { setBlocks } = notebook;

    const { liveTargets, selectedLiveTargetId, setSelectedLiveTargetId } = useLiveWriterTargets();

    const normalizedSegments = LaboratoryFormattingService.clampInteger(segments, 24, 4, 400);
    const normalizedXResolution = LaboratoryFormattingService.clampInteger(xResolution, 28, 6, 72);
    const normalizedYResolution = LaboratoryFormattingService.clampInteger(yResolution, 28, 6, 72);
    const normalizedZResolution = LaboratoryFormattingService.clampInteger(zResolution, 12, 4, 28);
    
    const currentRequest = React.useMemo<IntegralSolveSnapshot>(
        () => ({
            mode,
            coordinates,
            expression,
            lower,
            upper,
            xMin,
            xMax,
            yMin,
            yMax,
            zMin,
            zMax,
            segments,
            xResolution,
            yResolution,
            zResolution,
            solveMethod,
        }),
        [coordinates, expression, lower, mode, segments, solveMethod, upper, xMax, xMin, xResolution, yMax, yMin, yResolution, zMax, zMin, zResolution],
    );
    const classification = React.useMemo(
        () => IntegralClassificationService.classify(currentRequest),
        [currentRequest],
    );
    const latestRequestRef = React.useRef(currentRequest);
    const showcaseBootstrappedRef = React.useRef(false);
    const autoSolveTokenRef = React.useRef(0);

    React.useEffect(() => {
        latestRequestRef.current = currentRequest;
    }, [currentRequest]);

    React.useEffect(() => {
        setBlocks(experienceLevelBlocks[experienceLevel]);
        const allowedTabs = levelTabs[experienceLevel];
        if (!allowedTabs.includes(activeTab)) {
            setActiveTab(allowedTabs[0]);
        }
    }, [activeTab, experienceLevel, setBlocks]);

    React.useEffect(() => {
        if (showcaseBootstrappedRef.current) {
            return;
        }

        showcaseBootstrappedRef.current = true;
        setActiveTemplateId(STUDIO_SHOWCASE_TEMPLATE_ID);
        setSweepStart(STUDIO_SHOWCASE_SWEEP.start);
        setSweepEnd(STUDIO_SHOWCASE_SWEEP.end);
        setSweepCount(STUDIO_SHOWCASE_SWEEP.count);
        setSolvedRequest(STUDIO_SHOWCASE_SNAPSHOT);
        setNumericalRequest(STUDIO_SHOWCASE_SNAPSHOT);
        setSolvePhase("analytic-loading");
        setSolveErrorMessage("");
        setAnalyticSolution(null);
        setExportState("idle");
        setGuideMode(null);

        let cancelled = false;

        void (async () => {
            try {
                const response = await LaboratorySolveService.requestAnalyticSolve(STUDIO_SHOWCASE_SNAPSHOT);
                if (cancelled || !areSolveSnapshotsEqual(latestRequestRef.current, STUDIO_SHOWCASE_SNAPSHOT)) {
                    return;
                }

                setAnalyticSolution(response);
                setSolvePhase(response.status === "exact" ? "exact-ready" : "numerical-ready");
            } catch (errorValue: unknown) {
                if (cancelled || !areSolveSnapshotsEqual(latestRequestRef.current, STUDIO_SHOWCASE_SNAPSHOT)) {
                    return;
                }

                if (errorValue instanceof Error && errorValue.message.includes("vaqt limiti")) {
                    setSolveErrorMessage(errorValue.message);
                }
                setSolvePhase("numerical-ready");
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    const solverState = React.useMemo(() => {
        if (!numericalRequest) {
            return {
                error: "",
                summary: null,
            };
        }

        const effectiveSegments = LaboratoryFormattingService.clampInteger(numericalRequest.segments, 24, 4, 400);
        const effectiveXResolution = LaboratoryFormattingService.clampInteger(numericalRequest.xResolution, 28, 6, 72);
        const effectiveYResolution = LaboratoryFormattingService.clampInteger(numericalRequest.yResolution, 28, 6, 72);
        const effectiveZResolution = LaboratoryFormattingService.clampInteger(numericalRequest.zResolution, 12, 4, 28);

        try {
            if (numericalRequest.mode === "single") {
                return {
                    error: "",
                    summary: LaboratoryMathService.approximateSingleIntegral(
                        numericalRequest.expression,
                        parseBoundValue(numericalRequest.lower),
                        parseBoundValue(numericalRequest.upper),
                        effectiveSegments,
                        numericalRequest.coordinates
                    ) as IntegralComputationSummary,
                };
            }

            if (numericalRequest.mode === "double") {
                return {
                    error: "",
                    summary: LaboratoryMathService.approximateDoubleIntegral(
                        numericalRequest.expression,
                        parseBoundValue(numericalRequest.xMin),
                        parseBoundValue(numericalRequest.xMax),
                        parseBoundValue(numericalRequest.yMin),
                        parseBoundValue(numericalRequest.yMax),
                        effectiveXResolution,
                        effectiveYResolution,
                        numericalRequest.coordinates
                    ) as IntegralComputationSummary,
                };
            }

            return {
                error: "",
                summary: LaboratoryMathService.approximateTripleIntegral(
                    numericalRequest.expression,
                    parseBoundValue(numericalRequest.xMin),
                    parseBoundValue(numericalRequest.xMax),
                    parseBoundValue(numericalRequest.yMin),
                    parseBoundValue(numericalRequest.yMax),
                    parseBoundValue(numericalRequest.zMin),
                    parseBoundValue(numericalRequest.zMax),
                    effectiveXResolution,
                    effectiveYResolution,
                    effectiveZResolution,
                    numericalRequest.coordinates
                ) as IntegralComputationSummary,
            };
        } catch (errorValue: unknown) {
            return {
                error: errorValue instanceof Error ? errorValue.message : "Integral solver failed.",
                summary: null,
            };
        }
    }, [numericalRequest]);

    const error = solverState.error;
    const summary = solverState.summary;
    const resultReference = solvedRequest || numericalRequest;
    const isResultStale = Boolean(
        resultReference &&
        !areSolveSnapshotsEqual(currentRequest, resultReference),
    );
    
    const inputValidationSignals = React.useMemo(() => {
        const signals: LaboratorySignal[] = [];
        const geometryLaneActive =
            classification.kind === "line_integral_candidate"
            || classification.kind === "surface_integral_candidate"
            || classification.kind === "contour_integral_candidate";
        const skipScalarBoundsValidation =
            geometryLaneActive
            || classification.kind === "indefinite_single"
            || classification.kind === "improper_infinite_bounds";

        if (!expression.trim()) {
            signals.push({
                tone: "danger",
                label: "Expression Required",
                text: "Integral ifodasi bo'sh. Solve boshlanishidan oldin formula kiritilishi kerak.",
            });
        }

        if (mode === "single") {
            if (!skipScalarBoundsValidation && (!isFiniteInput(lower) || !isFiniteInput(upper))) {
                signals.push({
                    tone: "danger",
                    label: "Invalid Interval",
                    text: "Single integral uchun lower va upper son bo'lishi kerak.",
                });
            } else if (!skipScalarBoundsValidation && parseBoundValue(lower) >= parseBoundValue(upper)) {
                signals.push({
                    tone: "danger",
                    label: "Interval Order",
                    text: "Upper chegara lower dan katta bo'lishi kerak.",
                });
            }
        } else {
            const axisChecks: Array<{ key: string; start: string; end: string }> = [
                { key: "X", start: xMin, end: xMax },
                { key: "Y", start: yMin, end: yMax },
            ];

            if (mode === "triple") {
                axisChecks.push({ key: "Z", start: zMin, end: zMax });
            }

            axisChecks.forEach((axis) => {
                if (!isFiniteInput(axis.start) || !isFiniteInput(axis.end)) {
                    signals.push({
                        tone: "danger",
                        label: `${axis.key} Domain`,
                        text: `${axis.key} domain uchun ikkala bound ham son bo'lishi kerak.`,
                    });
                } else if (parseBoundValue(axis.start) >= parseBoundValue(axis.end)) {
                    signals.push({
                        tone: "danger",
                        label: `${axis.key} Order`,
                        text: `${axis.key} domain'da end qiymat start'dan katta bo'lishi kerak.`,
                    });
                }
            });
        }

        return signals;
    }, [classification.kind, expression, lower, mode, xMax, xMin, yMax, yMin, zMax, zMin, upper]);

    const blockingValidationCount = inputValidationSignals.filter((item) => item.tone === "danger").length;

    React.useEffect(() => {
        if (!showcaseBootstrappedRef.current || mode !== "single" || blockingValidationCount > 0 || classification.support !== "supported") {
            return;
        }

        const requestToken = autoSolveTokenRef.current + 1;
        autoSolveTokenRef.current = requestToken;
        setSolveErrorMessage("");
        setGuideMode(null);
        setExportState("idle");
        setSolvePhase("analytic-loading");

        const handle = window.setTimeout(async () => {
            try {
                const response = await LaboratorySolveService.requestAnalyticSolve(currentRequest);
                if (autoSolveTokenRef.current !== requestToken || !areSolveSnapshotsEqual(latestRequestRef.current, currentRequest)) {
                    return;
                }

                setSolvedRequest(currentRequest);
                setAnalyticSolution(response);
                if (response.status === "exact") {
                    setNumericalRequest(response.can_offer_numerical ? currentRequest : null);
                    setSolvePhase("exact-ready");
                } else if (response.can_offer_numerical) {
                    setNumericalRequest(null);
                    setSolvePhase("needs-numerical");
                } else {
                    setNumericalRequest(null);
                    setSolvePhase("error");
                    setSolveErrorMessage(response.message);
                }
            } catch (err: any) {
                if (autoSolveTokenRef.current !== requestToken || !areSolveSnapshotsEqual(latestRequestRef.current, currentRequest)) {
                    return;
                }

                const timeoutMessage = err?.message || "Analitik solve bajarilmadi.";
                if (timeoutMessage.includes("vaqt limiti")) {
                    setAnalyticSolution(null);
                    setNumericalRequest(null);
                    setSolvePhase("needs-numerical");
                    setSolveErrorMessage(timeoutMessage);
                    return;
                }

                setSolvePhase("error");
                setSolveErrorMessage(timeoutMessage);
            }
        }, 700);

        return () => window.clearTimeout(handle);
    }, [blockingValidationCount, classification.support, currentRequest, mode]);

    const applyPreset = (preset: any) => {
        setActiveTemplateId(null);
        setMode(preset.mode as IntegralMode);
        setCoordinates("cartesian");
        setExpression(preset.expr || "sin(x) + x^2 / 5");
        if (preset.mode === "single") {
            setLower("lower" in preset ? String(preset.lower) : "0");
            setUpper("upper" in preset ? String(preset.upper) : "1");
            if ("segments" in preset && preset.segments) {
                setSegments(String(preset.segments));
            }
        } else {
            const bx = JSON.parse(preset.x || "[0,1]") as [number, number];
            const by = JSON.parse(preset.y || "[0,1]") as [number, number];
            setXMin(String(bx[0])); setXMax(String(bx[1]));
            setYMin(String(by[0])); setYMax(String(by[1]));
            if ("nx" in preset && preset.nx) {
                setXResolution(String(preset.nx));
            }
            if ("ny" in preset && preset.ny) {
                setYResolution(String(preset.ny));
            }
            if (preset.z) {
                const bz = JSON.parse(preset.z) as [number, number];
                setZMin(String(bz[0])); setZMax(String(bz[1]));
                if ("nz" in preset && preset.nz) {
                    setZResolution(String(preset.nz));
                }
            }
        }
    };

    const applyWorkflowTemplate = (templateId: string) => {
        const template = INTEGRAL_WORKFLOW_TEMPLATES.find((item) => item.id === templateId);
        if (!template) return;

        const preset = INTEGRAL_PRESETS.find((item) => item.label === template.presetLabel);
        if (preset) applyPreset(preset);
        setSweepStart(template.sweep.start);
        setSweepEnd(template.sweep.end);
        setSweepCount(template.sweep.count);
        setActiveTemplateId(template.id);
    };

    async function requestAnalyticSolve() {
        if (blockingValidationCount > 0) {
            setSolvePhase("error");
            setSolveErrorMessage("Input validation muammolari bor. Bound va expression maydonlarini tekshiring.");
            return;
        }

        if (classification.support !== "supported") {
            setSolvePhase("error");
            setSolveErrorMessage(classification.summary);
            setAnalyticSolution(null);
            setNumericalRequest(null);
            return;
        }

        setSolveErrorMessage("");
        setExportState("idle");
        setGuideMode(null);
        setSolvedRequest(currentRequest);
        setNumericalRequest(null);

        if (mode !== "single") {
            setAnalyticSolution(null);
            setSolvePhase("needs-numerical");
            return;
        }

        setSolvePhase("analytic-loading");
        setNumericalRequest(null);

        try {
            const response = await LaboratorySolveService.requestAnalyticSolve(currentRequest);
            setAnalyticSolution(response);
            if (response.status === "exact") {
                setNumericalRequest(response.can_offer_numerical ? currentRequest : null);
                setSolvePhase("exact-ready");
            } else if (response.can_offer_numerical) {
                setSolvePhase("needs-numerical");
            } else {
                setSolvePhase("error");
                setSolveErrorMessage(response.message);
            }
        } catch (err: any) {
            const timeoutMessage = err?.message || "Analitik solve bajarilmadi.";
            if (timeoutMessage.includes("vaqt limiti")) {
                setSolvePhase("needs-numerical");
                setSolveErrorMessage(timeoutMessage);
                return;
            }

            setSolvePhase("error");
            setSolveErrorMessage(timeoutMessage);
        }
    }

    function confirmNumericalSolve() {
        if (blockingValidationCount > 0) {
            setSolvePhase("error");
            setSolveErrorMessage("Numerik solve uchun input validation muammolarini avval tuzating.");
            return;
        }

        setSolveErrorMessage("");
        setSolvedRequest(currentRequest);
        setNumericalRequest(currentRequest);
        setSolvePhase("numerical-ready");
    }

    const activePreset = React.useMemo(
        () =>
            INTEGRAL_PRESETS.find((preset) => {
                if (preset.mode !== mode || preset.expr !== expression) return false;
                if (mode === "single") return (preset as any).lower === lower && (preset as any).upper === upper;
                return true;
            }),
        [expression, lower, mode, upper],
    );

    const activePresetDescription = activePreset ? integralPresetDescriptions[activePreset.label] : "";

    const singleDiagnostics = React.useMemo(() => {
        if (mode !== "single" || !summary) return null;
        const singleSummary = summary as SingleIntegralSummary;
        const spread = Math.max(singleSummary.midpoint, singleSummary.trapezoid, singleSummary.simpson) - Math.min(singleSummary.midpoint, singleSummary.trapezoid, singleSummary.simpson);
        const baseline = Math.max(1e-6, Math.abs(singleSummary.simpson));
        const relativeSpread = spread / baseline;
        const stability = relativeSpread < 0.015 ? "Stable" : relativeSpread < 0.06 ? "Watch" : "Rough";
        return { spread, relativeSpread, stability };
    }, [mode, summary]);

    const doubleDiagnostics = React.useMemo(() => {
        if (mode !== "double" || !summary) return null;
        const doubleSummary = summary as DoubleIntegralSummary;
        const zValues = doubleSummary.samples.map((sample) => sample.z);
        const peak = zValues.length ? Math.max(...zValues.map((value) => Math.abs(value))) : 0;
        const mean = zValues.length ? zValues.reduce((sum, value) => sum + value, 0) / zValues.length : 0;
        return { gridCells: normalizedXResolution * normalizedYResolution, sampleCount: doubleSummary.samples.length, peak, mean };
    }, [mode, normalizedXResolution, normalizedYResolution, summary]);

    const tripleDiagnostics = React.useMemo(() => {
        if (mode !== "triple" || !summary) return null;
        const tripleSummary = summary as TripleIntegralSummary;
        const values = tripleSummary.samples.map((sample) => sample.value);
        const peak = values.length ? Math.max(...values.map((value) => Math.abs(value))) : 0;
        const mean = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
        const voxelVolume = ((Number(xMax) - Number(xMin)) / normalizedXResolution) * ((Number(yMax) - Number(yMin)) / normalizedYResolution) * ((Number(zMax) - Number(zMin)) / normalizedZResolution);
        return { gridCells: normalizedXResolution * normalizedYResolution * normalizedZResolution, sampleCount: tripleSummary.samples.length, peak, mean, voxelVolume };
    }, [mode, normalizedXResolution, normalizedYResolution, normalizedZResolution, summary, xMax, xMin, yMax, yMin, zMax, zMin]);

    const sweepValues = React.useMemo(() => generateSweepValues(sweepStart, sweepEnd, sweepCount, mode === "triple" ? 6 : 4, mode === "single" ? 180 : mode === "double" ? 52 : 24), [mode, sweepCount, sweepEnd, sweepStart]);

    const sweepSeries = React.useMemo(() => {
        try {
            if (mode === "single") {
                const entries = sweepValues.map((segmentsValue) => {
                    const result = LaboratoryMathService.approximateSingleIntegral(expression, Number(lower), Number(upper), segmentsValue, coordinates);
                    return { x: segmentsValue, simpson: result.simpson, midpoint: result.midpoint, trapezoid: result.trapezoid };
                });
                return {
                    title: "Segment sweep",
                    description: "Segment soni oshganda estimate qanday barqarorlashayotganini ko'ring.",
                    metricLabel: "segments",
                    summary: entries,
                    plotSeries: [
                        { label: "Simpson", color: "#2563eb", points: entries.map((entry) => ({ x: entry.x, y: entry.simpson })) },
                        { label: "Midpoint", color: "#14b8a6", points: entries.map((entry) => ({ x: entry.x, y: entry.midpoint })) },
                        { label: "Trapezoid", color: "#f59e0b", points: entries.map((entry) => ({ x: entry.x, y: entry.trapezoid })) },
                    ],
                };
            }
            if (mode === "double") {
                const entries = sweepValues.map((gridValue) => {
                    const result = LaboratoryMathService.approximateDoubleIntegral(expression, Number(xMin), Number(xMax), Number(yMin), Number(yMax), gridValue, gridValue, coordinates);
                    return { x: gridValue, estimate: result.value, sampleCount: result.samples.length };
                });
                return {
                    title: "Grid sweep",
                    description: "2D surface estimate grid zichligiga qanchalik sezgirligini ko'rsatadi.",
                    metricLabel: "grid",
                    summary: entries,
                    plotSeries: [{ label: "Integral estimate", color: "#2563eb", points: entries.map((entry) => ({ x: entry.x, y: entry.estimate })) }],
                };
            }
            const entries = sweepValues.map((gridValue) => {
                const zGrid = Math.max(4, Math.min(28, Math.round(gridValue / 2)));
                const result = LaboratoryMathService.approximateTripleIntegral(expression, Number(xMin), Number(xMax), Number(yMin), Number(yMax), Number(zMin), Number(zMax), gridValue, gridValue, zGrid, coordinates);
                return { x: gridValue, estimate: result.value, sampleCount: result.samples.length, zGrid };
            });
            return {
                title: "Volume sweep",
                description: "3D estimate x/y grid va z grid zichligiga qanchalik bog'liqligini ko'rsatadi.",
                metricLabel: "grid",
                summary: entries,
                plotSeries: [{ label: "Integral estimate", color: "#7c3aed", points: entries.map((entry) => ({ x: entry.x, y: entry.estimate })) }],
            };
        } catch {
            return null;
        }
    }, [coordinates, expression, lower, mode, sweepValues, upper, xMax, xMin, yMax, yMin, zMax, zMin]);

    const doubleProfiles = React.useMemo(() => {
        if (mode !== "double" || !summary) return null;
        const doubleSummary = summary as DoubleIntegralSummary;
        return {
            xProfile: buildAveragedProfile(doubleSummary.samples, "x", "z"),
            yProfile: buildAveragedProfile(doubleSummary.samples, "y", "z"),
        };
    }, [mode, summary]);

    const tripleProfile = React.useMemo(() => {
        if (mode !== "triple" || !summary) return null;
        const tripleSummary = summary as TripleIntegralSummary;
        return buildAveragedProfile(tripleSummary.samples, "x", "value");
    }, [mode, summary]);

    const annotationAnchor = React.useMemo(() => {
        if (mode === "single") return `Single integral [${lower}, ${upper}], segments: ${segments}`;
        if (mode === "double") return `Double integral x[${xMin}, ${xMax}], y[${yMin}, ${yMax}], grid: ${xResolution}x${yResolution}`;
        return `Triple integral x[${xMin}, ${xMax}], y[${yMin}, ${yMax}], z[${zMin}, ${zMax}], grid: ${xResolution}x${yResolution}x${zResolution}`;
    }, [lower, mode, segments, upper, xMax, xMin, xResolution, yMax, yMin, yResolution, zMax, zMin, zResolution]);

    function addAnnotationFromCurrentResult() {
        if (!summary || error) {
            return;
        }

        const nextAnnotation: IntegralAnnotation = {
            id: createClientId("int-note"),
            title: annotationTitle.trim() || `${mode} integral observation`,
            note: annotationNote.trim() || "Current estimate bo'yicha qisqa observation saqlandi.",
            anchor: annotationAnchor,
            createdAt: new Date().toISOString(),
        };

        setAnnotations((current) => [nextAnnotation, ...current].slice(0, 8));
        setAnnotationTitle("");
        setAnnotationNote("");
    }

    function saveCurrentExperiment() {
        const nextExperiment: IntegralSavedExperiment = {
            id: createClientId("int-exp"),
            label: experimentLabel.trim() || `${mode} integral`,
            savedAt: new Date().toISOString(),
            mode,
            coordinates,
            expression,
            lower,
            upper,
            xMin,
            xMax,
            yMin,
            yMax,
            zMin,
            zMax,
            segments,
            xResolution,
            yResolution,
            zResolution,
        };

        setSavedExperiments((current) => [nextExperiment, ...current].slice(0, 8));
        setExperimentLabel("");
    }

    function resetWorkspace() {
        setMode(STUDIO_SHOWCASE_SNAPSHOT.mode);
        setCoordinates(STUDIO_SHOWCASE_SNAPSHOT.coordinates);
        setExpression(STUDIO_SHOWCASE_SNAPSHOT.expression);
        setLower(STUDIO_SHOWCASE_SNAPSHOT.lower);
        setUpper(STUDIO_SHOWCASE_SNAPSHOT.upper);
        setXMin(STUDIO_SHOWCASE_SNAPSHOT.xMin);
        setXMax(STUDIO_SHOWCASE_SNAPSHOT.xMax);
        setYMin(STUDIO_SHOWCASE_SNAPSHOT.yMin);
        setYMax(STUDIO_SHOWCASE_SNAPSHOT.yMax);
        setZMin(STUDIO_SHOWCASE_SNAPSHOT.zMin);
        setZMax(STUDIO_SHOWCASE_SNAPSHOT.zMax);
        setSegments(STUDIO_SHOWCASE_SNAPSHOT.segments);
        setXResolution(STUDIO_SHOWCASE_SNAPSHOT.xResolution);
        setYResolution(STUDIO_SHOWCASE_SNAPSHOT.yResolution);
        setZResolution(STUDIO_SHOWCASE_SNAPSHOT.zResolution);
        setSweepStart(STUDIO_SHOWCASE_SWEEP.start);
        setSweepEnd(STUDIO_SHOWCASE_SWEEP.end);
        setSweepCount(STUDIO_SHOWCASE_SWEEP.count);
        setAnnotationTitle("");
        setAnnotationNote("");
        setExperimentLabel("");
        setActiveTemplateId(STUDIO_SHOWCASE_TEMPLATE_ID);
        setSolvedRequest(STUDIO_SHOWCASE_SNAPSHOT);
        setNumericalRequest(STUDIO_SHOWCASE_SNAPSHOT);
        setSolvePhase("numerical-ready");
        setSolveErrorMessage("");
        setAnalyticSolution(null);
        setExportState("idle");
        setGuideMode(null);
        setActiveTab("solve");
        setBlocks(experienceLevelBlocks[experienceLevel]);
    }

    function loadSavedExperiment(experiment: IntegralSavedExperiment) {
        setMode(experiment.mode);
        setCoordinates(experiment.coordinates);
        setExpression(experiment.expression);
        setLower(experiment.lower);
        setUpper(experiment.upper);
        setXMin(experiment.xMin);
        setXMax(experiment.xMax);
        setYMin(experiment.yMin);
        setYMax(experiment.yMax);
        setZMin(experiment.zMin);
        setZMax(experiment.zMax);
        setSegments(experiment.segments);
        setXResolution(experiment.xResolution);
        setYResolution(experiment.yResolution);
        setZResolution(experiment.zResolution);
        setExportState("idle");
        setGuideMode(null);
    }

    const previewVisualization = React.useMemo(() => {
        if (!expression.trim()) return null;

        try {
            const geometryLane = GeometryLaneService.detect(expression);
            if (mode === "single" && geometryLane) {
                const draft = GeometryLaneService.parse(expression, geometryLane);
                if (draft.kind === "line") {
                    return {
                        kind: "geometry",
                        lane: "line",
                        plotKind: draft.dimension === "3d" ? "curve3d" : "curve",
                        dimension: draft.dimension,
                        title: draft.dimension === "3d" ? "Parametric line path" : "Planar line path",
                        details: [
                            `parameter ${draft.parameter} in [${draft.intervalStart}, ${draft.intervalEnd}]`,
                            draft.variant === "vector" ? "vector circulation lane" : "scalar arc-length lane",
                        ],
                        samples: draft.dimension === "3d"
                            ? LaboratoryMathService.buildParametricCurve3DPreview(
                                draft.path,
                                draft.parameter,
                                parseBoundValue(draft.intervalStart),
                                parseBoundValue(draft.intervalEnd),
                                140,
                            )
                            : LaboratoryMathService.buildParametricCurvePreview(
                                draft.path,
                                draft.parameter,
                                parseBoundValue(draft.intervalStart),
                                parseBoundValue(draft.intervalEnd),
                                140,
                            ),
                    };
                }
                if (draft.kind === "surface") {
                    return {
                        kind: "geometry",
                        lane: "surface",
                        plotKind: "surface",
                        title: "Surface patch preview",
                        details: [
                            `u in [${draft.uStart}, ${draft.uEnd}]`,
                            `v in [${draft.vStart}, ${draft.vEnd}]`,
                            `${draft.orientation} orientation`,
                        ],
                        samples: LaboratoryMathService.buildParametricSurfacePreview(
                            draft.patch,
                            parseBoundValue(draft.uStart),
                            parseBoundValue(draft.uEnd),
                            parseBoundValue(draft.vStart),
                            parseBoundValue(draft.vEnd),
                            16,
                        ),
                    };
                }
                return {
                    kind: "geometry",
                    lane: "contour",
                    plotKind: "complex-plane",
                    title: "Contour path preview",
                    details: [
                        `parameter ${draft.parameter} in [${draft.intervalStart}, ${draft.intervalEnd}]`,
                        `path ${draft.path}`,
                    ],
                    samples: LaboratoryMathService.buildParametricCurvePreview(
                        [`re(${draft.path})`, `im(${draft.path})`],
                        draft.parameter,
                        parseBoundValue(draft.intervalStart),
                        parseBoundValue(draft.intervalEnd),
                        160,
                    ),
                };
            }
            if (mode === "single") {
                const rawLower = lower.trim();
                const rawUpper = upper.trim();
                const parsedLower = rawLower ? parseBoundValue(rawLower) : NaN;
                const parsedUpper = rawUpper ? parseBoundValue(rawUpper) : NaN;
                let previewLower = Number.isFinite(parsedLower) ? parsedLower : -6;
                let previewUpper = Number.isFinite(parsedUpper) ? parsedUpper : 6;

                if (!rawLower && !rawUpper) {
                    previewLower = -6;
                    previewUpper = 6;
                } else if (!Number.isFinite(parsedLower) && Number.isFinite(parsedUpper)) {
                    previewLower = parsedUpper - 12;
                    previewUpper = parsedUpper + 2;
                } else if (Number.isFinite(parsedLower) && !Number.isFinite(parsedUpper)) {
                    previewLower = parsedLower - 2;
                    previewUpper = parsedLower + 12;
                } else if (!Number.isFinite(parsedLower) && !Number.isFinite(parsedUpper)) {
                    previewLower = -12;
                    previewUpper = 12;
                } else if (previewUpper <= previewLower) {
                    previewLower = parsedLower - 2;
                    previewUpper = parsedUpper + 2;
                }

                return {
                    kind: "single",
                    gridLabel: `${normalizedSegments} segments`,
                    samples: LaboratoryMathService.buildTraceSamples(
                        expression,
                        previewLower,
                        previewUpper,
                        160,
                        coordinates,
                    ),
                };
            }
            if (mode === "double") {
                const nx = 12, ny = 12;
                return {
                    kind: "double",
                    gridLabel: `${nx}x${ny}`,
                    summary: LaboratoryMathService.approximateDoubleIntegral(expression, Number(xMin), Number(xMax), Number(yMin), Number(yMax), nx, ny, coordinates)
                };
            }
            if (mode === "triple") {
                const nx = 6, ny = 6, nz = 6;
                return {
                    kind: "triple",
                    gridLabel: `${nx}x${ny}x${nz}`,
                    summary: LaboratoryMathService.approximateTripleIntegral(expression, Number(xMin), Number(xMax), Number(yMin), Number(yMax), Number(zMin), Number(zMax), nx, ny, nz, coordinates)
                };
            }
        } catch {
            return null;
        }
        return null; // TS requirement
    }, [coordinates, expression, lower, mode, normalizedSegments, upper, xMax, xMin, yMax, yMin, zMax, zMin]);

    return {
        state: {
            mode, setMode,
            experienceLevel, setExperienceLevel,
            activeTab, setActiveTab,
            coordinates, setCoordinates,
            expression, setExpression,
            lower, setLower,
            upper, setUpper,
            xMin, setXMin, xMax, setXMax,
            yMin, setYMin, yMax, setYMax,
            zMin, setZMin, zMax, setZMax,
            segments, setSegments,
            xResolution, setXResolution,
            yResolution, setYResolution,
            zResolution, setZResolution,
            sweepStart, setSweepStart,
            sweepEnd, setSweepEnd,
            sweepCount, setSweepCount,
            annotationTitle, setAnnotationTitle,
            annotationNote, setAnnotationNote,
            experimentLabel, setExperimentLabel,
            activeTemplateId,
            annotations, setAnnotations,
            savedExperiments, setSavedExperiments,
            exportState, setExportState,
            guideMode, setGuideMode,
            solvedRequest, setSolvedRequest,
            numericalRequest, setNumericalRequest,
            solvePhase, setSolvePhase,
            solveErrorMessage, setSolveErrorMessage,
            analyticSolution, setAnalyticSolution,
            solveMethod, setSolveMethod,
            normalizedSegments,
            normalizedXResolution,
            normalizedYResolution,
            normalizedZResolution,
            error,
            summary,
            activePreset,
            activePresetDescription,
            activeWorkflowTemplate: INTEGRAL_WORKFLOW_TEMPLATES.find((t) => t.id === activeTemplateId) || null,
            inputValidationSignals,
            blockingValidationCount,
            classification,
            singleDiagnostics,
            doubleDiagnostics,
            tripleDiagnostics,
            doubleProfiles,
            tripleProfile,
            annotationAnchor,
            sweepValues,
            sweepSeries,
            previewVisualization,
            isResultStale,
            availableTabs: levelTabs[experienceLevel],
            notebook,
            liveBridge: { liveTargets, selectedLiveTargetId, setSelectedLiveTargetId }
        },
        actions: {
            applyPreset,
            applyWorkflowTemplate,
            requestAnalyticSolve,
            confirmNumericalSolve,
            addAnnotationFromCurrentResult,
            saveCurrentExperiment,
            resetWorkspace,
            loadSavedExperiment,
            setCoordinates,
        }
    };
}
