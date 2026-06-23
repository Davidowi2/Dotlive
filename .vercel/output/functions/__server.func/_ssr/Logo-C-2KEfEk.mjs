import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as cn } from "./button-CWBSyrer.mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/Logo-C-2KEfEk.js
var import_jsx_runtime = require_jsx_runtime();
/**
* DOT Logo — circular SVG mark with flowing lines.
* Works on both light and dark backgrounds.
* The mark uses currentColor tints so it inherits theme naturally.
*/
function DotMark({ size = 36 }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		width: size,
		height: size,
		viewBox: "0 0 36 36",
		fill: "none",
		"aria-hidden": "true",
		xmlns: "http://www.w3.org/2000/svg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "18",
				cy: "18",
				r: "17",
				stroke: "currentColor",
				strokeOpacity: "0.25",
				strokeWidth: "1"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("defs", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
				id: "dot-grad",
				x1: "4",
				y1: "18",
				x2: "32",
				y2: "18",
				gradientUnits: "userSpaceOnUse",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
					offset: "0%",
					stopColor: "var(--color-primary)"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
					offset: "100%",
					stopColor: "var(--color-teal, #14B8A6)"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("clipPath", {
				id: "dot-clip",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx: "18",
					cy: "18",
					r: "15.5"
				})
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
				clipPath: "url(#dot-clip)",
				stroke: "url(#dot-grad)",
				strokeWidth: "1.8",
				strokeLinecap: "round",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M5 12 C9 11, 14 9.5, 18 11 C22 12.5, 26 11, 31 12" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M4 16 C8 14.5, 13 16.5, 18 15.5 C23 14.5, 27 16.5, 32 16" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
						d: "M4 20 C9 21, 14 18.5, 18 20 C21 21, 24 20.5, 27.5 20.5",
						strokeOpacity: "0.9"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
						d: "M5 24 C10 25, 15 22.5, 19 24 C21.5 25, 23.5 24.5, 26 24",
						strokeOpacity: "0.6"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "18",
				cy: "18",
				r: "2.5",
				fill: "url(#dot-grad)"
			})
		]
	});
}
function Logo({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to: "/",
		className: cn("flex items-center gap-2.5 font-display", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DotMark, { size: 36 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-xl font-bold tracking-tight",
			children: "DOT"
		})]
	});
}
//#endregion
export { Logo as t };
