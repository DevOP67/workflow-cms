import { startWorkflow } from '../services/workflowServices'

export const triggerWorkflow = async ({ doc, collection, req, context }: any) => {
  // Prevent infinite loops when startWorkflow updates the same document
  if (context.skipWorkflowTrigger) {
    return doc
  }

  // Dynamically detect if a workflow exists for this collection
  // No hardcoded collection list — any collection with this hook will be checked
  const collectionSlug = collection?.slug || collection

  // Start workflow only if not already started
  if (!doc.workflowStatus) {
    const workflows = await req.payload.find({
      collection: 'workflows',
      where: { targetCollection: { equals: collectionSlug } },
      limit: 1,
      req,
    })

    if (workflows.docs.length > 0) {
      console.log(`[Workflow] Starting workflow for ${collectionSlug}`)
      await startWorkflow(req.payload, collectionSlug, doc, req)
    }
  }

  return doc
}
