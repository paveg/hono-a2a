import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		coverage: {
			provider: "v8",
			include: ["src/**/*.ts"],
			exclude: ["src/index.ts", "src/types.ts"],
			// Thresholds pinned to the current actuals as a no-regression floor.
			// Raise in follow-up PRs that add tests for uncovered branches
			// (notably the SSE error paths in json-rpc-handler.ts).
			thresholds: {
				statements: 95,
				branches: 75,
				functions: 100,
				lines: 95,
			},
		},
	},
});
