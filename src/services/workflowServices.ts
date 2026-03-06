import payload from 'payload'

export const startWorkflow = async (collection: string, document: any) => {
  const workflow = await payload.find({
    collection: 'workflows' as any,
    where: {
      targetCollection: {
        equals: collection,
      },
    },
  })

  if (!workflow.docs.length) return

  const wf: any = workflow.docs[0]

  const steps = (wf.steps || []).sort((a: any, b: any) => a.order - b.order)

  const firstStep = steps[0]

  await payload.update({
    collection: collection as any,
    id: document.id,
    data: {
      workflowStatus: 'started',
      currentStep: firstStep?.order || 1,
    },
  })

  await payload.create({
    collection: 'workflowLogs' as any,
    data: {
      workflowId: wf.id,
      collection: collection,
      documentId: document.id,
      stepId: firstStep?.order,
      action: 'workflow_started',
    },
  })
}

export const moveToNextStep = async (collection: string, document: any) => {
  const workflow = await payload.find({
    collection: 'workflows' as any,
    where: {
      targetCollection: {
        equals: collection,
      },
    },
  })

  if (!workflow.docs.length) return

  const wf: any = workflow.docs[0]

  const steps = (wf.steps || []).sort((a: any, b: any) => a.order - b.order)

  const nextStep = steps.find((step: any) => step.order === document.currentStep + 1)

  if (!nextStep) {
    await payload.update({
      collection: collection as any,
      id: document.id,
      data: {
        workflowStatus: 'completed',
      },
    })

    await payload.create({
      collection: 'workflowLogs' as any,
      data: {
        workflowId: wf.id,
        collection: collection,
        documentId: document.id,
        action: 'workflow_completed',
      },
    })

    return
  }

  await payload.update({
    collection: collection as any,
    id: document.id,
    data: {
      currentStep: nextStep.order,
    },
  })

  await payload.create({
    collection: 'workflowLogs' as any,
    data: {
      workflowId: wf.id,
      collection: collection,
      documentId: document.id,
      stepId: nextStep.order,
      action: 'step_started',
    },
  })
}

export const handleWorkflowAction = async (
  collection: string,
  documentId: string,
  action: string,
  userId?: string,
  comment?: string,
) => {
  const doc: any = await payload.findByID({
    collection: collection as any,
    id: documentId,
  })

  const workflow = await payload.find({
    collection: 'workflows' as any,
    where: {
      targetCollection: {
        equals: collection,
      },
    },
  })

  if (!workflow.docs.length) return

  const wf: any = workflow.docs[0]

  await payload.create({
    collection: 'workflowLogs' as any,
    data: {
      workflowId: wf.id,
      collection: collection,
      documentId: documentId,
      stepId: doc.currentStep,
      user: userId,
      action: action,
      comment: comment,
    },
  })

  if (action === 'approve') {
    await moveToNextStep(collection, doc)
  }

  if (action === 'reject') {
    await payload.update({
      collection: collection as any,
      id: documentId,
      data: {
        workflowStatus: 'rejected',
      },
    })
  }
}

export const getWorkflowStatus = async (collection: string, documentId: string) => {
  const doc: any = await payload.findByID({
    collection: collection as any,
    id: documentId,
  })

  return {
    workflowStatus: doc.workflowStatus,
    currentStep: doc.currentStep,
  }
}
