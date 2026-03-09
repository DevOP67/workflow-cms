import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ collection: string; docId: string }> },
) {
  const payload = await getPayload({
    config: configPromise,
  })

  const { collection, docId } = await context.params

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

    return NextResponse.json({
      workflowStatus: doc.workflowStatus,
      currentStep: doc.currentStep,
      logs: logs.docs,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
