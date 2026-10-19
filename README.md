# GamaWebPlayer

This repository establishes the connection between GAMA simulations and web browsers using MapLibre for simulation control and data visualization.

1. Go to `web_architecture/frontend`, open a terminal and run `npm install` to install the required front-end dependencies

2. Run `npm run dev` to start the front-end server

3. Go to `web_architecture/backend`, open another terminal and run `npm install` to install the required back-end dependencies

4. Run `npm run start:dev` to start the back-end server

5. Update the path of the GAMA model to your corresponding local one (using `this.modelPath` and `this.experimentName` variables in `web_architecture/backend/src/gama/gama.service.ts`)

6. Open GAMA application to start a GAMA server (port 1000)

7. Open a browser at *http://localhost:5173/* to access the architecture. The web client should now connect to the back end and the GAMA simulation

