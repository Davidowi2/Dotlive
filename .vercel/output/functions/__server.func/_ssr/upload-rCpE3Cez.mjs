import { a as getToken, t as ApiError } from "./client-BT9fM0ow.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/upload-rCpE3Cez.js
/**
* Upload API — wraps the Fastify /api/upload/* endpoints.
* Uses Cloudinary for all media storage.
*/
var BASE_URL = "https://dotlive-api.onrender.com";
/**
* Upload an image file (avatar, logo, etc.) via the backend.
* Returns the Cloudinary secure URL.
*/
async function uploadImage(file, folder = "avatars") {
	const token = getToken();
	const formData = new FormData();
	formData.append("file", file);
	const res = await fetch(`${BASE_URL}/api/upload/image?folder=${encodeURIComponent(folder)}`, {
		method: "POST",
		headers: token ? { Authorization: `Bearer ${token}` } : {},
		body: formData
	});
	if (!res.ok) throw new ApiError((await res.json().catch(() => ({}))).error ?? "Upload failed", res.status);
	return (await res.json()).url;
}
/**
* Upload a document (PDF, pitch deck, etc.) via the backend.
* Returns the Cloudinary secure URL.
*/
async function uploadDocument(file, folder = "documents") {
	const token = getToken();
	const formData = new FormData();
	formData.append("file", file);
	const res = await fetch(`${BASE_URL}/api/upload/document?folder=${encodeURIComponent(folder)}`, {
		method: "POST",
		headers: token ? { Authorization: `Bearer ${token}` } : {},
		body: formData
	});
	if (!res.ok) throw new ApiError((await res.json().catch(() => ({}))).error ?? "Upload failed", res.status);
	return (await res.json()).url;
}
//#endregion
export { uploadImage as n, uploadDocument as t };
