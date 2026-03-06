import type { Endpoint } from 'payload'
import {
  startWorkflow,
  handleWorkflowAction,
  getWorkflowStatus,
} from '../services/workflowServices'

export const workflowTriggerEndpoint: Endpoint = {
  path: '/workflows/trigger',
  method: 'post',

  handler: async (req) => {
    const body = await req.json?.()

    const collection = body?.collection
    const documentId = body?.documentId

    if (!collection || !documentId) {
      return Response.json({ error: 'collection and documentId are required' }, { status: 400 })
    }

    const payload = req.payload

    const doc = await payload.findByID({
      collection,
      id: documentId,
    })

    await startWorkflow(collection, doc)

    return Response.json({
      success: true,
      message: 'Workflow triggered',
    })
  },
}

export const workflowActionEndpoint: Endpoint = {
  path: '/workflows/action',
  method: 'post',

  handler: async (req) => {
    const body = await req.json?.()

    const collection = body?.collection
    const documentId = body?.documentId
    const action = body?.action
    const comment = body?.comment

    if (!collection || !documentId || !action) {
      return Response.json({ error: 'collection, documentId and action required' }, { status: 400 })
    }

    await handleWorkflowAction(collection, documentId, action, req.user?.id, comment)

    return Response.json({
      success: true,
    })
  },
}

export const workflowStatusEndpoint: Endpoint = {
  path: '/workflows/status/:collection/:docId',
  method: 'get',

  handler: async (req) => {
    const collection = String(req.routeParams?.collection)
    const docId = String(req.routeParams?.docId)

    if (!collection || !docId) {
      return Response.json({ error: 'collection and docId required' }, { status: 400 })
    }

    const status = await getWorkflowStatus(collection, docId)

    return Response.json(status)
  },
}
