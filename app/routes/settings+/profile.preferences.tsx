import { requireUserId } from '#app/utils/auth.server.js'

import * as cookie from 'cookie'
import { parseWithZod } from '@conform-to/zod'
import { type ActionFunctionArgs, json, redirect } from '@remix-run/node'
import Cookies from 'universal-cookie'
import {
	defaultPreferences,
	preferencesSchema,
	preferencesCookieKey,
} from '#app/utils/settings.server.js'

export async function action({ request }: ActionFunctionArgs) {
	await requireUserId(request)
	const preferencesCookie =
		new Cookies(request.headers.get('cookie')) || defaultPreferences

	const formData = await request.formData()

	const submission = await parseWithZod(formData, {
		schema: (intent) =>
			preferencesSchema.transform(async (data, ctx) => {
				if (intent !== null)
					return {
						history: {
							showNeedReviewBanner: true,
						},
					}

				return data
			}),
		async: true,
	})
	if (submission.status !== 'success' || !submission.value) {
		console.error(submission)
		return json(
			{ result: submission.reply() },
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}

	// since form cannot be inverted, we need to invert the value
	// if the user intent to close the banner
	preferencesCookie.set(preferencesCookieKey, {
		history: {
			showNeedReviewBanner: !submission.value.history.showNeedReviewBanner,
		},
	})

	// save the preferences
	return json('/settings/profile/preferences', {
		headers: {
			'Set-Cookie': cookie.serialize(
				preferencesCookieKey,
				JSON.stringify(preferencesCookie.get(preferencesCookieKey)),
				{ path: '/', sameSite: true },
			),
		},
	})
}
