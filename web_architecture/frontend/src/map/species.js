export function addSpeciesLayer(map, speciesName, data) {
    const sourceId = speciesName;
    const layerId = `${speciesName}_layer`;
    
    // Check if data is valid and has features
    if (!data.features || data.features.length === 0) {
        return;
    }

    // Only add layer if it doesn't already exist
    if (!map.getSource(sourceId)) {
        // Configure appearance based on species geometry
        const geometryType = data.features[0].geometry.type;
        let layerType = 'circle';
        if (geometryType === 'Polygon' || geometryType === 'MultiPolygon') {
            layerType = 'fill';
        } else if (geometryType === 'LineString' || geometryType === 'MultiLineString') {
            layerType = 'line';
        }

        map.addSource(sourceId, {
            'type': 'geojson',
            'data': data
        });

        map.addLayer({
            'id': layerId,
            'type': layerType,
            'source': sourceId,
            'paint': getPaintStyle(layerType)
        });

        // Extra polygon outline layer
        if (layerType === 'fill') {
            addPolygonOutlineLayer(map, sourceId, layerId);
        }
    }
}

function getPaintStyle(type) {
    if (type === 'fill') {
        return {
            'fill-color': [
                'case',
                // Transparent fill with wireframe=true
                ['boolean', ['get', 'wireframe'], false],
                'rgba(0,0,0,0)',

                // Otherwise, normal color
                [
                    'coalesce',
                    ['get', 'color'],
                    'rgba(0,0,0,0)'
                ]
            ],
            // Always add outline with defined color
            'fill-outline-color': [
                'coalesce',
                ['get', 'color'],
                'rgba(0,0,0,0)'
            ]
        };
    }

    if (type === 'line') {
        return {
            'line-color': [
                'coalesce',
                ['get', 'color'],
                'rgba(0,0,0,0)'
            ],
            'line-width': 2
        };
    }

    // Handle cases with normal color or no color (transparent)
    return {
        'circle-radius': 4,
        'circle-color': [
            'coalesce',
            ['get', 'color'],
            'rgba(0,0,0,0)'
        ],
        'circle-stroke-width': [
            'case',
            ['!=', ['get', 'color'], null],
            1,
            0
        ],
        'circle-stroke-color': 'black',
        'circle-stroke-opacity': [
            'get',
            'opacity'
        ]
    };
}

// Add thicker outline for transparent-filled polygons
function addPolygonOutlineLayer(map, sourceId, layerId) {
    map.addLayer({
        id: `${layerId}_outline`,
        type: 'line',
        source: sourceId,

        paint: {
            'line-color': [
                'coalesce',
                ['get', 'color'],
                'rgba(0,0,0,0)'
            ],

            'line-width': [
                'case',
                ['boolean', ['get', 'wireframe'], false],
                2,
                1
            ]
        }
    });
}

export function updateSpeciesLayer(map, speciesName, data) {
    const source = map.getSource(speciesName);

    if (source) {
        // console.log(`Updating layer for species: ${speciesName} with ${data.features.length} features.`);
        source.setData(data);
    } else if (data.features && data.features.length > 0) {
        addSpeciesLayer(map, speciesName, data);
    }
}

export function updateVisibility(map, speciesName, visible) {
    const layerId = `${speciesName}_layer`;
    const outlineId = `${layerId}_outline`;

    const visibility = visible ? 'visible' : 'none';

    if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', visibility);
    }

    if (map.getLayer(outlineId)) {
        map.setLayoutProperty(outlineId, 'visibility', visibility);
    }
}
