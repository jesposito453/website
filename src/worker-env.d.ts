/**
 * Secrets are set with `wrangler secret put` rather than declared in
 * wrangler.jsonc, so `wrangler types` cannot see them. Declare them here so
 * `env` from "cloudflare:workers" is typed. This merges with the generated
 * Cloudflare.Env in worker-configuration.d.ts and survives regeneration.
 */
declare namespace Cloudflare {
	interface Env {
		/**
		 * Google Workspace app password for hello@storyandmeasure.com, used by
		 * the contact form to submit over Gmail SMTP. Optional so local dev
		 * can fall back to logging the submission.
		 */
		GMAIL_APP_PASSWORD?: string;
	}
}
