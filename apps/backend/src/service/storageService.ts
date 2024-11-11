import { randomBytes } from "node:crypto";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { generateImageUrl } from "@imgproxy/imgproxy-node";

const endpoint = process.env.S3_ENDPOINT ?? "";
const accessKeyId = process.env.S3_ACCESS_KEY ?? "";
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY ?? "";
const bucketName = process.env.S3_BUCKET_NAME ?? "";
const key = process.env.IMGPROXY_KEY;
const salt = process.env.IMGPROXY_SALT;

const s3Client = new S3Client({
	credentials: {
		accessKeyId,
		secretAccessKey,
	},
	region: "auto",
	endpoint,
	forcePathStyle: true,
});

class S3UploadError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "S3UploadError";
	}
}

class ImgProxyError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ImgProxyError";
	}
}

export const uploadToS3 = async (file: File, mimeType: string) => {
	// this will be used as the resource key in the image url
	const randomImageName = randomBytes(16).toString("hex");

	try {
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		const params = {
			Bucket: bucketName,
			Key: randomImageName,
			Body: buffer,
			ContentType: mimeType,
		};
		const command = new PutObjectCommand(params);
		await s3Client.send(command);
	} catch (error) {
		console.error("Error uploading to S3:", error);
		throw new S3UploadError("Failed to upload file to S3");
	}
	try {
		const url = generateImageUrl({
			endpoint: "https://imgproxy-test.acdh-ch-dev.oeaw.ac.at",
			url: `s3://${bucketName}/${randomImageName}`,
			options: {
				resizing_type: "fit",
				width: 1280,
				gravity: { type: "no" },
				enlarge: 1,
			},
			salt,
			key,
		});
		return url;
	} catch (error) {
		console.error("Error generating image URL with ImgProxy:", error);
		throw new ImgProxyError("Failed to generate image URL");
	}
};

// const presignedUrl = await generatePresignedUrl(debugKey);
// const generatePresignedUrl = async (imageName: string) => {
// 	const command = new GetObjectCommand({
// 		Bucket: bucketName,
// 		Key: imageName,
// 	});

// 	try {
// 		const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // URL valid for 1 hour
// 		return url; // Return the pre-signed URL to the frontend
// 	} catch (error) {
// 		console.error("Error generating pre-signed URL:", error);
// 		throw new Error("Could not generate pre-signed URL");
// 	}
// };
