import { expect, test, type Page } from "@playwright/test";

function buildDifferentialResponse(body: Record<string, string>) {
    const mode = body.mode ?? "derivative";
    const taxonomyFamily =
        mode === "ode"
            ? "ode_flow"
            : mode === "pde"
              ? "heat_like"
              : mode === "sde"
                ? "stochastic_diffusion"
                : "general_symbolic";

    return {
        status: "exact",
        message: `${mode} smoke lane ready`,
        diagnostics: {
            continuity: mode === "sde" ? "partial" : "continuous",
            differentiability: mode === "sde" ? "partial" : "differentiable",
            domain_analysis: {
                constraints: [],
                assumptions: [`${mode} smoke contract`],
                blockers: [],
            },
            taxonomy: {
                lane: mode,
                family: taxonomyFamily,
                tags: [mode, "smoke"],
                summary: `${mode} smoke taxonomy`,
            },
        },
        parser: {
            expression_raw: body.expression ?? "",
            expression_normalized: body.expression ?? "",
            expression_latex: body.expression ?? "",
            variable: body.variable ?? "",
            point_raw: body.point ?? "",
            point_normalized: body.point ?? "",
            notes: [`${mode} smoke parser`],
        },
        exact: {
            method_label:
                mode === "ode"
                    ? "SymPy dsolve"
                    : mode === "pde"
                      ? "SymPy pdsolve"
                      : mode === "sde"
                        ? "Euler-Maruyama"
                        : "Symbolic lane",
            derivative_latex:
                mode === "ode"
                    ? "y = C_1 e^x"
                    : mode === "pde"
                      ? "u = e^{-k t} sin(x)"
                      : mode === "sde"
                        ? "X_{n+1}=X_n+\\mu\\Delta t+\\sigma\\Delta W"
                        : "f'(x)",
            evaluated_latex: mode === "sde" ? "E[X(T)] \\approx 1.05" : null,
            numeric_approximation: mode === "sde" ? "1.05" : null,
            steps: [
                {
                    title: "Smoke step",
                    summary: `${mode} smoke solve`,
                    latex: null,
                    tone: "success",
                },
            ],
        },
    };
}

async function mockDifferentialApi(page: Page) {
    await page.route("**/api/laboratory/solve/differential/", async (route) => {
        const body = route.request().postDataJSON() as Record<string, string>;
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(buildDifferentialResponse(body)),
        });
    });
}

test.describe("Differential advanced lanes", () => {
    test.beforeEach(async ({ page }) => {
        await mockDifferentialApi(page);
    });

    test("ODE guided form reaches phase portrait", async ({ page }) => {
        await page.goto("/laboratory/differential-studio");

        await page.getByTestId("diff-mode-select").selectOption("ode");
        await page.getByTestId("diff-expression-input").fill("y' = y; y(0)=1");
        await page.getByTestId("diff-variable-input").fill("x");
        await page.getByTestId("diff-point-input").fill("y(0)=1");
        await page.getByTestId("diff-solve-button").click();

        await expect(page.getByTestId("diff-expression-input")).toHaveValue("y' = y; y(0)=1");
        await expect(page.getByTestId("diff-ode-phase-panel")).toBeVisible();
        await expect(page.getByTestId("diff-ode-phase-panel").getByText("Phase Portrait")).toBeVisible();
    });

    test("PDE guided form reaches heatmap and profile panels", async ({ page }) => {
        await page.goto("/laboratory/differential-studio");

        await page.getByTestId("diff-mode-select").selectOption("pde");
        await page.getByTestId("diff-expression-input").fill("u_t = u_x; u(x,0)=sin(x)");
        await page.getByTestId("diff-variable-input").fill("x, t");
        await page.getByTestId("diff-point-input").fill("u(x,0)=sin(x)");
        await page.getByTestId("diff-solve-button").click();

        await expect(page.getByTestId("diff-expression-input")).toHaveValue("u_t = u_x; u(x,0)=sin(x)");
        await expect(page.getByTestId("diff-pde-heatmap")).toBeVisible();
        await expect(page.getByTestId("diff-pde-profile-panel")).toBeVisible();
    });

    test("SDE guided form reaches ensemble statistics panel", async ({ page }) => {
        await page.goto("/laboratory/differential-studio");

        await page.getByTestId("diff-mode-select").selectOption("sde");
        await page.getByTestId("diff-expression-input").fill("dX = 0.4*X*dt + 0.2*X*dW; X(0)=1; t:[0,1]; n=64");
        await page.getByTestId("diff-variable-input").fill("t");
        await page.getByTestId("diff-point-input").fill("X(0)=1; t:[0,1]; n=64");
        await page.getByTestId("diff-solve-button").click();

        await expect(page.getByTestId("diff-expression-input")).toHaveValue("dX = 0.4*X*dt + 0.2*X*dW; X(0)=1; t:[0,1]; n=64");
        await expect(page.getByTestId("diff-point-input")).toHaveValue("X(0)=1; t:[0,1]; n=64");
        await expect(page.getByTestId("diff-sde-ensemble-panel")).toBeVisible();
        await expect(page.getByText("Terminal Distribution")).toBeVisible();
    });
});
