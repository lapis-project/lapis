/* eslint-disable @typescript-eslint/no-unused-vars */
import { Hono } from "hono";

// import { restrictedRoute } from "@/lib/authHelper";
import { uploadToS3 } from "../service/storageService";

const media = new Hono();

// TODO: add restrictedRoute as second parameter
const mediaUpload = media.post("/upload", async (c) => {
	const body = await c.req.parseBody();
	const file = body.image as File;

	try {
		const url = await uploadToS3(file, file.type);
		return c.json({ url, message: "File uploaded successfully" }, 200);
	} catch (error) {
		console.error("Error in media upload handler:", error);
		return c.json({ message: "Error uploading file" }, 500);
	}
});

export type MediaUploadType = typeof mediaUpload;

export default media;
