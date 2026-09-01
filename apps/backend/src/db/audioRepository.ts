import { db } from "@/db/connect.ts";

/** Gets the audio filename and its folder for a transcript instance. */
export async function getAudioLocationByInstanceId(instanceId: number) {
	return await db
		.selectFrom("survey_conducted")
		.select(["audio_link", "comment"])
		.where("instance_id", "=", instanceId)
		.executeTakeFirst();
}
