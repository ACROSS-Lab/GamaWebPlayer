import { getColorFromRouteId } from '../utils/color.js';

export function addRouteLayer(map, data, routeIds) {
    const colorMatch = ['match', ['coalesce', ['get', 'route_id'], ['get', 'route_name']]];
    
    routeIds.forEach((id) => {
        colorMatch.push(id, getColorFromRouteId(id));
    });
    colorMatch.push('#888888');

    map.addSource('bus_route', {
        'type': 'geojson',
        'data': data
    });

    map.addLayer({
        'id': 'bus_route_layer',
        'type': 'line',
        'source': 'bus_route',
        'paint': {
            'line-color': colorMatch
        }
    });
}

// Helper function to show/hide route according to checkboxes
export function updateRouteFilter(map, store) {
    if (store.selectedRoutes.size === 0) {
        map.setFilter('bus_route_layer', ['==', ['get', 'route_id'], '']);
        return;
    }

    map.setFilter('bus_route_layer', [
        'in',
        ['coalesce', ['get', 'route_id'], ['get', 'route_name']],
        ['literal', Array.from(store.selectedRoutes)]
    ])
}