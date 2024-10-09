import { type Expression, type RawBuilder, type Simplify, sql } from "kysely";

// Workaround to use jsonb_build_object in kysely with distinct
// See issue https://github.com/kysely-org/kysely/issues/395 for more details
export function jsonbBuildObject<O extends Record<string, Expression<unknown>>>(
	obj: O,
): RawBuilder<
	Simplify<{
		[K in keyof O]: O[K] extends Expression<infer V> ? V : never;
	}>
> {
	return sql`distinct jsonb_build_object(${sql.join(
		Object.keys(obj).flatMap((k) => [sql.lit(k), obj[k]]),
	)})`;
}
