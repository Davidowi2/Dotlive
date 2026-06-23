import { i as dotApi, n as BASE_URL, o as setToken, r as clearToken } from "./client-BT9fM0ow.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth-YjkHUMR9.js
/**
* Authentication API — wraps the Fastify /api/auth/* endpoints.
*/
/**
* Sign up a new user.
* Stores the JWT token on success.
*/
async function signup(data) {
	const res = await dotApi.post("/api/auth/signup", {
		email: data.email,
		password: data.password,
		name: data.name
	});
	setToken(res.token);
	return res;
}
/**
* Sign in with email + password.
* Stores the JWT token on success.
*/
async function login(email, password) {
	const res = await dotApi.post("/api/auth/login", {
		email,
		password
	});
	setToken(res.token);
	return res;
}
/**
* Sign out — invalidates the server session and clears the local token.
*/
async function logout() {
	try {
		await dotApi.post("/api/auth/logout");
	} finally {
		clearToken();
	}
}
/**
* Fetch the current authenticated user from the server.
* Uses the stored JWT. Returns null if not authenticated.
*/
async function getMe() {
	try {
		return (await dotApi.get("/api/auth/me")).user;
	} catch {
		return null;
	}
}
/**
* Returns the URL to redirect the user to for Google OAuth.
* The backend handles the OAuth dance and redirects back to /auth/callback.
*/
function getGoogleAuthUrl() {
	return `${BASE_URL}/api/auth/google`;
}
//#endregion
export { signup as a, logout as i, getMe as n, login as r, getGoogleAuthUrl as t };
