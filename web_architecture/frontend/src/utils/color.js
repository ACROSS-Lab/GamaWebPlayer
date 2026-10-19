// Set a color for each route
export function getColorFromRouteId(routeId) {
    let hash = 0;
    for (let i = 0; i < routeId.length; i++) {
        hash = routeId.charCodeAt(i) + ((hash << 5) - hash);
    }

    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 50%)`;
}