import { Hono } from "hono";

import { restrictedRoute } from "@/lib/authHelper";
import { generateSignedImageUrl } from "@/service/imageService";

import { uploadToS3 } from "../service/storageService";

const media = new Hono().post("/upload", async (c) => {
	const body = await c.req.parseBody();
	const file = body.image as File;

	try {
		const s3Url = await uploadToS3(file, file.type);
		// TODO jaketpr-b: implement repository call to update article with s3Url as cover
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
