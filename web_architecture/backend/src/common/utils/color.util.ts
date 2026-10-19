export function normalizeColor(colorValue) {
    if (!colorValue) return "#000000";

    // Case valid hex
    if (colorValue.startsWith("#")) {
        return colorValue;
    }

    // Case named color
    let match = colorValue.match(/^color\[(.+)\]$/i);
    if (match) {
        return match[1].toLowerCase();
    }

    // Case RGB format
    match = colorValue.match(/^rgb\s*\(\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+)\s*\)$/i);
    if (match) {
        const r = parseInt(match[1]);
        const g = parseInt(match[2]);
        const b = parseInt(match[3]);
        const a = parseInt(match[4]) / 255;
        return `rgba(${r}, ${g}, ${b}, ${a})`;
    }

    // Fallback
    return colorValue;
}

export function extractOpacity(colorValue) {
    if (!colorValue) return 0;

    const match = colorValue.match(/^rgba\(\s*\d+,\s*\d+,\s*\d+,\s*([0-9.]+)\s*\)$/i);

    // RGBA color
    if (match) {
        return parseFloat(match[1]);
    }

    return 1;
}