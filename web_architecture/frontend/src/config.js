const rawBackendUrl = import.meta.env.VITE_BACKEND_URL?.trim();

if (!rawBackendUrl) {
    throw new Error('VITE_BACKEND_URL must be configured.');
}

const backendUrl = new URL(rawBackendUrl);

if (
    !['http:', 'https:'].includes(backendUrl.protocol) ||
    backendUrl.pathname !== '/' ||
    backendUrl.search ||
    backendUrl.hash
) {
    throw new Error('VITE_BACKEND_URL must be an HTTP(S) origin');
}

export const BACKEND_URL = backendUrl.origin;