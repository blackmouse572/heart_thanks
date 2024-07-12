import { prisma } from '#app/utils/db.server.js'
import { requireUserWithPermission } from '#app/utils/permissions.server.js'
import { type LoaderFunctionArgs, json } from '@remix-run/node'

export async function loader({ request }: LoaderFunctionArgs) {
	await requireUserWithPermission(request, 'read:role:any,own')

	const roles = await prisma.role.findMany()
	return json({
		roles,
	})
}
