// Renders the primary nav as concentric semicircles of textPath above the site title.
// First 3 items on the inner arc, the rest on the outer arc. Items are equidistant along
// each arc with the first and last anchored flush to the baseline. A shared animated
// rainbow gradient flows along both arcs.

const SVG_NS = "http://www.w3.org/2000/svg";
const XLINK_NS = "http://www.w3.org/1999/xlink";

const svg = (name, attrs = {}, children = []) => {
    const el = document.createElementNS(SVG_NS, name);
    for (const [k, v] of Object.entries(attrs)) {
        if (k === "href") el.setAttributeNS(XLINK_NS, "href", v);
        else el.setAttribute(k, v);
    }
    for (const c of children) el.appendChild(c);
    return el;
};

const arcPath = (cx, cy, r) =>
    `M ${cx - r},${cy} A ${r},${r} 0 0,1 ${cx + r},${cy}`;

// Dark-rainbow stops mirror --rainbow-stops in custom.css (last stop wraps to first for seamless loop).
const RAINBOW_STOPS = [
    "oklch(38% 0.16 25)",
    "oklch(45% 0.16 55)",
    "oklch(48% 0.14 95)",
    "oklch(42% 0.14 145)",
    "oklch(42% 0.14 200)",
    "oklch(38% 0.18 265)",
    "oklch(38% 0.20 320)",
    "oklch(38% 0.16 25)",
];

const buildRainbowGradient = (id, x1, x2, animate) => {
    const grad = svg("linearGradient", {
        id,
        gradientUnits: "userSpaceOnUse",
        x1, y1: 0, x2, y2: 0,
        spreadMethod: "repeat",
    });
    RAINBOW_STOPS.forEach((color, i) => {
        grad.appendChild(svg("stop", {
            offset: `${(i / (RAINBOW_STOPS.length - 1)) * 100}%`,
            "stop-color": color,
        }));
    });
    if (animate) {
        const span = x2 - x1;
        grad.appendChild(svg("animateTransform", {
            attributeName: "gradientTransform",
            type: "translate",
            from: "0 0",
            to: `${span} 0`,
            dur: "24s",
            repeatCount: "indefinite",
        }));
    }
    return grad;
};

const buildArc = (id, cx, cy, r, items, fontSize, fillRef) => {
    const path = svg("path", {
        id,
        d: arcPath(cx, cy, r),
        fill: "none",
        stroke: "none",
    });
    const texts = items.map((item, i) => {
        let offset, anchor;
        if (items.length === 1) {
            offset = 50;
            anchor = "middle";
        } else {
            offset = (i / (items.length - 1)) * 100;
            anchor = i === 0 ? "start" : i === items.length - 1 ? "end" : "middle";
        }
        const a = svg("a", { href: item.href, target: item.target || "_self" });
        const text = svg("text", {
            "font-size": fontSize,
            "text-anchor": anchor,
            class: "radial-nav-label",
            fill: fillRef,
        });
        const tp = svg("textPath", {
            href: `#${id}`,
            startOffset: `${offset}%`,
        });
        tp.textContent = item.label;
        text.appendChild(tp);
        a.appendChild(text);
        return a;
    });
    return [path, ...texts];
};

export default function radialNav() {
    const menu = document.querySelector(".gh-head-menu");
    if (!menu) return;
    const links = Array.from(menu.querySelectorAll(".nav li a"));
    if (links.length < 2) return;

    const items = links.map((a) => ({
        label: a.textContent.trim(),
        href: a.getAttribute("href"),
        target: a.getAttribute("target"),
    }));

    const inner = items.slice(0, 3);
    const outer = items.slice(3);

    const W = 900;
    const H = 280;
    const cx = W / 2;
    const cy = H - 10;
    const rOuter = 230;
    const rInner = 150;

    const root = svg("svg", {
        class: "radial-nav",
        viewBox: `0 0 ${W} ${H}`,
        preserveAspectRatio: "xMidYMax meet",
        "aria-hidden": "true",
        focusable: "false",
        role: "presentation",
    });

    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const defs = svg("defs");
    // One repeating gradient half the SVG width — translating by that span loops seamlessly.
    defs.appendChild(buildRainbowGradient("radial-rainbow", 0, W / 2, !reduceMotion));
    defs.appendChild(svg("path", { id: "radial-arc-inner", d: arcPath(cx, cy, rInner), fill: "none" }));
    defs.appendChild(svg("path", { id: "radial-arc-outer", d: arcPath(cx, cy, rOuter), fill: "none" }));
    root.appendChild(defs);

    const fillRef = "url(#radial-rainbow)";

    if (inner.length) {
        const innerGroup = svg("g", { class: "radial-nav-arc radial-nav-arc--inner" });
        for (const child of buildArc("radial-arc-inner", cx, cy, rInner, inner, 22, fillRef)) innerGroup.appendChild(child);
        root.appendChild(innerGroup);
    }
    if (outer.length) {
        const outerGroup = svg("g", { class: "radial-nav-arc radial-nav-arc--outer" });
        for (const child of buildArc("radial-arc-outer", cx, cy, rOuter, outer, 22, fillRef)) outerGroup.appendChild(child);
        root.appendChild(outerGroup);
    }

    document.body.classList.add("has-radial-nav");
    menu.appendChild(root);
}
