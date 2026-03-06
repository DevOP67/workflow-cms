import payload from 'payload'
import { evaluateCondition } from '../utils/conditionEvaluator'

export const startWorkflow = async (collection: string, document: any) => {
  const workflow: any = await payload.find({
    collection: 'workflows',
    where: {
      targetCollection: {
        equals: collection,
      },
    },
  })

  if (!workflow.docs.length) return

  const wf: any = workflow.docs[0]

  const steps = wf.steps.sort((a: any, b: any) => a.order - b.order)

  const firstValidStep = steps.find((step: any) => evaluateCondition(document, step.condition))

  if (!firstValidStep) return

  await payload.update({
    collection: collection as any,
    id: document.id,
    data: {
      workflowStatus: 'started',
      currentStep: firstValidStep.order,
    } as any,
  })

  await payload.create({
    collection: 'workflowLogs',
    data: {
      workflowId: wf.id,
      collection: collection,
      documentId: document.id,
      stepId: firstValidStep.order,
      action: 'workflow_started',
    } as any,
  })
}

export const moveToNextStep = async (collection: string, document: any) => {
  const workflow: any = await payload.find({
    collection: 'workflows',
    where: {
      targetCollection: {
        equals: collection,
      },
    },
  })

  if (!workflow.docs.length) return

  const wf: any = workflow.docs[0]

  const steps = wf.steps.sort((a: any, b: any) => a.order - b.order)

  const nextStep = steps.find(
    (step: any) => step.order > document.currentStep && evaluateCondition(document, step.condition),
  )

  if (!nextStep) {
    await payload.update({
      collection: collection as any,
      id: document.id,
      data: {
        workflowStatus: 'completed',
      } as any,
    })

    await payload.create({
      collection: 'workflowLogs',
      data: {
        workflowId: wf.id,
        collection: collection,
        documentId: document.id,
        action: 'workflow_completed',
      } as any,
    })

    return
  }

  await payload.update({
    collection: collection as any,
    id: document.id,
    data: {
      currentStep: nextStep.order,
    } as any,
  })

  await payload.create({
    collection: 'workflowLogs',
    data: {
      workflowId: wf.id,
      collection: collection,
      documentId: document.id,
      stepId: nextStep.order,
      action: 'step_started',
    } as any,
  })
}

export const handleWorkflowAction = async (
  collection: string,
  documentId: string,
  action: string,
  user?: any,
  comment?: string,
) => {
  const doc: any = await payload.findByID({
    collection: collection as any,
    id: documentId,
  })

  const workflow: any = await payload.find({
    collection: 'workflows',
    where: {
      targetCollection: {
        equals: collection,
      },
    },
  })

  if (!workflow.docs.length) return

  const wf: any = workflow.docs[0]

  const step = wf.steps.find((s: any) => s.order === doc.currentStep)

  // Role-based permission
  if (step?.assignedRole && user?.role !== step.assignedRole) {
    throw new Error('User not authorized for this step')
  }

  await payload.create({
    collection: 'workflowLogs',
    data: {
      workflowId: wf.id,
      collection: collection,
      documentId: documentId,
      stepId: doc.currentStep,
      user: user?.id,
      action: action,
      comment: comment,
    } as any,
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
      } as any,
    })
  }
}

export const getWorkflowStatus = async (collection: string, documentId: string) => {
  const doc: any = await payload.findByID({
    collection: collection as any,
    id: documentId,
  })

  const logs: any = await payload.find({
    collection: 'workflowLogs',
    where: {
      documentId: {
        equals: documentId,
      },
    },
  })

  return {
    workflowStatus: doc.workflowStatus,
    currentStep: doc.currentStep,
    logs: logs.docs,
  }
}
