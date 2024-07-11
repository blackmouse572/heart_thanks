import { type SEOHandle } from '@nasa-gcn/remix-seo'
import {
	json,
	redirect,
	type LoaderFunctionArgs,
	type ActionFunctionArgs,
} from '@remix-run/node'
import { Link, useFetcher, useLoaderData } from '@remix-run/react'
import { Icon } from '#app/components/ui/icon.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { generateTOTP } from '#app/utils/totp.server.ts'
import { twoFAVerificationType } from './profile.two-factor.tsx'
import { twoFAVerifyVerificationType } from './profile.two-factor.verify.tsx'
import Card from '#app/components/ui/card.js'
import { Text } from '#app/components/ui/typography/text.js'
import { Title } from '#app/components/ui/typography/title.js'
import { Caption } from '#app/components/ui/typography/caption.js'

export const handle: SEOHandle = {
	getSitemapEntries: () => null,
}

export async function loader({ request }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)
	const verification = await prisma.verification.findUnique({
		where: { target_type: { type: twoFAVerificationType, target: userId } },
		select: { id: true },
	})
	return json({ is2FAEnabled: Boolean(verification) })
}

export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserId(request)
	const { otp: _otp, ...config } = generateTOTP()
	const verificationData = {
		...config,
		type: twoFAVerifyVerificationType,
		target: userId,
	}
	await prisma.verification.upsert({
		where: {
			target_type: { target: userId, type: twoFAVerifyVerificationType },
		},
		create: verificationData,
		update: verificationData,
	})
	return redirect('/settings/profile/two-factor/verify')
}

export default function TwoFactorRoute() {
	const data = useLoaderData<typeof loader>()
	const enable2FAFetcher = useFetcher<typeof action>()

	return (
		<Card className="flex flex-col gap-4">
			{data.is2FAEnabled ? (
				<>
					<p className="text-lg">
						<Icon name="check" />
						<Text> You have enabled two-factor authentication.</Text>
					</p>
					<Link to="disable">
						<Icon name="lock-open-1" />
						<Text>Disable 2FA</Text>
					</Link>
				</>
			) : (
				<>
					<div className="flex items-center gap-2">
						<Icon name="lock-open-1" size="lg" />
						<Title> You have not enabled two-factor authentication yet.</Title>
					</div>
					<Caption className="text-sm">
						Two factor authentication adds an extra layer of security to your
						account. You will need to enter a code from an authenticator app
						like{' '}
						<a className="underline" href="https://1password.com/">
							1Password
						</a>{' '}
						to log in.
					</Caption>
					<enable2FAFetcher.Form method="POST">
						<StatusButton
							type="submit"
							name="intent"
							value="enable"
							status={enable2FAFetcher.state === 'loading' ? 'pending' : 'idle'}
							className="mx-auto"
						>
							Enable 2FA
						</StatusButton>
					</enable2FAFetcher.Form>
				</>
			)}
		</Card>
	)
}
