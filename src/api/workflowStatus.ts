import payload from 'payload'

export const workflowStatusRoute = (express: any) => {
  const router = express.Router()

  router.get('/workflows/status/:collection/:docId', async (req: any, res: any) => {
    try {
      const { collection, docId } = req.params

      const doc = await payload.findByID({
        collection,
        id: docId,
      })

      const logs = await payload.find({
        collection: 'workflowLogs',
        where: {
          documentId: {
            equals: docId,
          },
        },
        limit: 100,
      })

      res.json({
        workflowStatus: doc.workflowStatus,
        currentStep: doc.currentStep,
        logs: logs.docs,
      })
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch workflow status',
      })
    }
  })

  return router
}
