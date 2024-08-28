import { defineEventHandler } from "h3";

export default defineEventHandler(() => {
	return { id: 1, role_id: 1, username: "Max Mustermann" };
});
