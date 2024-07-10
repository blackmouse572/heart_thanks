import { Metadata } from './request.server'

export function getCurrentPage({ skip, take }: Metadata) {
	return Math.max(Math.floor(skip / take) + 1, 1)
}

export function getTotalPages({ totals = 0, take }: Metadata) {
	return Math.ceil(totals / take)
}
