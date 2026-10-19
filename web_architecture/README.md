## Folder structure

*frontend*: using Vite bundler and MapLibre for GAMA simulation data visualization.

*backend*: using NestJS back-end and the typescript library `gama.clients` for GAMA connection.

---
### Notes

This client architecture can also be applied for other GAMA mobility models with a few modification in species declaration:

- **Aspect attributes**: Instead of setting properties directly in the `aspect` (example: `color, wireframe...`),  there should be variables for them which then are called in `aspect` instead.
- **Layer order**: To ensure the species appear in a correct order on the client, add this list in the `global{}` section of the model specifying their names inside (the latter will appear on top): `list<string>  species_list  <- [...];`
- **Dynamic species**:  Add this attribute `bool  moveInClient  <-  true;` to species that are updated over time.
