import { log } from "@acdh-oeaw/lib";
import { Hono } from "hono";

import { getCoverById, updateArticleCover } from "@/db/cmsRepository";
import { restrictedRoute } from "@/lib/authHelper";
import { generateSignedImageUrl } from "@/service/imageService";

import { deleteFromS3, uploadToS3 } from "../service/storageService";

const media = new Hono()
	.post("/upload/:id", async (c) => {
		const body = await c.req.parseBody();
		const file = body.image as File;
		const providedId = c.req.param("id");

		if (!providedId) {
			return c.json("No id provided", 400);
		}

		if (Number.isNaN(Number(providedId))) {
			return c.json("Provided id is not a number", 400);
		}

		try {
			const s3Url = await uploadToS3(file, file.type);

			const articleCover = await getCoverById(Number(providedId));
			if (articleCover?.cover && articleCover.cover !== s3Url) {
				try {
					await deleteFromS3(articleCover.cover);
				} catch (error) {
					console.error("Error while deleting asset from S3:", error);
					log.warn(`Could not delete S3 asset with URI: ${articleCover.cover}`);
				}
			}

			await updateArticleCover(s3Url, Number(providedId));
			const imageUrl = generateSignedImageUrl(s3Url);
			return c.json({ imageUrl, message: "File uploaded successfully" }, 200);
		} catch (error) {
			console.error("Error in media upload handler:", error);
			return c.json({ message: "Error uploading file" }, 500);
		}
	})
	.post("/upload", async (c) => {
		const body = await c.req.parseBody();
		const file = body.image as File;

		try {
			const s3Url = await uploadToS3(file, file.type);
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
