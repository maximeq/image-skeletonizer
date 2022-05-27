import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import { terser } from "rollup-plugin-terser";

const MODULE_NAME = "ImageSkeletonizer";
const MODULE_FILENAME = "image-skeletonizer";
const DIST = "./dist";

export default {
    // entrypoint
    input: "src/exports.js",

    // common options
    plugins: [
        commonjs(), // handles requires in CJS dependancies
        nodeResolve(), // resolves node_module dependancies
    ],

    // specific options
    output: [
        {
            // for bundlers
            format: "esm",
            file: `${DIST}/${MODULE_FILENAME}.mjs`,
        },

        {
            // for node
            format: "cjs",
            file: `${DIST}/${MODULE_FILENAME}.cjs`,
        },

        {
            // for browser (debug)
            format: "iife",
            name: MODULE_NAME,
            file: `${DIST}/${MODULE_FILENAME}.js`,
            sourcemap: true, // for easier debugging in dev tools
        },

        {
            // for browser (minified)
            format: "iife",
            name: MODULE_NAME,
            file: `${DIST}/${MODULE_FILENAME}.min.js`,
            plugins: [
                terser(), // minify
            ],
        },
    ],
};
