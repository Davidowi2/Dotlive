//#region node_modules/.nitro/vite/services/ssr/assets/client-BT9fM0ow.js
/** Structured error thrown by the API client */
var ApiError = class extends Error {
	status;
	code;
	details;
	constructor(message, status, code, details) {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.code = code;
		this.details = details;
	}
};
/**
* DOT API client — fetch wrapper for the Fastify backend.
*
* - Base URL: VITE_API_URL env var (default: https://dotlive-api.onrender.com)
* - JWT stored in localStorage under 'dot_jwt'
* - Auto-attaches Authorization: Bearer <token> header
* - Handles 401 by clearing token and redirecting to /auth
* - Throws ApiError on non-2xx responses
*/
var BASE_URL = "https://dotlive-api.onrender.com";
var TOKEN_KEY = "dot_jwt";
function getToken() {
	try {
		return localStorage.getItem(TOKEN_KEY);
	} catch {
		return null;
	}
}
function setToken(token) {
	try {
		localStorage.setItem(TOKEN_KEY, token);
	} catch {}
}
function clearToken() {
	try {
		localStorage.removeItem(TOKEN_KEY);
	} catch {}
}
async function request(method, path, body, options) {
	const token = getToken();
	const headers = {
		"Content-Type": "application/json",
		...options?.headers
	};
	if (token) headers["Authorization"] = `Bearer ${token}`;
	const res = await fetch(`${BASE_URL}${path}`, {
		method,
		headers,
		body: body !== void 0 ? JSON.stringify(body) : void 0,
		...options
	});
	if (res.status === 401) {
		clearToken();
		if (typeof window !== "undefined") window.location.href = "/auth";
		throw new ApiError("Unauthorized — please sign in again.", 401, "unauthorized");
	}
	let data;
	if ((res.headers.get("content-type") ?? "").includes("application/json")) data = await res.json();
	else data = await res.text();
	if (!res.ok) {
		const err = data;
		throw new ApiError(err?.error ?? `Request failed with status ${res.status}`, res.status, err?.code, err?.details);
	}
	return data;
}
var dotApi = {
	get(path, options) {
		return request("GET", path, void 0, options);
	},
	post(path, body, options) {
		return request("POST", path, body, options);
	},
	patch(path, body, options) {
		return request("PATCH", path, body, options);
	},
	put(path, body, options) {
		return request("PUT", path, body, options);
	},
	delete(path, options) {
		return request("DELETE", path, void 0, options);
	}
};
//#endregion
export { getToken as a, dotApi as i, BASE_URL as n, setToken as o, clearToken as r, ApiError as t };
