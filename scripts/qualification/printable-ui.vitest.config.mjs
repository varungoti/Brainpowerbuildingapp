// Noncanonical rendering with already installed tooling; no package installation.
import { resolve } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const toolchain = process.env.PRINTABLE_TEST_TOOLCHAIN;
if (!toolchain) throw new Error("Set PRINTABLE_TEST_TOOLCHAIN to an authorized prepared node_modules parent.");
const requireTool = createRequire(resolve(toolchain, "package.json"));
const root = resolve(process.env.SOURCE_ROOT ?? ".");
export default {
  root,
  resolve: { alias: [
    { find: "canvas-confetti", replacement: fileURLToPath(new URL("./printable-ui-confetti-stub.mjs", import.meta.url)) },
    { find: "@", replacement: resolve(root, "src") },
    ...["react", "react-dom", "react-dom/client", "react/jsx-runtime", "react/jsx-dev-runtime", "@testing-library/react"].map(name => ({ find: new RegExp(`^${name}$`), replacement: requireTool.resolve(name) })),
  ] },
  test: {
    environment: "jsdom", globals: false,
    setupFiles: [fileURLToPath(new URL("./printable-ui-network-guard.mjs", import.meta.url))],
    include: ["src/lib/printables/*.test.ts", "src/lib/printables/usePrintableGuide.test.tsx", "src/app/screens/GeneratorScreen.printables.test.tsx"],
    pool: "forks", maxWorkers: 1, fileParallelism: false, testTimeout: 10000,
  },
};
