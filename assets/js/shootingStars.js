// Subtle ASCII shooting stars: occasional, max 2 on screen at once, top-right → bottom-left.
// Random spawn cadence, random start offset along the perpendicular to the trajectory.

// Multi-line ASCII sparkle with the cross-shaped star at columns 0-2 of row 1, trail extending right.
// Three rows so the perpendicular rays of the sparkle are visible above/below the body.
const GLYPHS = [
    "  .  \n.<*>.  ·   ·    ·     ·     ·\n  '  ",
    "  '  \n-<+>-  -    -     -      -\n  ,  ",
    "  |  \n-<*>-  ·   ·    ·     ·\n  |  ",
    "  .  \n,(*),  -  -   -    -     -\n  '  ",
];

const TRAVEL_ANGLE_DEG = 135;   // top-right → bottom-left in screen coords (y-down)
const TRAIL_ROTATION_DEG = -45; // rotates the element so its trail points to upper-right

const MIN_INTERVAL = 4000;
const MAX_INTERVAL = 12000;
const MIN_DURATION = 1800;
const MAX_DURATION = 3500;
const MAX_CONCURRENT = 2;

let active = 0;
let layer;

const ensureLayer = () => {
    if (layer) return layer;
    layer = document.createElement("div");
    layer.className = "shooting-stars";
    layer.setAttribute("aria-hidden", "true");
    document.body.appendChild(layer);
    return layer;
};

const spawn = () => {
    if (active >= MAX_CONCURRENT) return;
    if (document.hidden) return;
    active++;

    const vw = innerWidth;
    const vh = innerHeight;
    const star = document.createElement("span");
    star.className = "shooting-star";
    star.textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

    // Pick a start point somewhere across the top and right edges, then travel a fixed-angle
    // distance long enough to clear the opposite corner.
    const startX = vw * (0.4 + Math.random() * 0.7);
    const startY = vh * (-0.1 + Math.random() * 0.5);
    const distance = Math.hypot(vw, vh) * 1.1;
    const rad = (TRAVEL_ANGLE_DEG * Math.PI) / 180;
    const endX = startX + distance * Math.cos(rad);
    const endY = startY + distance * Math.sin(rad);

    ensureLayer().appendChild(star);

    const anim = star.animate(
        [
            { transform: `translate(${startX}px, ${startY}px) rotate(${TRAIL_ROTATION_DEG}deg)`, opacity: 0 },
            { opacity: 0.7, offset: 0.15 },
            { opacity: 0.7, offset: 0.85 },
            { transform: `translate(${endX}px, ${endY}px) rotate(${TRAIL_ROTATION_DEG}deg)`, opacity: 0 },
        ],
        {
            duration: MIN_DURATION + Math.random() * (MAX_DURATION - MIN_DURATION),
            easing: "linear",
            fill: "forwards",
        }
    );

    anim.onfinish = () => {
        star.remove();
        active--;
    };
};

const tick = () => {
    spawn();
    setTimeout(tick, MIN_INTERVAL + Math.random() * (MAX_INTERVAL - MIN_INTERVAL));
};

export default function shootingStars() {
    setTimeout(tick, 1500 + Math.random() * 3000);
}
