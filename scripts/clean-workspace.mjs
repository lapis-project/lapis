import { promises as fs } from "node:fs";
import path from "node:path";

const DRY = process.argv.includes("--dry-run");

const MATCH_DIRS = new Set(["node_modules", ".nuxt", ".output"]);
const MATCH_FILES = new Set([".eslintcache", ".prettiercache", ".stylelintcache"]);

const SKIP_DIRS = new Set([".git", ".hg", ".svn"]);

const removed = [];
const failed = [];

async function removePath(p) {
	try {
		if (!DRY) {
			await fs.rm(p, { recursive: true, force: true, maxRetries: 3 });
		}
		removed.push(p);
	} catch (err) {
		failed.push({ p, err: String(err) });
	}
}

async function walk(dir) {
	let entries;
	try {
		entries = await fs.readdir(dir, { withFileTypes: true });
	} catch {
		return;
	}

	for (const ent of entries) {
		const full = path.join(dir, ent.name);

		let stat;
		try {
			stat = await fs.lstat(full);
		} catch {
			continue;
		}
		if (stat.isSymbolicLink()) continue;

		if (stat.isDirectory()) {
			if (SKIP_DIRS.has(ent.name)) continue;

			if (MATCH_DIRS.has(ent.name)) {
				await removePath(full);
				continue;
			}
			await walk(full);
		} else if (stat.isFile()) {
			if (MATCH_FILES.has(ent.name)) {
				await removePath(full);
			}
		}
	}
}

const root = process.cwd();
console.log(
	`${DRY ? "DRY RUN — would delete" : "Deleting"}: ${[...MATCH_DIRS, ...MATCH_FILES].join(
		", ",
	)}\nFrom: ${root}\n`,
);

const started = Date.now();
await walk(root);

const ms = Date.now() - started;
console.log(`Done in ${ms} ms. ${DRY ? "Would remove" : "Removed"} ${removed.length} item(s).`);
if (failed.length) {
	console.warn(`\nFailed to remove ${failed.length} item(s):`);
	for (const f of failed) console.warn(`- ${f.p}: ${f.err}`);
}
