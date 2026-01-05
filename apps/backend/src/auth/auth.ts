import crypto from "node:crypto";

import type { Context } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";

import { pool } from "@/db/connect.ts";

const SESSION_COOKIE_NAME = "auth_session";
const SESSION_EXPIRATION_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const SESSION_REFRESH_INTERVAL_MS = 1000 * 60 * 60 * 24 * 15; // 15 days

export interface Session {
	id: string;
	userId: number;
	expiresAt: Date;
	fresh: boolean;
}

export interface User {
	id: number;
	username: string | null;
}

export async function createSession(userId: number): Promise<Session> {
	const sessionId = crypto.randomBytes(20).toString("hex");
	const now = new Date();
	const expiresAt = new Date(now.getTime() + SESSION_EXPIRATION_MS);

	await pool.query(
		"INSERT INTO user_session (id, user_id, expires_at, created_at) VALUES ($1, $2, $3, $4)",
		[sessionId, userId, expiresAt, now],
	);

	return {
		id: sessionId,
		userId,
		expiresAt,
		fresh: true,
	};
}

/**
 * Validates a session ID and returns the session and user data
 * Handles session extension (sliding window) automatically
 */
export async function validateSession(
	sessionId: string,
): Promise<{ session: Session | null; user: User | null }> {
	const result = await pool.query(
		`SELECT s.id, s.user_id, s.expires_at, u.username
     FROM user_session s
     INNER JOIN user_account u ON s.user_id = u.id
     WHERE s.id = $1`,
		[sessionId],
	);

	if (result.rowCount === 0) {
		return { session: null, user: null };
	}

	const row = result.rows[0];
	const session: Session = {
		id: row.id,
		userId: row.user_id,
		// ensure expiresAt is a Date object (pg driver usually returns Date for timestamptz)
		expiresAt: row.expires_at instanceof Date ? row.expires_at : new Date(row.expires_at),
		fresh: false,
	};

	// check if session is expired
	if (Date.now() >= session.expiresAt.getTime()) {
		await pool.query("DELETE FROM user_session WHERE id = $1", [session.id]);
		return { session: null, user: null };
	}

	// extend session if we are past the refresh interval (sliding expiration)
	if (Date.now() >= session.expiresAt.getTime() - SESSION_REFRESH_INTERVAL_MS) {
		session.fresh = true;
		session.expiresAt = new Date(Date.now() + SESSION_EXPIRATION_MS);
		await pool.query("UPDATE user_session SET expires_at = $1 WHERE id = $2", [
			session.expiresAt,
			session.id,
		]);
	}

	const user: User = {
		id: row.user_id,
		username: row.username,
	};

	return { session, user };
}

export async function invalidateSession(sessionId: string): Promise<void> {
	await pool.query("DELETE FROM user_session WHERE id = $1", [sessionId]);
}

export function setSessionTokenCookie(c: Context, token: string, expiresAt: Date) {
	setCookie(c, SESSION_COOKIE_NAME, token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "Lax",
		path: "/",
		expires: expiresAt,
	});
}

export function deleteSessionTokenCookie(c: Context) {
	deleteCookie(c, SESSION_COOKIE_NAME, {
		path: "/",
		secure: process.env.NODE_ENV === "production",
	});
}

export function verifyRequestOrigin(origin: string, allowedOrigins: Array<string>): boolean {
	if (!origin || allowedOrigins.length === 0) {
		return false;
	}
	return allowedOrigins.includes(origin);
}
