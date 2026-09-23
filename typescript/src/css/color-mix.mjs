// SERVED MODEL: claude-opus-5-5
//
// X.P.W5.c — css-color-5 §3 `color-mix()`: THE RESOLUTION, above both lowerings.
//
// The grammar (`algebra/grammar.mjs`) reads a `color-mix()` into a plain record in BOTH lowerings —
// `{ kind: "color-mix", method?: { space, hue? }, items: [{ color, percentage? }, …] }`, where each
// `color` is a frozen `CssColor` or a nested mix record. This module turns that record into the
// `CssColor` the mix computes to. It lives above the algebra for one measured reason: resolution
// needs `pow`, `cbrt`, `atan2`, `sin` and `cos`, and the Wasm instruction set has none of them
// (`lowering-wasm/asm.mjs` carries f64 add/sub/mul/div/min/max/abs and the rounding family only).
// A second implementation of the same arithmetic inside the emitter would make G-5 compare two
// libms rather than two parsers; ONE resolver on the surface is the same function for both targets,
// exactly as `serializeCssColor` and the stylesheet completion already are (`entry.mjs`).
//
// Every step is the specification's, cited where it is taken:
//   css-values-5 §6.1  "normalize mix percentages" (the force-normalization flag set, leftover)
//   css-color-5  §3.3  the item stack, the progress `b / (a + b)` (0.5 when the sum is 0), the
//                      alpha multiplier, and Oklab as the default space (§3.1)
//   css-color-4  §13   interpolation: analogous components and sets carried forward (§13.2),
//                      powerless components to missing on conversion (§4.4), missing components
//                      filled from the other colour (§13.3), premultiplied alpha (§13.4), the four
//                      hue fix-ups (§13.5)
//   css-color-4  §18   the sample conversion code — every matrix and transfer function below is
//                      transcribed from it, not re-derived.
//
// THE RESULT'S SPACE. The frozen `CssColorSpace` (value.js 4.0.0) has thirteen members; four of the
// sixteen interpolation spaces are not among them, and each is written in the frozen space that
// represents it exactly — the reading `color()` already gives the same spaces (`tables.mjs`):
//   srgb → `rgb` (channels ×255) · xyz / xyz-d65 → `xyz` · xyz-d50 → `xyz` (D50→D65, §18) ·
//   display-p3-linear → `xyz` (its linear matrix, §18). css-color-4 §13.2: a missing component is
//   0 through a conversion, so a `none` in those three linear results converts as 0.
// Legacy hsl/hwb results stay `hsl`/`hwb` (the frozen space has both); their sRGB reading is one
// `hslToRgb` away and is what the WPT expectations print.

/* ── §18 sample code: matrices and white points ─────────────────────────────────────────────── */

const D50 = [0.3457 / 0.3585, 1.0, (1.0 - 0.3457 - 0.3585) / 0.3585];

const mul = (M, v) => [
    M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2],
    M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2],
    M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2],
];

const SRGB_TO_XYZ = [
    [506752 / 1228815, 87881 / 245763, 12673 / 70218],
    [87098 / 409605, 175762 / 245763, 12673 / 175545],
    [7918 / 409605, 87881 / 737289, 1001167 / 1053270],
];
const XYZ_TO_SRGB = [
    [12831 / 3959, -329 / 214, -1974 / 3959],
    [-851781 / 878810, 1648619 / 878810, 36519 / 878810],
    [705 / 12673, -2585 / 12673, 705 / 667],
];
const P3_TO_XYZ = [
    [608311 / 1250200, 189793 / 714400, 198249 / 1000160],
    [35783 / 156275, 247089 / 357200, 198249 / 2500400],
    [0 / 1, 32229 / 714400, 5220557 / 5000800],
];
const XYZ_TO_P3 = [
    [446124 / 178915, -333277 / 357830, -72051 / 178915],
    [-14852 / 17905, 63121 / 35810, 423 / 17905],
    [11844 / 330415, -50337 / 660830, 316169 / 330415],
];
const PROPHOTO_TO_XYZ_D50 = [
    [0.7977666449006423, 0.13518129740053308, 0.0313477341283922],
    [0.2880748288194013, 0.711835234241873, 0.00008993693872564],
    [0.0, 0.0, 0.8251046025104602],
];
const XYZ_D50_TO_PROPHOTO = [
    [1.3457868816471583, -0.25557208737979464, -0.05110186497554526],
    [-0.5446307051249019, 1.5082477428451468, 0.02052744743642139],
    [0.0, 0.0, 1.2119675456389452],
];
const A98_TO_XYZ = [
    [573536 / 994567, 263643 / 1420810, 187206 / 994567],
    [591459 / 1989134, 6239551 / 9945670, 374412 / 4972835],
    [53769 / 1989134, 351524 / 4972835, 4929758 / 4972835],
];
const XYZ_TO_A98 = [
    [1829569 / 896150, -506331 / 896150, -308931 / 896150],
    [-851781 / 878810, 1648619 / 878810, 36519 / 878810],
    [16779 / 1248040, -147721 / 1248040, 1266979 / 1248040],
];
const REC2020_TO_XYZ = [
    [63426534 / 99577255, 20160776 / 139408157, 47086771 / 278816314],
    [26158966 / 99577255, 472592308 / 697040785, 8267143 / 139408157],
    [0 / 1, 19567812 / 697040785, 295819943 / 278816314],
];
const XYZ_TO_REC2020 = [
    [30757411 / 17917100, -6372589 / 17917100, -4539589 / 17917100],
    [-19765991 / 29648200, 47925759 / 29648200, 467509 / 29648200],
    [792561 / 44930125, -1921689 / 44930125, 42328811 / 44930125],
];
const D65_TO_D50 = [
    [1.0479297925449969, 0.022946870601609652, -0.05019226628920524],
    [0.02962780877005599, 0.9904344267538799, -0.017073799063418826],
    [-0.009243040646204504, 0.015055191490298152, 0.7518742814281371],
];
const D50_TO_D65 = [
    [0.955473421488075, -0.02309845494876471, 0.06325924320057072],
    [-0.0283697093338637, 1.0099953980813041, 0.021041441191917323],
    [0.012314014864481998, -0.020507649298898964, 1.330365926242124],
];
const XYZ_TO_LMS = [
    [0.819022437996703, 0.3619062600528904, -0.1288737815209879],
    [0.0329836539323885, 0.9292868615863434, 0.0361446663506424],
    [0.0481771893596242, 0.2642395317527308, 0.6335478284694309],
];
const LMS_TO_OKLAB = [
    [0.210454268309314, 0.7936177747023054, -0.0040720430116193],
    [1.9779985324311684, -2.4285922420485799, 0.450593709617411],
    [0.0259040424655478, 0.7827717124575296, -0.8086757549230774],
];
const LMS_TO_XYZ = [
    [1.2268798758459243, -0.5578149944602171, 0.2813910456659647],
    [-0.0405757452148008, 1.112286803280317, -0.0717110580655164],
    [-0.0763729366746601, -0.4214933324022432, 1.5869240198367816],
];
const OKLAB_TO_LMS = [
    [1.0, 0.3963377773761749, 0.2158037573099136],
    [1.0, -0.1055613458156586, -0.0638541728258133],
    [1.0, -0.0894841775298119, -1.2914855480194092],
];

/* ── §18 transfer functions ─────────────────────────────────────────────────────────────────── */

const signed = (f) => (v) => (v < 0 ? -f(-v) : f(v));
const linSrgb = signed((a) => (a <= 0.04045 ? a / 12.92 : Math.pow((a + 0.055) / 1.055, 2.4)));
const gamSrgb = signed((a) => (a > 0.0031308 ? 1.055 * Math.pow(a, 1 / 2.4) - 0.055 : 12.92 * a));
const linProPhoto = signed((a) => (a <= 16 / 512 ? a / 16 : Math.pow(a, 1.8)));
const gamProPhoto = signed((a) => (a >= 1 / 512 ? Math.pow(a, 1 / 1.8) : 16 * a));
const linA98 = signed((a) => Math.pow(a, 563 / 256));
const gamA98 = signed((a) => Math.pow(a, 256 / 563));
const lin2020 = signed((a) => Math.pow(a, 2.4));
const gam2020 = signed((a) => Math.pow(a, 1 / 2.4));

/* ── §18 Lab / OKLab / polar forms, and §7–§8 hsl / hwb ─────────────────────────────────────── */

const LAB_E = 216 / 24389;
const LAB_K = 24389 / 27;

function xyzD50ToLab(XYZ) {
    const f = XYZ.map((v, i) => v / D50[i]).map((v) => (v > LAB_E ? Math.cbrt(v) : (LAB_K * v + 16) / 116));
    return [116 * f[1] - 16, 500 * (f[0] - f[1]), 200 * (f[1] - f[2])];
}
function labToXyzD50(Lab) {
    const f1 = (Lab[0] + 16) / 116;
    const f0 = Lab[1] / 500 + f1;
    const f2 = f1 - Lab[2] / 200;
    const xyz = [
        Math.pow(f0, 3) > LAB_E ? Math.pow(f0, 3) : (116 * f0 - 16) / LAB_K,
        Lab[0] > LAB_K * LAB_E ? Math.pow((Lab[0] + 16) / 116, 3) : Lab[0] / LAB_K,
        Math.pow(f2, 3) > LAB_E ? Math.pow(f2, 3) : (116 * f2 - 16) / LAB_K,
    ];
    return xyz.map((v, i) => v * D50[i]);
}
const xyzToOklab = (XYZ) => mul(LMS_TO_OKLAB, mul(XYZ_TO_LMS, XYZ).map((c) => Math.cbrt(c)));
const oklabToXyz = (Lab) => mul(LMS_TO_XYZ, mul(OKLAB_TO_LMS, Lab).map((c) => c ** 3));

/** Rectangular → polar. The hue is `NaN` (powerless) at or below the space's chroma ε (§4.4). */
function toPolar([L, a, b], epsilon) {
    const C = Math.sqrt(a * a + b * b);
    let H = (Math.atan2(b, a) * 180) / Math.PI;
    if (H < 0) H += 360;
    return [L, C, C <= epsilon ? NaN : H];
}
const fromPolar = ([L, C, H]) => [L, C * Math.cos((H * Math.PI) / 180), C * Math.sin((H * Math.PI) / 180)];

/** §7.1 `hslToRgb`, over saturation/lightness in [0, 1] (the frozen `hsl` channel scale). */
function hslToRgb([hue, sat, light]) {
    const f = (n) => {
        const k = (n + hue / 30) % 12;
        const a = sat * Math.min(light, 1 - light);
        return light - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    };
    return [f(0), f(8), f(4)];
}
/** §7.2 `rgbToHsl`, answering saturation/lightness in [0, 1]; ε = 1/100000 (S <= 0.001 on 0..100). */
function rgbToHsl([red, green, blue]) {
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    let [hue, sat] = [NaN, 0];
    const light = (min + max) / 2;
    const d = max - min;
    if (d !== 0) {
        sat = light === 0 || light === 1 ? 0 : (max - light) / Math.min(light, 1 - light);
        switch (max) {
            case red: hue = (green - blue) / d + (green < blue ? 6 : 0); break;
            case green: hue = (blue - red) / d + 2; break;
            default: hue = (red - green) / d + 4;
        }
        hue *= 60;
    }
    if (sat < 0) {
        hue += 180;
        sat = Math.abs(sat);
    }
    if (hue >= 360) hue -= 360;
    if (sat <= 1 / 100000) hue = NaN;
    return [hue, sat, light];
}
/** §8.1 `hwbToRgb`, over whiteness/blackness in [0, 1]. */
function hwbToRgb([hue, white, black]) {
    if (white + black >= 1) {
        const gray = white / (white + black);
        return [gray, gray, gray];
    }
    return hslToRgb([hue, 1, 0.5]).map((c) => c * (1 - white - black) + white);
}
/** §8.2 `rgbToHwb`: the hue is powerless when W + B >= 1 - ε, ε = 1/100000. */
function rgbToHwb([red, green, blue]) {
    const hue = rgbToHue(red, green, blue);
    const white = Math.min(red, green, blue);
    const black = 1 - Math.max(red, green, blue);
    return [white + black >= 1 - 1 / 100000 ? NaN : hue, white, black];
}
function rgbToHue(red, green, blue) {
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    const d = max - min;
    let hue = NaN;
    if (d !== 0) {
        switch (max) {
            case red: hue = (green - blue) / d + (green < blue ? 6 : 0); break;
            case green: hue = (blue - red) / d + 2; break;
            default: hue = (red - green) / d + 4;
        }
        hue *= 60;
    }
    if (hue >= 360) hue -= 360;
    return hue;
}

/* ── the sixteen interpolation spaces (css-color-4 §13.1) ───────────────────────────────────── */
//
// `cats` names each channel's analogous category (css-color-4 §13.2's table: Reds r,x · Greens g,y ·
// Blues b,z · Lightness L · Colorfulness C,S · Hue H · Opponent a · Opponent b); `null` is a channel
// with no analog (HWB's whiteness and blackness). `hue` is the hue channel's index in a polar
// space and `chroma` the colorfulness index whose ε (§4.4, the per-space "powerless hue ε") zeroes
// a noise chroma when its hue turns powerless on conversion.

const RGB_CATS = ["R", "G", "B"];
const rgbSpace = (toLinearXyz, fromXyzLinear, lin, gam) => ({
    cats: RGB_CATS,
    toXyz: (c) => toLinearXyz(lin ? c.map(lin) : c),
    fromXyz: (x) => (gam ? fromXyzLinear(x).map(gam) : fromXyzLinear(x)),
});
const srgb = {
    ...rgbSpace((c) => mul(SRGB_TO_XYZ, c), (x) => mul(XYZ_TO_SRGB, x), linSrgb, gamSrgb),
    toSrgb: (c) => c.slice(),
    fromSrgb: (c) => c.slice(),
};
const lab = {
    cats: ["L", "A", "O"],
    toXyz: (c) => mul(D50_TO_D65, labToXyzD50(c)),
    fromXyz: (x) => xyzD50ToLab(mul(D65_TO_D50, x)),
};
const oklab = { cats: ["L", "A", "O"], toXyz: oklabToXyz, fromXyz: xyzToOklab };

export const SPACES = Object.freeze({
    srgb,
    "srgb-linear": rgbSpace((c) => mul(SRGB_TO_XYZ, c), (x) => mul(XYZ_TO_SRGB, x)),
    "display-p3": rgbSpace((c) => mul(P3_TO_XYZ, c), (x) => mul(XYZ_TO_P3, x), linSrgb, gamSrgb),
    "display-p3-linear": rgbSpace((c) => mul(P3_TO_XYZ, c), (x) => mul(XYZ_TO_P3, x)),
    "a98-rgb": rgbSpace((c) => mul(A98_TO_XYZ, c), (x) => mul(XYZ_TO_A98, x), linA98, gamA98),
    "prophoto-rgb": rgbSpace(
        (c) => mul(D50_TO_D65, mul(PROPHOTO_TO_XYZ_D50, c)),
        (x) => mul(XYZ_D50_TO_PROPHOTO, mul(D65_TO_D50, x)),
        linProPhoto,
        gamProPhoto,
    ),
    rec2020: rgbSpace((c) => mul(REC2020_TO_XYZ, c), (x) => mul(XYZ_TO_REC2020, x), lin2020, gam2020),
    lab,
    oklab,
    "xyz-d65": { cats: RGB_CATS, toXyz: (c) => c.slice(), fromXyz: (x) => x.slice() },
    "xyz-d50": { cats: RGB_CATS, toXyz: (c) => mul(D50_TO_D65, c), fromXyz: (x) => mul(D65_TO_D50, x) },
    hsl: {
        cats: ["H", "C", "L"],
        hue: 0,
        chroma: 1,
        epsilon: 1 / 100000,
        toXyz: (c) => srgb.toXyz(hslToRgb(c)),
        fromXyz: (x) => rgbToHsl(srgb.fromXyz(x)),
        toSrgb: hslToRgb,
        fromSrgb: rgbToHsl,
    },
    hwb: {
        cats: ["H", null, null],
        hue: 0,
        toXyz: (c) => srgb.toXyz(hwbToRgb(c)),
        fromXyz: (x) => rgbToHwb(srgb.fromXyz(x)),
        toSrgb: hwbToRgb,
        fromSrgb: rgbToHwb,
    },
    lch: {
        cats: ["L", "C", "H"],
        hue: 2,
        chroma: 1,
        epsilon: 0.0015,
        toXyz: (c) => lab.toXyz(fromPolar(c)),
        fromXyz: (x) => toPolar(lab.fromXyz(x), 0.0015),
    },
    oklch: {
        cats: ["L", "C", "H"],
        hue: 2,
        chroma: 1,
        epsilon: 0.000004,
        toXyz: (c) => oklab.toXyz(fromPolar(c)),
        fromXyz: (x) => toPolar(oklab.fromXyz(x), 0.000004),
    },
});

/** The method's space as this table names it: `xyz` is `xyz-d65` (css-color-4 §10.8). */
const spaceOf = (name) => (name === "xyz" ? "xyz-d65" : name);

/**
 * A frozen `CssColor` as an interpolation-space colour: `{ space, ch: [v | null ×3], alpha }`, with
 * `null` for `none`. `rgb` is sRGB on the 0..255 scale and `xyz` is D65 (the frozen reading).
 */
function fromCssColor(color) {
    const v = (x) => (x === "none" ? null : x);
    const ch = color.channels.map(v);
    const alpha = v(color.alpha);
    if (color.space === "rgb") return { space: "srgb", ch: ch.map((x) => (x === null ? null : x / 255)), alpha };
    return { space: spaceOf(color.space), ch, alpha };
}

/* ── css-color-4 §13: one colour into the interpolation space ───────────────────────────────── */

/**
 * §13.2 then §4.4: the carried-forward components are identified FIRST (from the source's missing
 * channels, individually by category and then as the remaining analogous set), the colour is
 * converted with every missing channel as 0, a powerless hue produced by the conversion becomes
 * missing (its noise chroma ≤ ε zeroed), and the carried components are re-inserted as missing.
 * A colour already IN the space is not converted, so nothing about it turns powerless.
 */
function toInterpolationSpace(color, space) {
    if (color.space === space) return { ch: color.ch.slice(), alpha: color.alpha };
    const src = SPACES[color.space];
    const dst = SPACES[space];
    const carried = new Set();
    color.ch.forEach((x, i) => {
        if (x === null && src.cats[i] !== null && dst.cats.includes(src.cats[i])) carried.add(dst.cats.indexOf(src.cats[i]));
    });
    const srcRest = [0, 1, 2].filter((i) => src.cats[i] === null || !dst.cats.includes(src.cats[i]));
    const dstRest = [0, 1, 2].filter((j) => dst.cats[j] === null || !src.cats.includes(dst.cats[j]));
    if (srcRest.length > 0 && srcRest.every((i) => color.ch[i] === null)) dstRest.forEach((j) => carried.add(j));

    //  srgb, hsl and hwb are one gamut in three coordinate systems (css-color-4 §7.1, §8.1 define
    //  hsl() and hwb() as transformations OF sRGB), so a conversion among them goes through sRGB
    //  directly. Routing it through XYZ instead measurably manufactures a hue: `white` came back
    //  from the D65 round trip as 1 ± 1e-16 per channel, and §7.2's saturation divides that noise
    //  by `1 - light` — `color-mix(in hsl, white, blue)` read 270° instead of blue's 240°.
    const zeros = color.ch.map((x) => (x === null ? 0 : x));
    const converted = src.toSrgb && dst.fromSrgb ? dst.fromSrgb(src.toSrgb(zeros)) : dst.fromXyz(src.toXyz(zeros));
    const ch = converted.map((x) => (Number.isNaN(x) ? null : x));
    if (dst.hue !== undefined && ch[dst.hue] === null && dst.chroma !== undefined) {
        const c = ch[dst.chroma];
        if (c > 0 && c <= dst.epsilon) ch[dst.chroma] = 0;
    }
    for (const j of carried) ch[j] = null;
    return { ch, alpha: color.alpha };
}

const mod360 = (h) => ((h % 360) + 360) % 360;

/** §13.5 — the hue fix-up, over two present hues already constrained to [0, 360). */
function fixHues(h1, h2, method) {
    const d = h2 - h1;
    switch (method) {
        case "longer":
            if (d > 0 && d < 180) h1 += 360;
            else if (d > -180 && d <= 0) h2 += 360;
            break;
        case "increasing":
            if (d < 0) h2 += 360;
            break;
        case "decreasing":
            if (d > 0) h1 += 360;
            break;
        default: //                                                 shorter, the default (§13.5)
            if (d > 180) h1 += 360;
            else if (d < -180) h2 += 360;
    }
    return [h1, h2];
}

/** §13.3 fill, §13.5 fix-up, §13.4 premultiply, interpolate at `t`, un-premultiply. */
function interpolate(a, b, t, space, method) {
    const hue = SPACES[space].hue;
    const A = a.ch.map((x, i) => (x === null ? b.ch[i] : x));
    const B = b.ch.map((x, i) => (x === null ? a.ch[i] : x));
    const aAlpha = a.alpha === null ? b.alpha : a.alpha;
    const bAlpha = b.alpha === null ? a.alpha : b.alpha;
    if (hue !== undefined && A[hue] !== null && B[hue] !== null) [A[hue], B[hue]] = fixHues(mod360(A[hue]), mod360(B[hue]), method);
    const premultiply = (ch, alpha) => (alpha === null ? ch : ch.map((x, i) => (x === null || i === hue ? x : x * alpha)));
    const P = premultiply(A, aAlpha);
    const Q = premultiply(B, bAlpha);
    const ch = P.map((x, i) => (x === null ? null : x + (Q[i] - x) * t));
    const alpha = aAlpha === null ? null : aAlpha + (bAlpha - aAlpha) * t;
    const out = alpha === null || alpha === 0 ? ch : ch.map((x, i) => (x === null || i === hue ? x : x / alpha));
    if (hue !== undefined && out[hue] !== null) out[hue] = mod360(out[hue]);
    return { ch: out, alpha };
}

/* ── css-values-5 §6.1 and css-color-5 §3.3 ─────────────────────────────────────────────────── */

/** "normalize mix percentages" with the force-normalization flag set: `{ weights, leftover }`, in %. */
export function normalizeMixPercentages(percentages) {
    const given = percentages.filter((p) => p !== undefined);
    const specifiedSum = given.length === 0 ? 0 : Math.min(100, given.reduce((s, p) => s + p, 0));
    const omitted = percentages.length - given.length;
    const weights = percentages.map((p) => (p === undefined ? (100 - specifiedSum) / omitted : p));
    const total = weights.reduce((s, p) => s + p, 0);
    const scaled = total > 0 ? weights.map((p) => (p * 100) / total) : weights;
    return { weights: scaled, leftover: total < 100 ? 100 - total : 0 };
}

/** The interpolation-space result as a frozen `CssColor` (the header's four representations). */
function toCssColor({ ch, alpha }, space) {
    const none = (x) => (x === null ? "none" : x);
    const linear = (M) => ({ space: "xyz", channels: mul(M, ch.map((x) => (x === null ? 0 : x))), alpha: none(alpha) });
    switch (space) {
        case "srgb": return { space: "rgb", channels: ch.map((x) => (x === null ? "none" : x * 255)), alpha: none(alpha) };
        case "xyz-d65": return { space: "xyz", channels: ch.map(none), alpha: none(alpha) };
        case "xyz-d50": return linear(D50_TO_D65);
        case "display-p3-linear": return linear(P3_TO_XYZ);
        default: return { space, channels: ch.map(none), alpha: none(alpha) };
    }
}

const finite = (x) => x === "none" || Number.isFinite(x);

/**
 * css-color-5 §3.3 over a `color-mix` record (the shape `algebra/grammar.mjs` builds in both
 * lowerings). Answers the frozen `CssColor`, or `null` when an input is too large for the
 * arithmetic to stay finite — the caller's refusal, never a non-finite colour.
 */
export function resolveColorMix(mix) {
    const space = spaceOf(mix.method === undefined ? "oklab" : mix.method.space); //   §3.1: Oklab by default
    const method = mix.method?.hue ?? "shorter";
    const colors = [];
    for (const item of mix.items) {
        const color = item.color.kind === "color-mix" ? resolveColorMix(item.color) : item.color;
        if (color === null) return null;
        colors.push(toInterpolationSpace(fromCssColor(color), space));
    }
    const { weights, leftover } = normalizeMixPercentages(mix.items.map((item) => item.percentage));
    let acc = colors[0];
    let accWeight = weights[0];
    for (let k = 1; k < colors.length; k++) {
        const combined = accWeight + weights[k];
        acc = interpolate(acc, colors[k], combined > 0 ? weights[k] / combined : 0.5, space, method);
        accWeight = combined;
    }
    const alphaMult = 1 - leftover / 100;
    const result = toCssColor({ ch: acc.ch, alpha: acc.alpha === null ? null : acc.alpha * alphaMult }, space);
    return result.channels.every(finite) && finite(result.alpha) ? result : null;
}
