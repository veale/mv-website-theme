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
    const anchors = items.map((item) => {
        const a = svg("a", { href: item.href, target: item.target || "_self" });
        const text = svg("text", {
            "font-size": fontSize,
            "text-anchor": "start",
            class: "radial-nav-label",
            fill: fillRef,
        });
        // Provisional offset; layoutArc resets after measurement.
        const tp = svg("textPath", { href: `#${id}`, startOffset: "0%" });
        tp.textContent = item.label;
        text.appendChild(tp);
        a.appendChild(text);
        return a;
    });
    return { path, anchors };
};

// Equidistant gaps between word edges. First item starts at offset 0, last ends at the
// path's end. Pure layout: requires the SVG to already be in the DOM so we can measure.
const layoutArc = (anchors, pathLength) => {
    if (anchors.length === 0) return;
    if (anchors.length === 1) {
        const text = anchors[0].querySelector("text");
        const tp = text.querySelector("textPath");
        text.setAttribute("text-anchor", "middle");
        tp.setAttribute("startOffset", "50%");
        return;
    }
    const widths = anchors.map((a) => a.querySelector("text").getComputedTextLength());
    const totalText = widths.reduce((s, w) => s + w, 0);
    const gap = Math.max(0, (pathLength - totalText) / (anchors.length - 1));
    let cursor = 0;
    anchors.forEach((a, i) => {
        const tp = a.querySelector("textPath");
        tp.setAttribute("startOffset", `${(cursor / pathLength) * 100}%`);
        cursor += widths[i] + gap;
    });
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
    const arcs = [];

    if (inner.length) {
        const group = svg("g", { class: "radial-nav-arc radial-nav-arc--inner" });
        const built = buildArc("radial-arc-inner", cx, cy, rInner, inner, 22, fillRef);
        group.appendChild(built.path);
        for (const a of built.anchors) group.appendChild(a);
        root.appendChild(group);
        arcs.push(built);
    }
    if (outer.length) {
        const group = svg("g", { class: "radial-nav-arc radial-nav-arc--outer" });
        const built = buildArc("radial-arc-outer", cx, cy, rOuter, outer, 22, fillRef);
        group.appendChild(built.path);
        for (const a of built.anchors) group.appendChild(a);
        root.appendChild(group);
        arcs.push(built);
    }

    document.body.classList.add("has-radial-nav");
    menu.appendChild(root);

    const apply = () => {
        for (const arc of arcs) layoutArc(arc.anchors, arc.path.getTotalLength());
    };
    // Initial layout, plus relayout when fonts finish loading (Pixelify Sans is async).
    apply();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(apply);
    addEventListener("resize", apply, { passive: true });
}
