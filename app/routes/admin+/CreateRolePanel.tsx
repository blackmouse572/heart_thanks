import { z } from 'zod'
import SlidePanel from '#app/components/drawer.js'
import { Form, useActionData, useLocation } from '@remix-run/react'
import {
	FieldMetadata,
	getFieldsetProps,
	getFormProps,
	getInputProps,
	useForm,
	useInputControl,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { HoneypotInputs } from 'remix-utils/honeypot/react'
import { CheckboxField, Field, TextareaField } from '#app/components/forms.js'
import Button from '#app/components/ui/button.js'
import { Icon } from '#app/components/ui/icon.js'
import { ACTIONS, ENTITIES } from '#app/utils/user.js'
import Label from '#app/components/ui/typography/label.js'
import { uppercaseFirstLetter } from '#app/utils/ui.js'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '#app/components/ui/table/index.js'
import Toggle from '#app/components/ui/toggle.js'
import { useState } from 'react'
import { useIsPending } from '#app/utils/misc.js'
import { action } from './roles'

export const CreateNewRoleSchema = z.object({
	id: z.string().optional(),
	name: z.string(),
	description: z.string().optional(),
	permissions: z.array(
		z.object({
			enabled: z.string().optional(),
			entity: z.string().optional(),
			action: z.string().optional(),
			access: z.string().optional(),
			id: z.string().optional(),
		}),
	),
})
type CreateNewRoleSchema = z.infer<typeof CreateNewRoleSchema>

type CreatePanelProps = {
	defaultValue?: CreateNewRoleSchema
	open?: boolean
	setOpen?: (open: boolean) => void
	type?: 'create' | 'update'
}
export function CreateRolePanel(props: CreatePanelProps) {
	const { open, setOpen, type = 'create' } = props
	const actionData = useActionData<typeof action>()
	const [form, fields] = useForm({
		id:
			type === 'update'
				? `update-role-${props.defaultValue?.id}`
				: 'create-role',
		constraint: getZodConstraint(CreateNewRoleSchema),
		onValidate: ({ formData: values }) => {
			return parseWithZod(values, {
				schema: CreateNewRoleSchema,
			})
		},
		lastResult: actionData?.result as any,
		defaultValue: props.defaultValue
			? {
					...props.defaultValue,
					permissions: ENTITIES.flatMap((entity) =>
						ACTIONS.map((action) => {
							const entityAction = props.defaultValue?.permissions.find(
								(p) => p.entity === entity && p.action === action,
							)
							return {
								entity,
								action,
								enabled: entityAction ? 'on' : undefined,
								access: entityAction?.access ?? 'own',
							}
						}),
					),
				}
			: {
					permissions:
						props.defaultValue ??
						ENTITIES.flatMap((entity) =>
							ACTIONS.map((action) => ({
								entity,
								action,
								access: 'own',
							})),
						),
				},
		shouldValidate: 'onBlur',
	})

	const location = useLocation()
	const permissionsFieldList = fields.permissions.getFieldList()
	const isPending = useIsPending({
		formAction: `/admin/roles${location.search}`,
		formMethod: 'POST',
	})
	const isUpdateDisabled =
		props.defaultValue?.name === 'admin' || props.defaultValue?.name === 'user'

	return (
		<SlidePanel
			title={type === 'create' ? `Create new role` : `Update role`}
			open={open}
			setOpen={setOpen}
			trigger={
				type === 'create' ? (
					<Button.Root>
						<Button.Icon type="leading">
							<Icon name="plus" />
						</Button.Icon>
						<Button.Label>Create Role</Button.Label>
					</Button.Root>
				) : undefined
			}
		>
			<div className="flex max-w-lg flex-1 flex-col overflow-y-auto">
				<Form
					{...getFormProps(form)}
					method="POST"
					action={`/admin/roles${location.search}`}
					className="w-full flex-1"
				>
					<fieldset
						disabled={isUpdateDisabled || isPending}
						className="flex h-full w-full flex-col"
					>
						<div className="w-full flex-1 space-y-4">
							<input hidden {...getInputProps(fields.id, { type: 'text' })} />
							<HoneypotInputs />
							<Field
								labelProps={{
									htmlFor: fields.name.id,
									children: 'Role name',
								}}
								inputProps={{
									...getInputProps(fields.name, {
										type: 'text',
										required: true,
									}),
									id: fields.name.id,
									placeholder: 'Role name',
								}}
								errors={fields.name.errors}
							/>
							<TextareaField
								labelProps={{
									htmlFor: fields.description.id,
									children: 'Description',
								}}
								textareaProps={{
									...getInputProps(fields.description, {
										type: 'text',
										required: true,
									}),
									id: fields.description.id,
									placeholder: 'Description',
								}}
								errors={fields.description.errors}
							/>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead></TableHead>
										{ACTIONS.map((action) => (
											<TableHead
												key={action + 'header'}
												className={
													'relative uppercase [&_svg]:inset-0 [&_svg]:right-0 [&_svg]:m-auto'
												}
											>
												{action}
											</TableHead>
										))}
										<TableHead>Full access</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{ENTITIES.map((entity, i) => {
										return (
											<PermissionRow
												fieldSet={
													permissionsFieldList.splice(0, ACTIONS.length) as any
												}
												entity={entity}
												key={entity}
											/>
										)
									})}
								</TableBody>
							</Table>
						</div>
						<Button.Root
							type="submit"
							intent="primary"
							className="w-full"
							disabled={isPending}
						>
							{
								{
									create: 'Create Role',
									update: 'Update Role',
								}[type]
							}
						</Button.Root>
					</fieldset>
				</Form>
			</div>
		</SlidePanel>
	)
}

type PermissionRowProps = {
	fieldSet: FieldMetadata<CreateNewRoleSchema['permissions'][0]>[]
	entity: string
	defaultChecked?: boolean
}
function PermissionRow({
	fieldSet,
	entity,
	defaultChecked,
}: Readonly<PermissionRowProps>) {
	console.log({ fieldSet: fieldSet[0]?.initialValue })
	const [isSelect, setIsSelect] = useState(
		defaultChecked ?? fieldSet[0]?.initialValue?.access === 'any',
	)
	if (!fieldSet) return
	return (
		<TableRow key={entity}>
			<TableCell>
				<Label>{uppercaseFirstLetter(entity)}</Label>
			</TableCell>
			{ACTIONS.map((action, ai) => {
				const fieldData = fieldSet[ai]
				if (!fieldData) return null
				const field = fieldData.getFieldset()
				return (
					<TableCell key={action}>
						<CheckboxField
							// {...permissionsFieldList[`${entity}.${action}`]}
							labelProps={{
								htmlFor: `${entity}.${action}`,
							}}
							buttonProps={{
								...(getInputProps(field.enabled, {
									type: 'checkbox',
								}) as any),
								defaultChecked: fieldData.initialValue?.enabled === 'on',
							}}
							errors={fieldData?.errors}
						/>
						<input
							hidden
							{...getInputProps(field.action, { type: 'text' })}
							value={fieldData.value?.enabled && action}
						/>
						<input hidden {...getInputProps(field.id, { type: 'text' })} />
						<input hidden {...getInputProps(field.entity, { type: 'text' })} />
						<input
							hidden
							{...getInputProps(field.access, { type: 'text' })}
							value={isSelect ? 'all' : 'own'}
						/>
					</TableCell>
				)
			})}
			<TableCell>
				<Toggle.Root
					onCheckedChange={(value) => {
						setIsSelect(value)
					}}
					checked={isSelect}
				>
					<Toggle.Thumb />
				</Toggle.Root>
			</TableCell>
		</TableRow>
	)
}
