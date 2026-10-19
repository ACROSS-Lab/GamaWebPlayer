import { getColorFromRouteId } from '../utils/color.js';

// Legend for the route list
export function createLegend(routeIds, store, updateRouteFilter, toggleStops) {
    const legend = document.getElementById('legend');

    // Button to show/hide all stops
    const selectAllStopBtn = document.createElement('button');
    selectAllStopBtn.textContent = 'Hide Stops';

    selectAllStopBtn.onclick = () => {
        store.stopVisible = !store.stopVisible;
        toggleStops()
        selectAllStopBtn.textContent = store.stopVisible ? 'Hide stops' : 'Show stops';
    };
    legend.appendChild(selectAllStopBtn);

    // Add Select/Deselect all for routes
    const selectAllRouteBtn = document.createElement('button');
    selectAllRouteBtn.textContent = 'Hide routes';
    selectAllRouteBtn.onclick = () => {
        const allSelected = store.selectedRoutes.size === routeIds.length;
        if (allSelected) {
            store.selectedRoutes.clear();
            document.querySelectorAll('#legend input').forEach(box => box.checked = false);
            selectAllRouteBtn.textContent = 'Show routes';
        } else {
            store.selectedRoutes = new Set(routeIds);
            document.querySelectorAll('#legend input').forEach(box => box.checked = true);
            selectAllRouteBtn.textContent = 'Hide routes';
        }
        updateRouteFilter();
    };
    legend.appendChild(selectAllRouteBtn);

    // Route checkbox
    routeIds.forEach((routeId) => {
        const color = getColorFromRouteId(routeId);

        const item = document.createElement('div');
        item.className = 'legend-item';

        // Add route checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = true;
        checkbox.onchange = () => {
            if (checkbox.checked) {
                store.selectedRoutes.add(routeId);
                if (store.selectedRoutes.size === routeIds.length) {
                    selectAllRouteBtn.textContent = 'Hide routes';
                }
            } else {
                store.selectedRoutes.delete(routeId);
                selectAllRouteBtn.textContent = 'Show routes';
            }
            updateRouteFilter();
        }
        
        // Add route color lookup
        const colorBox = document.createElement('div');
        colorBox.className = 'legend-color';
        colorBox.style.backgroundColor = color;

        // Add route label lookup
        const label = document.createElement('span');
        label.textContent = routeId;

        item.appendChild(checkbox);
        item.appendChild(colorBox);
        item.appendChild(label);
        legend.appendChild(item);
    });
}