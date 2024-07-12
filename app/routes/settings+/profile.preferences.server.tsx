import {
	defaultPreferences,
	Preferences,
	preferencesSchema,
} from '#app/utils/settings.server.js'
import Cookies from 'universal-cookie'
export function getPreferences(request: Request): Preferences {
	const cookie = new Cookies(request.headers.get('cookie'))

	const cookiePreferences = cookie.get('en_preferences')

	const parsed = preferencesSchema.safeParse(cookiePreferences)
	const isValid = parsed.success
	return isValid ? parsed.data : defaultPreferences
}
