/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import * as THREE from "three";

import type { WebGLContext } from "@/components/geo-map.client.vue";

export const generatePieChartWebGL = (
	data: Array<number>,
	colors: Array<string>,
	size: number,
	context: WebGLContext,
) => {
	const total = data.reduce((sum, value) => sum + value, 0);
	let startAngle = 0;

	const pieSlices = data.map(
		(value, index): THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial> => {
			const sliceAngle = (value / total) * 2 * Math.PI;
			// console.log("sliceAngle", sliceAngle, value, index, colors);
			const geometry = new THREE.CircleGeometry(size / 2, 32, startAngle, sliceAngle);
			const material = new THREE.MeshBasicMaterial({ color: colors[index] });
			const slice = new THREE.Mesh(geometry, material);
			startAngle += sliceAngle;
			return slice;
		},
	);

	pieSlices.forEach((slice) => context.scene.add(slice));
	context.renderer.render(context.scene, context.camera);

	const gl = context.renderer.getContext();
	const pixels = new Uint8Array(size * size * 4);
	gl.readPixels(0, 0, size, size, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

	pieSlices.forEach((slice) => context.scene.remove(slice)); // Clean up

	return pixels;
};

// export const generatePieChartWebGL = (data, colors, size, context) => {
// 	const total = data.reduce((sum, value) => sum + value, 0);
// 	let startAngle = 0;

// 	// Create the border circle
// 	const borderThickness = 2; // Adjust as needed
// 	const borderRadius = 80 / 2 + borderThickness;
// 	const borderGeometry = new THREE.RingGeometry(64 / 2, borderRadius, 64);
// 	const borderMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 }); // Border color
// 	const borderCircle = new THREE.Mesh(borderGeometry, borderMaterial);
// 	context.scene.add(borderCircle);

// 	const pieSlices = data.map((value, index) => {
// 		const sliceAngle = (value / total) * 2 * Math.PI;

// 		const geometry = new THREE.CircleGeometry(64 / 2, 32, startAngle, sliceAngle);
// 		const material = new THREE.MeshBasicMaterial({ color: colors[index] });
// 		const slice = new THREE.Mesh(geometry, material);
// 		startAngle += sliceAngle;
// 		context.scene.add(slice);
// 		return slice;
// 	});

// 	// Adjust canvas and renderer size
// 	const canvasSize = 80 + 2 * borderThickness;
// 	context.renderer.setSize(canvasSize, canvasSize);
// 	context.renderer.setViewport(0, 0, canvasSize, canvasSize);
// 	context.renderer.render(context.scene, context.camera);

// 	const gl = context.renderer.getContext();
// 	const pixels = new Uint8Array(canvasSize * canvasSize * 4);
// 	gl.readPixels(0, 0, canvasSize, canvasSize, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

// 	// Clean up: Remove slices and border from the scene
// 	pieSlices.forEach((slice) => context.scene.remove(slice));
// 	context.scene.remove(borderCircle);

// 	return pixels;
// };

export const parseString = (input: string): { ids: Array<number>; hexcodes: Array<string> } => {
	// Remove "-id" from the start of the string
	const cleanedInput = input.replace(/^id-/, "");

	// Split the string at the first occurrence of '#'
	const firstHashIndex = cleanedInput.indexOf("#");
	const idPart = cleanedInput.slice(0, firstHashIndex);
	const hexPart = cleanedInput.slice(firstHashIndex);
	// console.log("hexPart", hexPart);

	// Split the idPart by '-'
	const idStrings = idPart.split("-");

	// Convert the ids from strings to numbers
	const ids = idStrings.map(Number);

	// Extract the hexcodes
	const hexcodes = hexPart.split("-").map((code) => code);

	return {
		ids,
		hexcodes,
	};
};
