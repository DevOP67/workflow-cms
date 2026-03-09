import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const GET = async (
  request: Request,
  { params }: { params: { collection: string; docId: string } },
) => {
  const payload = await getPayload({
    config: configPromise,
  })

  const { collection, docId } = params

  try {
    const doc: any = await payload.findByID({
      collection: collection as any,
      id: docId,
    })

    const logs = await payload.find({
      collection: 'workflowLogs',
      where: {
        documentId: {
          equals: docId,
        },
      },
      sort: '-createdAt',
    })

    return Response.json({
      workflowStatus: doc.workflowStatus,
      currentStep: doc.currentStep,
      logs: logs.docs,
    })
  } catch (error: any) {
    return Response.json({
      error: error.message,
    })
  }
}
