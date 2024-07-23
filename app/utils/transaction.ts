export const ENUM_TRANSACTION_STATUS = {
	PENDING: 'PENDING',
	SUCCESS: 'SUCCESS',
	FAILED: 'FAILED',
}

export function transactionStatusToIntent(
	status: keyof typeof ENUM_TRANSACTION_STATUS,
) {
	switch (status) {
		case ENUM_TRANSACTION_STATUS.PENDING:
			return 'warning'
		case ENUM_TRANSACTION_STATUS.SUCCESS:
			return 'success'
		case ENUM_TRANSACTION_STATUS.FAILED:
			return 'danger'
		default:
			return 'primary'
	}
}
