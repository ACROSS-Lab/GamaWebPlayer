export function addBuildingLayer(map, data) {
    map.addSource('building', {
        'type': 'geojson',
        'data': data
    });

    map.addLayer({
        'id': 'building_layer',
        'type': 'fill',
        'source': 'building',
        'paint': {
            'fill-color': 'rgba(254, 7, 7, 0.4)',
            'fill-outline-color': 'rgba(200, 100, 240, 1)'
        }
    });
}