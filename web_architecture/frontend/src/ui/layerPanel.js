import {updateVisibility} from "../map/species.js";

export function createLayerPanel(map, speciesList, hiddenSpecies = []) {
    const panel = document.getElementById("layer-panel");

    for (const species of speciesList) {
        if (hiddenSpecies.includes(species)) continue;

        const row = document.createElement("div");
        row.className = "layer-row";

        const checkbox = document.createElement("input");
        checkbox.className = "layer-checkbox";
        checkbox.type = "checkbox";
        checkbox.checked = true;

        const label = document.createElement("label");
        label.className = "layer-label";
        label.textContent = species;

        const rowUpdateVisibility = () => {
            updateVisibility(map, species, checkbox.checked);
        }

        checkbox.addEventListener("change", rowUpdateVisibility);
        row.addEventListener("click", (event) => {
            if (event.target === checkbox) return;
            checkbox.checked = !checkbox.checked;
            rowUpdateVisibility();
        });

        row.appendChild(checkbox);
        row.appendChild(label);
        panel.appendChild(row);
    }
}