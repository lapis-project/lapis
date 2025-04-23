import { Hono } from "hono";

import { updateArticleCover } from "@/db/cmsRepository";
import { restrictedRoute } from "@/lib/authHelper";
import { generateSignedImageUrl } from "@/service/imageService";

import { uploadToS3 } from "../service/storageService";

const media = new Hono().post("/upload/:id", async (c) => {
	const body = await c.req.parseBody();
	const file = body.image as File;
	const providedId = c.req.param("id");

	if (!providedId) {
		return c.json("No id provided", 400);
	}

	// Check if the id is a number
	if (Number.isNaN(Number(providedId))) {
		return c.json("Provided id is not a number", 400);
	}

	try {
		const s3Url = await uploadToS3(file, file.type);
		await updateArticleCover(s3Url, Number(providedId));
		const imageUrl = generateSignedImageUrl(s3Url);
		return c.json({ imageUrl, message: "File uploaded successfully" }, 200);
	} catch (error) {
		console.error("Error in media upload handler:", error);
		return c.json({ message: "Error uploading file" }, 500);
	}
});

media.use("*", restrictedRoute);

export default media;
export type MediaUploadType = typeof media;
