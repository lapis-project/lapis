import { log } from "@acdh-oeaw/lib";
import { Hono } from "hono";

import { getCoverById, updateArticleCover } from "@/db/cmsRepository.ts";
import { getImpulsImageForPhen, updatePhenWithNewImage } from "@/db/questionRepository.ts";
import { checkIfPrivilegedForAdminOrHigher, restrictedRoute } from "@/lib/authHelper.ts";
import { generateSignedImageUrl } from "@/service/imageService.ts";

import { deleteFromS3, uploadToS3 } from "../service/storageService.ts";

const media = new Hono()
	.use("*", restrictedRoute)
	.use("/phen/*", checkIfPrivilegedForAdminOrHigher)
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
	})
	/**
	 * Uploads and assigns a new stimulus image for a specific phenomenon.
	 * If an image already exists for this phenomenon, it is deleted from S3 first to prevent orphaned files.
	 * * @returns JSON object containing the newly generated signed `imageUrl` and a success `message`.
	 * @status 200 - File uploaded to S3 and database updated successfully.
	 * @status 400 - Provided ID is missing or invalid.
	 * @status 500 - Internal server error during S3 upload or database update.
	 */
	.post("/phen/:id", async (c) => {
		const body = await c.req.parseBody();
		const file = body.image as File;
		const phenomenonId = Number(c.req.param("id"));

		if (!phenomenonId) {
			return c.json("No id provided", 400);
		}

		if (Number.isNaN(phenomenonId)) {
			return c.json("Provided id is not a number", 400);
		}

		try {
			// delete old image from s3 first
			const phenomenon = await getImpulsImageForPhen(phenomenonId);
			const oldS3Url = phenomenon?.stimulus_media;
			if (oldS3Url) {
				await deleteFromS3(oldS3Url);
			}

			const s3Url = await uploadToS3(file, file.type);
			await updatePhenWithNewImage(phenomenonId, s3Url);
			const imageUrl = generateSignedImageUrl(s3Url);
			return c.json({ imageUrl, message: "File uploaded successfully" }, 200);
		} catch (error) {
			console.error("Error in media upload handler:", error);
			return c.json({ message: "Error uploading file" }, 500);
		}
	})
	/**
	 * Deletes the stimulus image associated with a specific phenomenon.
	 * Removes the file from S3 and sets the stimulus_media field to null in the database.
	 * * @returns JSON object containing a success or error `message`.
	 * @status 200 - Image deleted from S3 and database updated successfully.
	 * @status 400 - Provided ID is missing or invalid.
	 * @status 404 - No existing image was found for the given phenomenon ID.
	 * @status 500 - Internal server error during S3 deletion or database update.
	 */
	.delete("/phen/:id", async (c) => {
		const phenomenonId = Number(c.req.param("id"));

		if (!phenomenonId) {
			return c.json("No id provided", 400);
		}

		if (Number.isNaN(phenomenonId)) {
			return c.json("Provided id is not a number", 400);
		}

		try {
			const phenomenon = await getImpulsImageForPhen(phenomenonId);
			const s3Url = phenomenon?.stimulus_media;
			if (!s3Url) {
				return c.json({ message: "No image found" }, 404);
			}

			await deleteFromS3(s3Url);
			await updatePhenWithNewImage(phenomenonId, null);
			return c.json({ message: "Image deleted successfully" }, 200);
		} catch (error) {
			console.error("Error in media upload handler:", error);
			return c.json({ message: "Error uploading file" }, 500);
		}
	});

export default media;
export type MediaUploadType = typeof media;
