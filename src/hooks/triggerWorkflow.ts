import { startWorkflow } from '../services/workflowServices'

export const triggerWorkflow = async ({ doc, collection, req }: any) => {
  const watchedCollections = ['blog', 'contract']

  if (!watchedCollections.includes(collection.slug)) {
    return doc
  }

  if (!doc.workflowStatus) {
    console.log(`Starting workflow for ${collection.slug}`)

    await startWorkflow(req.payload, collection.slug, doc)
  }

  return doc
}
