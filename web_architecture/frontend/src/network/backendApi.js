const API_BASE = "http://localhost:3000";

export async function initialize() {
    const response = await post("/simulation/initialize");
    return response.json();
}

export async function start() {
    await post("/simulation/start");
}

export async function pause() {
    await post("/simulation/pause");
}

export async function stop() {
    await post("/simulation/stop");
}

export async function reload() {
    await post("/simulation/reload");
}

export async function step() {
    await post("/simulation/step");
}

export async function setMode(mode) {
    const response = await post("/simulation/setMode", { mode });
    return response.json();
}

export function cleanup() {
    return navigator.sendBeacon(`${API_BASE}/simulation/cleanup`);
}

async function post(path, body) {
    const options = {
        method: "POST",
    };

    if (body !== undefined) {
        options.headers = {
            "Content-Type": "application/json",
        };
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE}${path}`, options);

    if (!response.ok) {
        let message = `Request failed: ${response.status} ${response.statusText}`;

        try {
            const errorBody = await response.json();

            if (errorBody.message) {
                message = Array.isArray(errorBody.message)
                    ? errorBody.message.join(", ")
                    : errorBody.message;
            }
        } catch {
            // The backend response did not contain JSON.
        }

        throw new Error(message);
    }

    return response;
}
