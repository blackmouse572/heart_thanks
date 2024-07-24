import morgan from 'morgan'
import chalk from 'chalk'
const printResponseTime = (time?: number) => {
	if (!time) return ''
	if (time < 100) {
		return chalk.green.bold(time + 'ms')
	}
	if (time < 200) {
		return chalk.yellow.bold(time + 'ms')
	}
	if (time < 300) {
		return chalk.red.bold(time + 'ms')
	}

	return chalk.red.bold(time + 'ms')
}

const printStatusCode = (status?: number) => {
	if (!status) return ''
	if (status < 300) {
		return chalk.green.bold(status)
	}

	if (status < 400) {
		return chalk.yellow.bold(status)
	}

	if (status < 500) {
		return chalk.red.bold(status)
	}
}
const morganMiddleware = morgan(
	function (tokens, req, res) {
		return [
			chalk.bgGreen(chalk.white.bold('[' + tokens.method?.(req, res) + ']')),
			chalk.visible(
				printStatusCode(tokens.status?.(req, res) as unknown as number),
			),
			chalk.whiteBright.visible(tokens.url?.(req, res)),
			chalk.bold(
				printResponseTime(
					tokens['response-time']?.(req, res) as unknown as number,
				),
			),
			chalk.dim.hex('#f78fb3').bold('@ ' + tokens.date?.(req, res)),
			chalk.dim.yellow(tokens['remote-addr']?.(req, res)),
			chalk.dim.hex('#fffa65').bold('from ' + tokens.referrer?.(req, res)),
		].join(' ')
	},
	{
		skip: (req, res) =>
			(res.statusCode === 200 &&
				(req.url?.startsWith('/resources/note-images') ||
					req.url?.startsWith('/resources/user-images') ||
					req.url?.startsWith('/resources/healthcheck'))) ||
			false,
	},
)
export default morganMiddleware
