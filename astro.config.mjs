import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import { d1, r2 } from "@emdash-cms/cloudflare";
import icon from "astro-iconset";
import { google } from "emdash/auth/providers/google";
import { defineConfig, fontProviders } from "astro/config";
import emdash from "emdash/astro";

export default defineConfig({
	output: "server",
	adapter: cloudflare(),
	image: {
		layout: "constrained",
		responsiveStyles: true,
	},
	vite: {
		build: {
			// Keep light-dark() native in the CSS output. Vite 8's Lightning CSS
			// defaults target browsers without it and compile it to a polyfill
			// that only follows the OS preference, which breaks the footer
			// theme toggle (it flips color-scheme via a class). Browsers older
			// than these get the light-only fallback in tokens.css.
			cssTarget: ["chrome123", "firefox120", "safari17.5"],
		},
		ssr: {
			optimizeDeps: {
				// Pre-bundle so it isn't discovered mid-render, which would trigger
				// a Vite dep re-optimization and break in-flight worker imports
				// under the Cloudflare dev runner (workerd).
				include: ["astro-iconset/components"],
			},
		},
	},
	integrations: [
		react(),
		icon({
			// Only ship the Phosphor icons actually referenced in templates,
			// not the full @iconify-json/ph set (which adds megabytes to the
			// deployed worker bundle).
			include: {
				ph: [
					"chart-bar",
					"check-circle",
					"clock",
					"cloud",
					"code",
					"currency-dollar",
					"desktop",
					"envelope",
					"globe",
					"heart",
					"lifebuoy",
					"lightning",
					"lock",
					"moon",
					"shield-check",
					"sparkle",
					"star",
					"sun",
					"users-three",
				],
			},
		}),
		emdash({
			database: d1({ binding: "DB", session: "auto" }),
			storage: r2({ binding: "MEDIA" }),
			// No floating "EmDash | Edit" pill on public pages for logged-in
			// editors. Editing still works normally through /_emdash/admin.
			toolbar: false,
			// "Sign in with Google" on the admin login page. Reads
			// EMDASH_OAUTH_GOOGLE_CLIENT_ID / EMDASH_OAUTH_GOOGLE_CLIENT_SECRET
			// (worker secrets in production, .env locally).
			authProviders: [google()],
			plugins: [
				{
					id: "marketing-blocks",
					version: "0.1.0",
					// Absolute file:// URL so the virtual emdash/plugins module
					// can resolve this at build time (relative paths fail because
					// the virtual module has no on-disk location to anchor them).
					entrypoint: new URL("./src/plugins/marketing-blocks/index.ts", import.meta.url).href,
				},
			],
		}),
	],
	fonts: [
		{
			// The display serif of the Story & Measure type system: title,
			// heading, subtitle and quote styles. Only the four weights the
			// system actually uses are loaded -- Regular, Medium, SemiBold,
			// and Medium Italic (italics come from the styles list).
			provider: fontProviders.google(),
			name: "Cormorant Garamond",
			cssVariable: "--font-display",
			weights: [400, 500, 600],
			styles: ["normal", "italic"],
			fallbacks: ["Georgia", "Times New Roman", "serif"],
		},
	],
	// Helvetica is the system half of the type system (subheading, section
	// header, body, caption, eyebrow). It is not fetched as a webfont -- see
	// the --font-body stack in src/styles/theme.css.
	devToolbar: { enabled: false },
});
