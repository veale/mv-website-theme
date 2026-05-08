// Renders the primary nav as concentric semicircles of textPath above the site title.
// First 3 items on the inner arc, the rest on the outer arc. Falls back to the default
// list on mobile (CSS hides the SVG below the breakpoint).

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

const buildArc = (id, cx, cy, r, items, fontSize) => {
    const path = svg("path", {
        id,
        d: arcPath(cx, cy, r),
        fill: "none",
        stroke: "none",
    });
    const texts = items.map((item, i) => {
        const offset = ((i + 0.5) / items.length) * 100;
        const a = svg("a", { href: item.href, target: item.target || "_self" });
        const text = svg("text", {
            "font-size": fontSize,
            "text-anchor": "middle",
            class: "radial-nav-label",
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

    const defs = svg("defs");
    defs.appendChild(svg("path", { id: "radial-arc-inner", d: arcPath(cx, cy, rInner), fill: "none" }));
    defs.appendChild(svg("path", { id: "radial-arc-outer", d: arcPath(cx, cy, rOuter), fill: "none" }));
    root.appendChild(defs);

    if (inner.length) {
        const innerGroup = svg("g", { class: "radial-nav-arc radial-nav-arc--inner" });
        for (const child of buildArc("radial-arc-inner", cx, cy, rInner, inner, 22)) innerGroup.appendChild(child);
        root.appendChild(innerGroup);
    }
    if (outer.length) {
        const outerGroup = svg("g", { class: "radial-nav-arc radial-nav-arc--outer" });
        for (const child of buildArc("radial-arc-outer", cx, cy, rOuter, outer, 22)) outerGroup.appendChild(child);
        root.appendChild(outerGroup);
    }

    document.body.classList.add("has-radial-nav");
    menu.appendChild(root);
}
