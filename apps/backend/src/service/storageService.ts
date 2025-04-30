import { randomBytes } from "node:crypto";

import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const endpoint = process.env.S3_ENDPOINT ?? "";
const accessKeyId = process.env.S3_ACCESS_KEY ?? "";
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY ?? "";
const bucketName = process.env.S3_BUCKET_NAME ?? "";

const s3Client = new S3Client({
	credentials: {
		accessKeyId,
		secretAccessKey,
	},
	region: "auto",
	endpoint,
	forcePathStyle: true,
});

function parseS3Uri(uri: string): { bucket: string; key: string } {
	const match = /^s3:\/\/([^/]+)\/(.+)$/.exec(uri);
	if (!match) {
		throw new Error(`Invalid S3 URI: ${uri}`);
	}
	return {
		bucket: match[1]!,
		key: match[2]!,
	};
}

export class S3DeleteError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "S3DeleteError";
	}
}

class S3UploadError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "S3UploadError";
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

		return `s3://${bucketName}/${randomImageName}`;
	} catch (error) {
		console.error("Error uploading to S3:", error);
		throw new S3UploadError("Failed to upload file to S3");
	}
};

export const deleteFromS3 = async (resourceUri: string) => {
	// only allow valid S3 URIs
	if (!resourceUri.startsWith("s3://")) {
		throw new Error(`Invalid S3 URI (must start with "s3://"): ${resourceUri}`);
	}

	// parse out bucket & key; parseS3Uri will itself throw if malformed
	const { bucket, key } = parseS3Uri(resourceUri);

	try {
		const params = {
			Bucket: bucket,
			Key: key,
		};
		const command = new DeleteObjectCommand(params);
		await s3Client.send(command);
	} catch (error) {
		console.error("Error deleting object from S3:", error);
		throw new S3DeleteError("Failed to delete file from S3");
	}
};
