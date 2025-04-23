import { generateImageUrl } from "@imgproxy/imgproxy-node";

const key = process.env.IMGPROXY_KEY;
const salt = process.env.IMGPROXY_SALT;

class ImgProxyError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ImgProxyError";
	}
}

export const generateSignedImageUrl = (url: string) => {
	try {
		const imageUrl = generateImageUrl({
			endpoint: "https://imgproxy.acdh.oeaw.ac.at",
			url,
			options: {
				resizing_type: "fit",
				width: 1280,
				gravity: { type: "no" },
				enlarge: 1,
			},
			salt,
			key,
		});
		return imageUrl;
	} catch (error) {
		console.error("Error generating image URL with ImgProxy:", error);
		throw new ImgProxyError("Failed to generate image URL");
	}
};
