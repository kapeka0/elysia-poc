import { Elysia, t } from 'elysia'

new Elysia({ normalize: false, allowUnsafeValidationDetails: false })
	.get('/account', () => ({ ok: true, secret: 'account data' }), {
		headers: t.Object({ 'x-api-key': t.String() })
	})
	.listen(3737)
