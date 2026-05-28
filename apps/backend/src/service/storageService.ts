import { randomBytes } from "node:crypto";

import {
	DeleteObjectCommand,
	HeadObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";

const ALLOWED_MIME_TYPES = {
	"image/jpeg": ".jpg",
	"image/png": ".png",
	"image/webp": ".webp",
	"image/gif": ".gif",
} as const;

type AllowedMimeType = keyof typeof ALLOWED_MIME_TYPES;

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

export class S3UploadError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "S3UploadError";
	}
}

export const uploadToS3 = async (file: File, mimeType: string): Promise<string> => {
	// Validate the MIME type against our whitelist
	// This prevents malicious users from uploading arbitrary files (e.g., .exe, .html, .sh)
	if (!(mimeType in ALLOWED_MIME_TYPES)) {
		const allowed = Object.keys(ALLOWED_MIME_TYPES).join(", ");
		throw new S3UploadError(`Unsupported file type: ${mimeType}. Allowed types: ${allowed}`);
	}

	const extension = ALLOWED_MIME_TYPES[mimeType as AllowedMimeType];

	const randomImageName = `${randomBytes(16).toString("hex")}${extension}`;
	try {
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		const params = {
			Bucket: bucketName,
			Key: randomImageName,
			Body: buffer,
			ContentType: mimeType,
			// Since our filenames are random hashes, they will never mutate
			// This tells CDNs/Browsers they can cache this safely for a year (even when proxied with imgproxy)
			CacheControl: "public, max-age=31536000, immutable",
		};
		const command = new PutObjectCommand(params);
		await s3Client.send(command);

		return `s3://${bucketName}/${randomImageName}`;
	} catch (error) {
		console.error(`[S3 Upload Error] Failed to upload ${randomImageName}:`, error);
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

export const checkIfExistsInS3 = async (resourceUri: string) => {
	try {
		const params = {
			Bucket: bucketName,
			Key: resourceUri,
		};
		const command = new HeadObjectCommand(params);
		await s3Client.send(command);
	} catch (error: unknown) {
		if (error instanceof Error) {
			if (error.name !== "NotFound") {
				throw new S3UploadError("Failed to upload file to S3. S3 Object failed");
			}
		} else {
			throw new S3UploadError("Failed to upload file to S3. An unexpected error occured");
		}
	}
};
