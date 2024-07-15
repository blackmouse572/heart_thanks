import { prisma } from '#app/utils/db.server.ts'
import { MOCK_CODE_GITHUB } from '#app/utils/providers/constants'
import {
	cleanupDb,
	createPassword,
	createUser,
	getNoteImages,
	getRamdomReceiver,
	getRandomReviewer,
	getUserImages,
	img,
} from '#tests/db-utils.ts'
import { insertGitHubUser } from '#tests/mocks/github.ts'
import { User } from '@prisma/client'
import seedUsers from '#tests/fixtures/users.json'
import { promiseHash } from 'remix-utils/promise'
import { faker } from '@faker-js/faker'

async function seed() {
	console.log('🌱 Seeding...')
	console.time(`🌱 Database has been seeded`)

	console.time('🧹 Cleaned up the database...')
	await cleanupDb(prisma)
	console.timeEnd('🧹 Cleaned up the database...')

	console.time('🔑 Created permissions...')
	const entities = ['user', 'transaction', 'setting', 'permission', 'role']
	const actions = ['create', 'read', 'update', 'delete']
	const accesses = ['own', 'any'] as const

	let permissionsToCreate = []
	for (const entity of entities) {
		for (const action of actions) {
			for (const access of accesses) {
				permissionsToCreate.push({ entity, action, access })
			}
		}
	}
	await prisma.permission.createMany({ data: permissionsToCreate })
	console.timeEnd('🔑 Created permissions...')

	console.time('👑 Created roles...')
	await prisma.role.create({
		data: {
			name: 'admin',
			permissions: {
				connect: await prisma.permission.findMany({
					select: { id: true },
					where: { access: 'any' },
				}),
			},
		},
	})
	await prisma.role.create({
		data: {
			name: 'user',
			permissions: {
				connect: await prisma.permission.findMany({
					select: { id: true },
					where: { access: 'own' },
				}),
			},
		},
	})
	console.timeEnd('👑 Created roles...')

	const totalUsers = seedUsers.length
	console.time(`👤 Created ${totalUsers} users...`)
	const users: { id: string }[] = []
	for (let index = 0; index < totalUsers; index++) {
		const userData = seedUsers[index] as {
			email: string
			username: string
			name: string
		}
		const userImage = await getUserImages(userData.username)
		const createdUser = await prisma.user
			.create({
				select: { id: true },
				data: {
					...userData,
					password: { create: createPassword(userData.username) },
					image: { create: userImage },
					roles: { connect: { name: 'user' } },
					balance: faker.number.int({ min: 10, max: 30 }),
					vault: faker.number.int({ min: 10, max: 30 }),
				},
			})
			.catch((e) => {
				console.error('Error creating a user:', e)
				return null
			})

		if (createdUser) {
			users.push(createdUser)
		}
	}
	console.timeEnd(`👤 Created ${totalUsers} users...`)

	console.time(`🐨 Created admin user "jaden.nguyen"`)

	const kodyImages = await promiseHash({
		kodyUser: img({
			filepath: './tests/fixtures/images/user/jaden-nguyen.png',
		}),
		cuteKoala: img({
			altText: 'an adorable koala cartoon illustration',
			filepath: './tests/fixtures/images/kody-notes/cute-koala.png',
		}),
		koalaEating: img({
			altText: 'a cartoon illustration of a koala in a tree eating',
			filepath: './tests/fixtures/images/kody-notes/koala-eating.png',
		}),
		koalaCuddle: img({
			altText: 'a cartoon illustration of koalas cuddling',
			filepath: './tests/fixtures/images/kody-notes/koala-cuddle.png',
		}),
		mountain: img({
			altText: 'a beautiful mountain covered in snow',
			filepath: './tests/fixtures/images/kody-notes/mountain.png',
		}),
		koalaCoder: img({
			altText: 'a koala coding at the computer',
			filepath: './tests/fixtures/images/kody-notes/koala-coder.png',
		}),
		koalaMentor: img({
			altText:
				'a koala in a friendly and helpful posture. The Koala is standing next to and teaching a woman who is coding on a computer and shows positive signs of learning and understanding what is being explained.',
			filepath: './tests/fixtures/images/kody-notes/koala-mentor.png',
		}),
		koalaSoccer: img({
			altText: 'a cute cartoon koala kicking a soccer ball on a soccer field ',
			filepath: './tests/fixtures/images/kody-notes/koala-soccer.png',
		}),
	})

	const githubUser = await insertGitHubUser(MOCK_CODE_GITHUB)

	await prisma.user.create({
		select: { id: true },
		data: {
			email: 'jadenNguyen@avepoint.com',
			username: 'jaden.nguyen',
			name: 'Jaden Nguyen',
			image: { create: kodyImages.kodyUser },
			password: { create: createPassword('jadenSuper@123') },
			connections: {
				create: { providerName: 'github', providerId: githubUser.profile.id },
			},
			roles: { connect: [{ name: 'admin' }, { name: 'user' }] },
		},
	})
	console.timeEnd(`🐨 Created admin user "jaden.nguyen"`)

	console.time(`📝 Created transactions...`)
	const totalTransactionsPerUser = 5
	users.forEach(async (user) => {
		for (let index = 0; index < totalTransactionsPerUser; index++) {
			const randomReceiver = await getRamdomReceiver(users, user)
			const randomReviewed = Math.random() >= 0.5
			const randomReviewedAt = randomReviewed ? new Date() : null
			const randomReviewer = await getRandomReviewer(users, user)
			await prisma.transactions.create({
				data: {
					amount: 10,
					content: 'Seeded transaction content',
					title: 'Seeded transaction title',
					createdAt: new Date(),
					updatedAt: new Date(),
					owner: { connect: { id: user.id } },
					receiver: { connect: { id: randomReceiver.id } },
					reviewedAt: randomReviewedAt,
					reviewBy: randomReviewer
						? { connect: { id: randomReviewer.id } }
						: undefined,
					reviewed: randomReviewed,
				},
			})
		}
	})
	console.timeEnd(`📝 Created transactions...`)

	console.time(`⚙️ Created settings...`)
	const totalSettings = 5
	for (let index = 0; index < totalSettings; index++) {
		await prisma.applicationSetting.create({
			data: {
				title: `Setting ${index + 1}`,
				description: `Description for setting ${index + 1}`,
				allowTransfer: true,
				averagePoints: 30,
				isUsed: false,
				minTransfer: 1,
				maxTransfer: 30,
			},
		})
	}
	console.timeEnd(`⚙️ Created settings...`)

	console.time(`⚙️ Created current setting...`)
	await prisma.applicationSetting.create({
		data: {
			title: `Default setting`,
			description: `This setting is a template, you should stick with it if you don't know what to do.`,
			allowTransfer: true,
			averagePoints: 30,
			isUsed: true,
			minTransfer: 1,
			maxTransfer: 30,
		},
	})
	console.timeEnd(`⚙️ Created current setting...`)

	console.timeEnd(`🌱 Database has been seeded`)
}

seed()
	.catch((e) => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})

// we're ok to import from the test directory in this file
/*
eslint
	no-restricted-imports: "off",
*/
