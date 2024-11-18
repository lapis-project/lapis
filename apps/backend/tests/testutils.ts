import { app } from "@/app";

export const apiHeaders = {
	"Content-Type": "application/json",
	Origin: "http://localhost:3000",
	Host: "localhost:3000",
	Cookie: "",
};

export async function loginUserAndReturnCookie(email: string, password: string) {
	const response = await app.request("/auth/login", {
		method: "POST",
		body: JSON.stringify({ email, password }),
		headers: apiHeaders,
	});

	return response.headers.get("Set-Cookie") ?? "";
}

export async function logoutUser(userHeader: HeadersInit) {
	const response = await app.request("/auth/logout", {
		method: "POST",
		headers: userHeader,
	});
	return response;
}
