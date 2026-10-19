// Set stop icons
export function addStopLayer(map, image) {
    map.addImage('bus_icon', image.data);

    map.addSource('bus_stop', {
        'type': 'geojson',
        'data': '../../public/geojson/stop.geojson'
    });

    map.addLayer({
        'id': 'bus_stop_layer',
        'type': 'symbol',
        'source': 'bus_stop',
        'layout': {
            'icon-image': 'bus_icon',
            'icon-size': 0.04,
            'icon-allow-overlap': false
        }
    });
}

// Add popups showing station names
export function addStopPopup(map) {
    map.on('click', 'bus_stop_layer', (e) => {
        const feature = e.features[0]
        
        const coordinates = feature.geometry.coordinates.slice();
        const name = feature.properties.stop_name || e.feature.properties.stop_id;

        new maplibregl.Popup()
            .setLngLat(coordinates)
            .setHTML(name)
            .addTo(map);
    });
}

// Show pointers on stations
export function addStopPointer(map) {
    map.on('mouseenter', 'bus_stop_layer', () => {
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'bus_stop_layer', () => {
        map.getCanvas().style.cursor = '';
    });
}

export function toggleStops(map, store) {
    map.setLayoutProperty(
        'bus_stop_layer',
        'visibility',
        store.stopVisible ? 'visible' : 'none'
    );
}