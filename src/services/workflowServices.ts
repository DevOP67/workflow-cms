export const startWorkflow = async (payload: any, collection: string, document: any) => {
  const workflow = await payload.find({
    collection: 'workflows',
    where: {
      targetCollection: {
        equals: collection,
      },
    },
  })

  if (!workflow.docs.length) {
    console.log('No workflow found')
    return
  }

  const wf: any = workflow.docs[0]

  const steps = [...wf.steps].sort((a: any, b: any) => a.order - b.order)

  const firstStep = steps[0]

  await payload.update({
    collection: collection,
    id: document.id,
    data: {
      workflowStatus: 'started',
      currentStep: firstStep.order,
    },
  })

  await payload.create({
    collection: 'workflowLogs',
    data: {
      workflowId: String(wf.id),
      collectionSlug: String(collection),
      documentId: String(document.id),
      stepId: Number(firstStep.order),
      action: 'workflow_started',
    },
  })

  console.log(`Workflow started for ${collection}`)
}

export const moveToNextStep = async (payload: any, collection: string, document: any) => {
  const workflow = await payload.find({
    collection: 'workflows',
    where: {
      targetCollection: {
        equals: collection,
      },
    },
  })

  if (!workflow.docs.length) return

  const wf: any = workflow.docs[0]

  const steps = [...wf.steps].sort((a: any, b: any) => a.order - b.order)

  const nextStep = steps.find((step: any) => step.order === document.currentStep + 1)

  if (!nextStep) {
    await payload.update({
      collection: collection,
      id: document.id,
      data: {
        workflowStatus: 'completed',
      },
    })

    await payload.create({
      collection: 'workflowLogs',
      data: {
        workflowId: String(wf.id),
        collectionSlug: String(collection),
        documentId: String(document.id),
        action: 'workflow_completed',
      },
    })

    return
  }

  await payload.update({
    collection: collection,
    id: document.id,
    data: {
      currentStep: nextStep.order,
    },
  })

  await payload.create({
    collection: 'workflowLogs',
    data: {
      workflowId: String(wf.id),
      collectionSlug: String(collection),
      documentId: String(document.id),
      stepId: Number(nextStep.order),
      action: 'step_started',
    },
  })
}

export const handleWorkflowAction = async (
  payload: any,
  collection: string,
  documentId: string,
  action: string,
  userId: string,
  comment?: string,
) => {
  const doc: any = await payload.findByID({
    collection: collection,
    id: documentId,
  })

  const workflow = await payload.find({
    collection: 'workflows',
    where: {
      targetCollection: {
        equals: collection,
      },
    },
  })

  if (!workflow.docs.length) return

  const wf: any = workflow.docs[0]

  await payload.create({
    collection: 'workflowLogs',
    data: {
      workflowId: String(wf.id),
      collectionSlug: String(collection),
      documentId: String(documentId),
      stepId: Number(doc.currentStep),
      action: action,
      user: userId,
      comment: comment || '',
    },
  })

  if (action === 'approve') {
    await moveToNextStep(payload, collection, doc)
  }

  if (action === 'reject') {
    await payload.update({
      collection: collection,
      id: documentId,
      data: {
        workflowStatus: 'rejected',
      },
    })
  }
}
