import { Params } from '@remix-run/react'

export type Metadata = {
	skip: number
	take: number
	search: string | undefined
	totals?: number
} & Record<string, any>

const initialMetadata: Metadata = {
	skip: 0,
	take: 10,
	search: undefined,
}

export function getMetadata(request: Request): Metadata {
	const url = new URL(request.url)
	const searchParams = url.searchParams

	const skip = Number(searchParams.get('skip')) || initialMetadata.skip
	const take = Number(searchParams.get('take')) || initialMetadata.take
	const search = searchParams.get('search') || initialMetadata.search
	const others = Object.fromEntries(searchParams.entries())

	return {
		skip,
		take,
		search,
		...others,
	}
}

export function parseSort(sort: any) {
	// validate sort
	if (!sort) return []
	const sortObj = JSON.parse(sort)
	if (!Array.isArray(sortObj)) return []

	// transform sort
	return sortObj.map((sort: any) => {
		if (!sort) return null
		// check type if sort is { id: string, desc: boolean}

		if (typeof sort !== 'object') return null
		if (!sort.id) return null
		if (typeof sort.id !== 'string') return null

		// check if desc is boolean
		if (sort.desc !== undefined && typeof sort.desc !== 'boolean') return null

		// parse sort into prisma sort
		return {
			[sort.id]: sort.desc ? 'desc' : 'asc',
		}
	})
}
