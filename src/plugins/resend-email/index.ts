/**
 * Resend email provider plugin (inline, site-local).
 *
 * Delivers EmDash system emails (magic-link login, invites, comment
 * notifications) through the Resend API. Registers the exclusive
 * `email:deliver` hook — activate it as the provider under admin
 * Settings → Email.
 *
 * Setup:
 * 1. Verify storyandmeasure.com as a sending domain at resend.com
 *    (Resend shows the DKIM/SPF records; add them in Cloudflare DNS).
 * 2. Create an API key and set it as a Worker secret:
 *      npx wrangler secret put RESEND_API_KEY
 *    For local dev, add RESEND_API_KEY to .env.
 * 3. In the admin, Settings → Email → select this provider.
 *
 * Runs trusted (in-process), so it reads the key from the Worker env /
 * process env directly and uses global fetch.
 */

import { definePlugin } from "emdash";
import type { PluginContext } from "emdash";

const FROM = { email: "cms@storyandmeasure.com", name: "Story & Measure" };
const REPLY_TO = "hello@storyandmeasure.com";

interface DeliverEvent {
	message: {
		to: string;
		subject: string;
		text: string;
		html?: string;
	};
	source: string;
}

/**
 * Resolve the API key at delivery time. Hooks run without request
 * context, so the Worker env comes from the `cloudflare:workers` module
 * (available deployed and under `astro dev` with the Cloudflare
 * adapter); process.env covers plain-Node contexts.
 */
async function getApiKey(): Promise<string | undefined> {
	try {
		const { env } = await import("cloudflare:workers");
		const key = (env as Record<string, unknown>).RESEND_API_KEY;
		if (typeof key === "string" && key.length > 0) return key;
	} catch {
		// Not on the Workers runtime — fall through to process.env.
	}
	if (typeof process !== "undefined" && process.env?.RESEND_API_KEY) {
		return process.env.RESEND_API_KEY;
	}
	return undefined;
}

const definition = {
	id: "resend-email",
	version: "0.1.0",
	capabilities: ["hooks.email-transport:register"],
	hooks: {
		"email:deliver": {
			exclusive: true,
			handler: async (event: DeliverEvent, ctx: PluginContext) => {
				const apiKey = await getApiKey();
				if (!apiKey) {
					throw new Error(
						"[resend-email] RESEND_API_KEY is not set. Run `npx wrangler secret put RESEND_API_KEY` (or add it to .env for local dev).",
					);
				}

				const { message } = event;
				const res = await fetch("https://api.resend.com/emails", {
					method: "POST",
					headers: {
						Authorization: `Bearer ${apiKey}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						from: `${FROM.name} <${FROM.email}>`,
						to: [message.to],
						subject: message.subject,
						text: message.text,
						...(message.html ? { html: message.html } : {}),
						reply_to: REPLY_TO,
					}),
				});

				if (!res.ok) {
					const detail = await res.text().catch(() => "");
					throw new Error(`[resend-email] Resend API error ${res.status}: ${detail}`);
				}

				ctx.log.info(`[resend-email] delivered "${message.subject}" (source: ${event.source})`);
			},
		},
	},
};

export function createPlugin() {
	return definePlugin(definition);
}

export default createPlugin;
