import { createCookie } from '@remix-run/node'
import * as cookie from 'cookie'
import { z } from 'zod'

const cookieName = 'en_preferences'
const preferencesCookieKey = 'en_preferences'
export { cookieName, preferencesCookieKey }
export const preferencesSchema = z.object({
	history: z.object({
		showNeedReviewBanner: z.boolean(),
	}),
})
export type Preferences = z.infer<typeof preferencesSchema>

export const defaultPreferences: Preferences = {
	history: {
		showNeedReviewBanner: true,
	},
}
