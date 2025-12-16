import { log } from "@acdh-oeaw/lib";
import { serve } from "@hono/node-server";

import { app } from "@/app.ts";

// Starting the server
const port = Number(process.env.BACKEND_PORT) || 3000;
log.success(`Server is running on port: ${String(port)}`);

serve({
	fetch: app.fetch,
	port,
});
