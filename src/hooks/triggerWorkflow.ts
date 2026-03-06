import { startWorkflow } from '../services/workflowServices'

export const triggerWorkflow = async ({ doc, collection }: any) => {
  const watchedCollections = ['blog', 'contract']

  if (!watchedCollections.includes(collection.slug)) {
    return doc
  }

  // Start workflow only if not already started
  if (!doc.workflowStatus) {
    console.log(`Starting workflow for ${collection.slug}`)

    await startWorkflow(collection.slug, doc)
  }

  return doc
}
