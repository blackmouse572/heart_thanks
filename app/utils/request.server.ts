import { Params } from '@remix-run/react'

type Metadata = {
	skip: number
	take: number
	search: string | undefined
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

	return {
		skip,
		take,
		search,
	}
}
