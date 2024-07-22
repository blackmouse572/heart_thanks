import { z } from 'zod'
import SlidePanel from '#app/components/drawer.js'
import { Form, useLocation } from '@remix-run/react'
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

export const CreateNewRoleSchema = z.object({
	name: z.string(),
	description: z.string().optional(),
	permissions: z.array(
		z.object({
			enabled: z.string().optional(),
			entity: z.string().optional(),
			action: z.string().optional(),
			access: z.string().optional(),
		}),
	),
})
type CreateNewRoleSchema = z.infer<typeof CreateNewRoleSchema>

type CreatePanelProps = {
	defaultValue?: CreateNewRoleSchema
}
export function CreateRolePanel(props: CreatePanelProps) {
	const [form, fields] = useForm({
		id: 'create-role',
		constraint: getZodConstraint(CreateNewRoleSchema),
		onValidate: ({ formData: values }) => {
			return parseWithZod(values, {
				schema: CreateNewRoleSchema,
			})
		},
		// lastResult: actionData?.user as any,
		defaultValue: props.defaultValue ?? {
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

	return (
		<SlidePanel
			title={`Create new role`}
			trigger={
				<Button.Root>
					<Button.Icon type="leading">
						<Icon name="plus" />
					</Button.Icon>
					<Button.Label>Create Role</Button.Label>
				</Button.Root>
			}
		>
			<div className="flex max-w-lg flex-1 flex-col overflow-y-auto">
				<Form
					{...getFormProps(form)}
					method="POST"
					action={`/admin/roles${location.search}`}
					className="flex w-full flex-1 flex-col"
				>
					<div className="w-full flex-1 space-y-4">
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
					<Button.Root type="submit" intent="primary" className="w-full">
						Create Role
					</Button.Root>
				</Form>
			</div>
		</SlidePanel>
	)
}

type PermissionRowProps = {
	fieldSet: FieldMetadata<{
		entity: string | undefined
		action: string | undefined
		access: string | undefined
		enabled: string | undefined
	}>[]
	entity: string
	defaultChecked?: boolean
}
function PermissionRow({
	fieldSet,
	entity,
	defaultChecked,
}: PermissionRowProps) {
	if (!fieldSet) return
	const [isSelect, setIsSelect] = useState(defaultChecked ?? false)
	return (
		<TableRow key={entity}>
			<TableCell>
				<Label>{uppercaseFirstLetter(entity)}</Label>
			</TableCell>
			{ACTIONS.map((action, ai) => {
				const fieldData = fieldSet[ai]!
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
							}}
							errors={fieldData?.errors}
						/>
						<input
							hidden
							{...getInputProps(field.action, { type: 'text' })}
							value={fieldData.value?.enabled && action}
						/>

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
				>
					<Toggle.Thumb />
				</Toggle.Root>
			</TableCell>
		</TableRow>
	)
}
