import type { Endpoint } from 'payload'
import {
  startWorkflow,
  handleWorkflowAction,
  getWorkflowStatus,
} from '../services/workflowServices'

/**
 * Trigger Workflow Manually
 * POST /api/workflows/trigger
 * Body: { collection, documentId }
 */
export const workflowTriggerEndpoint: Endpoint = {
  path: '/workflow-engine/trigger',
  method: 'post',
  handler: async (req) => {
    if (!req.user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 })
    }

    let body: any = {}
    try {
      body = await (req as unknown as Request).json()
    } catch {
      // body may have been consumed already
    }
    const { collection, documentId } = body as { collection?: string; documentId?: string }

    if (!collection || !documentId) {
      return Response.json({ error: 'collection and documentId are required' }, { status: 400 })
    }

    try {
      const doc = await req.payload.findByID({
        collection: collection as any,
        id: documentId,
        req,
      })

      if (!doc) {
        return Response.json({ error: 'Document not found' }, { status: 404 })
      }

      await startWorkflow(req.payload, collection, doc, req)

      return Response.json({
        success: true,
        message: 'Workflow triggered successfully',
      })
    } catch (err: any) {
      return Response.json({ error: err.message || 'Failed to trigger workflow' }, { status: 500 })
    }
  },
}

/**
 * Approve / Reject / Comment on a workflow step
 * POST /api/workflows/action
 * Body: { collection, documentId, action, comment? }
 */
export const workflowActionEndpoint: Endpoint = {
  path: '/workflow-engine/action',
  method: 'post',
  handler: async (req) => {
    if (!req.user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 })
    }

    let body: any = {}
    try {
      body = await (req as unknown as Request).json()
    } catch {
      // body may have been consumed already
    }
    const { collection, documentId, action, comment } = body as {
      collection?: string
      documentId?: string
      action?: string
      comment?: string
    }

    if (!collection || !documentId || !action) {
      return Response.json(
        { error: 'collection, documentId and action are required' },
        { status: 400 },
      )
    }

    if (!['approve', 'reject', 'comment'].includes(action)) {
      return Response.json(
        { error: 'action must be one of: approve, reject, comment' },
        { status: 400 },
      )
    }

    try {
      await handleWorkflowAction(
        req.payload,
        collection,
        documentId,
        action,
        req.user?.id || null,
        comment,
        req,
      )

      return Response.json({
        success: true,
        message: `Workflow action "${action}" executed successfully`,
      })
    } catch (err: any) {
      const status = err.message?.includes('not authorized') ? 403 : 400
      return Response.json({ error: err.message || 'Action failed' }, { status })
    }
  },
}

/**
 * Get Workflow Status for a document
 * GET /api/workflows/status?collection=xxx&docId=xxx
 * Returns: current step, completed steps, pending steps, logs
 */
export const workflowStatusEndpoint: Endpoint = {
  path: '/workflow-engine/status',
  method: 'get',
  handler: async (req) => {
    if (!req.user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 })
    }

    const url = new URL(req.url || '', 'http://localhost')
    const collection = url.searchParams.get('collection')
    const docId = url.searchParams.get('docId')

    if (!collection || !docId) {
      return Response.json(
        { error: 'collection and docId query params are required' },
        { status: 400 },
      )
    }

    try {
      const status = await getWorkflowStatus(req.payload, collection, docId)
      return Response.json(status)
    } catch (err: any) {
      return Response.json(
        {
          workflowStatus: null,
          currentStep: null,
          completedSteps: [],
          pendingSteps: [],
          logs: [],
          hasWorkflow: false,
          error: err?.message,
        },
        { status: 200 },
      )
    }
  },
}
