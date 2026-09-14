export const DIFFERENTIAL_PRESET_CATALOG = [
    { label: "Wave Packet Tangent", mode: "derivative", expr: "exp(-0.12*x) * (sin(2.8*x) + 0.35*x^2)", variable: "x", point: "1.4", order: "1", description: "Oddiy hosila, tangent va slope audit uchun balanslangan starter." },
    { label: "Thermal Gradient Map", mode: "partial", expr: "exp(-x^2 - y^2) * sin(x*y)", variable: "x, y", point: "1, 0.5", order: "1", description: "2D scalar field, gradient va local sensitivity uchun." },
    { label: "Directional Drift", mode: "directional", expr: "x^2 + x*y + sin(y)", variable: "x, y", point: "1, 0.5", direction: "1, 1", order: "1", description: "Directional derivative va projected change uchun." },
    { label: "Robot Jacobian", mode: "jacobian", expr: "[cos(q1) + 2*cos(q1+q2), sin(q1) + 2*sin(q1+q2)]", variable: "q1, q2", point: "0.5, 1", order: "1", description: "Jacobian va local linearization uchun." },
    { label: "Rosenbrock Hessian", mode: "hessian", expr: "(1 - x)^2 + 100 * (y - x^2)^2", variable: "x, y", point: "1, 1", order: "1", description: "Second-order test va curvature audit uchun." },
    { label: "ODE IVP Lane", mode: "ode", expr: "y' = x + y; y(0)=1", variable: "x", point: "y(0)=1", order: "1", description: "Symbolic ODE lane va initial-value walkthrough uchun." },
] as const;

export const DIFFERENTIAL_WORKFLOW_CATALOG = [
    {
        id: "wave_packet_tangent",
        label: "Wave Packet Tangent",
        description: "Tangent line, slope va local behavior'ni birga ochadi.",
        mode: "derivative",
        expr: "exp(-0.12*x) * (sin(2.8*x) + 0.35*x^2)",
        variable: "x",
        point: "1.4",
        order: "1",
    },
    {
        id: "thermal_gradient_map",
        label: "Thermal Gradient Map",
        description: "Gradient field va scalar response overview.",
        mode: "partial",
        expr: "exp(-0.4*(x^2 + y^2)) * (sin(2*x) + cos(1.5*y))",
        variable: "x, y",
        point: "0.8, -0.6",
        order: "1",
    },
    {
        id: "directional_flow_probe",
        label: "Directional Flow Probe",
        description: "Directional derivative va chosen direction overlay.",
        mode: "directional",
        expr: "x^2 - x*y + 2*sin(y)",
        variable: "x, y",
        point: "1.1, 0.7",
        direction: "1, -1",
        order: "1",
    },
    {
        id: "ode_ivp_lane",
        label: "ODE IVP Lane",
        description: "ODE symbolic lane va initial-condition solve.",
        mode: "ode",
        expr: "y' = x + y; y(0)=1",
        variable: "x",
        point: "y(0)=1",
    },
] as const;

export const INTEGRAL_PRESET_CATALOG = [
    { label: "Studio Walkthrough", mode: "single", expr: "sin(x) + x^2 / 5", lower: "0", upper: "3.14", segments: "96", description: "A guided baseline for solving, visual inspection and report preparation.", descriptionUz: "Yechish, vizual tekshiruv va hisobot tayyorlash uchun boshlang‘ich ish jarayoni." },
    { label: "Gaussian Bell", mode: "single", expr: "exp(-x^2)", lower: "-3", upper: "3", segments: "96", description: "A benchmark for exact evaluation and numerical method agreement.", descriptionUz: "Aniq hisoblash va sonli usullar mosligini tekshirish uchun benchmark." },
    { label: "Oscillatory Fresnel", mode: "single", expr: "sin(x^2)", lower: "0", upper: "6", segments: "140", description: "A stress case for oscillation and numerical stability.", descriptionUz: "Tebranishlar va sonli barqarorlikni tekshirish uchun nazorat masalasi." },
    { label: "Endpoint Singularity", mode: "single", expr: "1/sqrt(x)", lower: "0", upper: "1", segments: "120", description: "An audit case for endpoint singularity and convergence.", descriptionUz: "Chegara singularligi va yaqinlashuvni tekshirish uchun nazorat masalasi." },
    { label: "Wave Surface", mode: "double", expr: "sin(x) * cos(y) + 0.25 * x", x: "[-6.28, 6.28]", y: "[-6.28, 6.28]", nx: "34", ny: "34", description: "Two-dimensional surface integration with grid diagnostics.", descriptionUz: "To‘r diagnostikasi bilan ikki o‘lchamli sirt integrali." },
    { label: "Radial Energy Cloud", mode: "triple", expr: "exp(-(x^2 + y^2 + z^2)/4)", x: "[-4, 4]", y: "[-4, 4]", z: "[-4, 4]", nx: "12", ny: "12", nz: "12", description: "Three-dimensional density integration with volumetric diagnostics.", descriptionUz: "Hajmiy diagnostika bilan uch o‘lchamli zichlik integrali." },
] as const;

export const INTEGRAL_WORKFLOW_CATALOG = [
    {
        id: "studio-walkthrough",
        title: "Baseline Verification",
        description: "Solve, visualizer, derivation va report uchun standart start.",
        presetLabel: "Studio Walkthrough",
        blocks: ["controls", "visualizer", "exact", "tables", "sweep", "insights", "report", "bridge"] as const,
        sweep: { start: "12", end: "96", count: "5" },
    },
    {
        id: "convergence-check",
        title: "Convergence Check",
        description: "Oscillatory integral va method drift audit.",
        presetLabel: "Oscillatory Fresnel",
        blocks: ["controls", "visualizer", "exact", "sweep", "insights", "report", "bridge"] as const,
        sweep: { start: "10", end: "80", count: "5" },
    },
    {
        id: "endpoint-singularity-audit",
        title: "Endpoint Audit",
        description: "Singularity va convergence signalini tekshiradi.",
        presetLabel: "Endpoint Singularity",
        blocks: ["controls", "exact", "insights", "report", "bridge"] as const,
        sweep: { start: "12", end: "64", count: "4" },
    },
    {
        id: "surface-response-mapping",
        title: "Surface Response",
        description: "2D surface region contribution va profile audit.",
        presetLabel: "Wave Surface",
        blocks: ["controls", "visualizer", "sweep", "insights", "report", "bridge"] as const,
        sweep: { start: "10", end: "40", count: "4" },
    },
] as const;

export const MATRIX_PRESET_CATALOG = [
    { label: "Vector Transform Primer", mode: "transform", matrix: "1.1 0.45; -0.2 1.3", rhs: "1.2; 0.8", dimension: "2x2", description: "2D transform va basis distortion uchun." },
    { label: "Small Matrix Algebra", mode: "algebra", matrix: "3 1; 1 2", rhs: "1; 0", dimension: "2x2", description: "Determinant, inverse va trace audit uchun." },
    { label: "Sparse System Audit", mode: "systems", matrix: "4 -1 0 0 0; -1 4 -1 0 0; 0 -1 4 -1 0; 0 0 -1 4 -1; 0 0 0 -1 4", rhs: "2; 1; 0; 1; 2", dimension: "5x5", description: "Sparse system va residual signal uchun." },
    { label: "Spectral Research Deck", mode: "decomposition", matrix: "6 2 0 0; 2 5 1 0; 0 1 4 1; 0 0 1 3", rhs: "1; 0; 1; -1", dimension: "4x4", description: "Spectrum, SVD va decomposition overview uchun." },
    { label: "Tensor Contraction Deck", mode: "tensor", matrix: "1 0 2; 0 1 1 || 2 1 0; 1 0 1 || 0 2 1; 1 1 0", rhs: "0.5; 1; -0.25", dimension: "2x3x3", description: "Tensor slice va contraction starter uchun." },
    { label: "Least Squares Fit", mode: "systems", matrix: "1 0; 1 1; 1 2; 1 3; 1 4", rhs: "1; 2; 2.9; 3.7; 5.1", dimension: "5x2", description: "Rectangular system va least-squares audit uchun." },
] as const;

export const PROBABILITY_PRESET_CATALOG = [
    { label: "Signal Noise Snapshot", mode: "descriptive", dataset: "12, 15, 13, 17, 19, 18, 14, 16, 20, 22", parameters: "bins=6", dimension: "1d", description: "Histogram, spread va descriptive summary uchun." },
    { label: "Normal Tail Audit", mode: "distributions", dataset: "x=1.96", parameters: "family=normal; mu=0; sigma=1", dimension: "1d", description: "Normal tail probability va interval intuition uchun." },
    { label: "Bayesian Conversion Audit", mode: "bayesian", dataset: "successes=58; trials=100", parameters: "prior_alpha=2; prior_beta=3; future_n=20; sampler=mh; seed=11", dimension: "posterior lane", description: "Posterior density va credible interval uchun." },
    { label: "AB Test Inference", mode: "inference", dataset: "control: 42/210; variant: 57/205", parameters: "alpha=0.05", dimension: "2-group", description: "Hypothesis test va p-value signal uchun." },
    { label: "Quadratic Response Fit", mode: "regression", dataset: "(1,2.4), (2,3.1), (3,4.9), (4,7.8), (5,11.6), (6,16.1)", parameters: "model=quadratic", dimension: "2d", description: "Nonlinear fit va residual audit uchun." },
    { label: "Monte Carlo Pi Deck", mode: "monte-carlo", dataset: "inside-circle estimator", parameters: "samples=5000; seed=42", dimension: "simulation", description: "Simulation, estimate va convergence intuition uchun." },
] as const;

export const SERIES_LIMIT_PRESET_CATALOG = [
    { label: "Classic Limit Probe", mode: "limits", expression: "(sin(x))/x", auxiliary: "x -> 0", dimension: "1 variable", description: "Foundational limit va local behavior uchun." },
    { label: "Removable Singularity", mode: "limits", expression: "(1-cos(x))/x^2", auxiliary: "x -> 0", dimension: "1 variable", description: "Cancellation va expansion talab qiladigan limit." },
    { label: "Sequence Convergence Deck", mode: "sequences", expression: "(1 + 1/n)^n", auxiliary: "n -> inf", dimension: "discrete", description: "Sequence limit va monotone intuition uchun." },
    { label: "Alternating Series Audit", mode: "series", expression: "sum((-1)^(n+1)/n, n=1..inf)", auxiliary: "alternating", dimension: "infinite series", description: "Alternating convergence va partial sums uchun." },
    { label: "Power Series Radius", mode: "power-series", expression: "sum(x^n/n, n=1..inf)", auxiliary: "center=0", dimension: "power series", description: "Radius of convergence va local expansion uchun." },
    { label: "Endpoint Stress Test", mode: "power-series", expression: "sum(x^n/sqrt(n), n=1..inf)", auxiliary: "center=0", dimension: "power series", description: "Endpoint behavior va stricter boundary audit uchun." },
] as const;
