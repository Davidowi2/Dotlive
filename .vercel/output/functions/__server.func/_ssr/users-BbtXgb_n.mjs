import { i as dotApi } from "./client-BT9fM0ow.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/users-BbtXgb_n.js
/**
* Users API — wraps the Fastify /api/users/* endpoints.
*/
/**
* Update the current user's profile fields.
*/
async function updateProfile(data) {
	return (await dotApi.patch("/api/users/me", data)).user;
}
/**
* Look up a user by their DOT ID (public profile).
*/
async function getByDotId(dotId) {
	return (await dotApi.get(`/api/users/by-dot-id/${dotId}`)).user;
}
//#endregion
export { updateProfile as n, getByDotId as t };
