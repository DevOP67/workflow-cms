import type { Endpoint } from 'payload'
import { handleWorkflowAction } from '../services/workflowServices'

export const workflowActionEndpoint: Endpoint = {
  path: '/workflows/action',
  method: 'post',

  handler: async (req) => {
    const payload = req.payload

    try {
      const body = req.body as any

      const { collection, documentId, action, comment } = body

      const userId = (req as any).user?.id || null

      await handleWorkflowAction(payload, collection, documentId, action, userId, comment)

      return Response.json({
        success: true,
      })
    } catch (error: any) {
      console.error(error)

      return Response.json({ error: error.message }, { status: 500 })
    }
  },
}
