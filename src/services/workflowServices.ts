import { evaluateCondition } from '../utils/conditionEvaluator'

// ── Email notification simulation ──────────────────────────────────────────────
const simulateEmailNotification = (to: string, subject: string, body: string) => {
  console.log(`\n📧 [EMAIL NOTIFICATION]`)
  console.log(`   To: ${to}`)
  console.log(`   Subject: ${subject}`)
  console.log(`   Body: ${body}`)
  console.log(`   Sent at: ${new Date().toISOString()}\n`)
}

// ── Find workflow for a collection ─────────────────────────────────────────────
const findWorkflow = async (payload: any, collection: string, req?: any) => {
  const result = await payload.find({
    collection: 'workflows',
    where: { targetCollection: { equals: collection } },
    limit: 1,
    ...(req ? { req } : {}),
  })
  return result.docs.length ? result.docs[0] : null
}

// ── Get sorted steps from a workflow ───────────────────────────────────────────
const getSortedSteps = (wf: any) => {
  return [...(wf.steps || [])].sort((a: any, b: any) => a.order - b.order)
}

// ── Step-level authorization check ─────────────────────────────────────────────
export const isUserAuthorizedForStep = async (
  payload: any,
  step: any,
  userId: string | null,
): Promise<boolean> => {
  if (!step) return false

  // If step has a specific assigned user, check that
  if (step.assignedUser) {
    const assignedId =
      typeof step.assignedUser === 'object' ? step.assignedUser.id : step.assignedUser
    return assignedId === userId
  }

  // If step has an assigned role, check user's role
  if (step.assignedRole && userId) {
    const user: any = await payload.findByID({
      collection: 'users',
      id: userId,
    })
    return user?.role === step.assignedRole
  }

  // Comment-only steps are open to any authenticated user
  if (step.stepType === 'comment') return !!userId

  // No restriction configured — allow any authenticated user
  return !!userId
}

// ── Start Workflow ─────────────────────────────────────────────────────────────
export const startWorkflow = async (payload: any, collection: string, document: any, req?: any) => {
  const wf = await findWorkflow(payload, collection, req)

  if (!wf) {
    console.log(`[Workflow] No workflow found for ${collection}`)
    return
  }

  const steps = getSortedSteps(wf)
  const firstValidStep = steps.find((step: any) => evaluateCondition(document, step.condition))

  if (!firstValidStep) return

  await payload.update({
    collection,
    id: document.id,
    data: {
      workflowStatus: 'started',
      currentStep: firstValidStep.order,
      status: 'review',
    },
    context: { skipWorkflowTrigger: true },
    ...(req ? { req } : {}),
  })

  await payload.create({
    collection: 'workflowLogs',
    data: {
      workflowId: String(wf.id),
      collectionSlug: collection,
      documentId: String(document.id),
      stepId: Number(firstValidStep.order),
      action: 'workflow_started',
    },
    ...(req ? { req } : {}),
  })

  simulateEmailNotification(
    `${firstValidStep.assignedRole || 'team'}@company.com`,
    `Workflow started: ${wf.name}`,
    `Step "${firstValidStep.stepName}" is now pending your action on ${collection} document ${document.id}.`,
  )

  console.log(`[Workflow] Started for ${collection} — step: ${firstValidStep.stepName}`)
}

// ── Move to Next Step ──────────────────────────────────────────────────────────
export const moveToNextStep = async (
  payload: any,
  collection: string,
  document: any,
  req?: any,
) => {
  console.log(`[Workflow] moveToNextStep called for ${collection} doc ${document.id}`)
  const wf = await findWorkflow(payload, collection, req)
  if (!wf) {
    console.log(`[Workflow] No workflow found for ${collection}`)
    return
  }

  const steps = getSortedSteps(wf)
  console.log(`[Workflow] Total steps: ${steps.length}, current step: ${document.currentStep}`)

  const nextStep = steps.find(
    (step: any) => step.order > document.currentStep && evaluateCondition(document, step.condition),
  )

  if (!nextStep) {
    // All steps completed — mark workflow as approved
    console.log(`[Workflow] No more steps found. Marking as approved.`)
    await payload.update({
      collection,
      id: document.id,
      data: { workflowStatus: 'approved', status: 'approved' },
      context: { skipWorkflowTrigger: true },
      ...(req ? { req } : {}),
    })

    await payload.create({
      collection: 'workflowLogs',
      data: {
        workflowId: String(wf.id),
        collectionSlug: collection,
        documentId: String(document.id),
        action: 'workflow_completed',
      },
      ...(req ? { req } : {}),
    })

    simulateEmailNotification(
      'admin@company.com',
      `Workflow completed: ${wf.name}`,
      `All steps have been approved for ${collection} document ${document.id}.`,
    )

    return
  }

  await payload.update({
    collection,
    id: document.id,
    data: { currentStep: nextStep.order },
    context: { skipWorkflowTrigger: true },
    ...(req ? { req } : {}),
  })

  await payload.create({
    collection: 'workflowLogs',
    data: {
      workflowId: String(wf.id),
      collectionSlug: collection,
      documentId: String(document.id),
      stepId: Number(nextStep.order),
      action: 'step_started',
    },
    ...(req ? { req } : {}),
  })

  simulateEmailNotification(
    `${nextStep.assignedRole || 'team'}@company.com`,
    `Action required: ${nextStep.stepName}`,
    `Step "${nextStep.stepName}" (${nextStep.stepType}) is now pending on ${collection} document ${document.id}.`,
  )
}

// ── Handle Workflow Action (approve / reject / comment) ────────────────────────
export const handleWorkflowAction = async (
  payload: any,
  collection: string,
  documentId: string,
  action: string,
  userId?: string | null,
  comment?: string,
  req?: any,
) => {
  const doc: any = await payload.findByID({
    collection,
    id: documentId,
    ...(req ? { req } : {}),
  })

  if (doc.workflowStatus !== 'started') {
    throw new Error('Workflow is not active for this document')
  }

  const wf = await findWorkflow(payload, collection)
  if (!wf) throw new Error('No workflow found for this collection')

  const steps = getSortedSteps(wf)
  const step = steps.find((s: any) => s.order === doc.currentStep)

  if (!step) throw new Error('Current step not found in workflow definition')

  // ── Step-level authorization ──
  const authorized = await isUserAuthorizedForStep(payload, step, userId || null)
  if (!authorized) {
    throw new Error(
      `You are not authorized to perform this action. Step "${step.stepName}" requires role: ${step.assignedRole || 'any'}.`,
    )
  }

  // Comment-only steps only allow comments, not approve/reject
  if (step.stepType === 'comment' && action !== 'comment') {
    throw new Error('This step only allows comments, not approval or rejection')
  }

  // ── Log the action ──
  const logData: any = {
    workflowId: String(wf.id),
    collectionSlug: collection,
    documentId: String(documentId),
    stepId: Number(doc.currentStep),
    action,
    comment: comment || '',
  }
  if (userId) logData.user = userId

  await payload.create({
    collection: 'workflowLogs',
    data: logData,
    ...(req ? { req } : {}),
  })

  // ── Execute the action ──
  console.log(
    `[Workflow] handleWorkflowAction: action=${action}, step=${step.order}, current=${doc.currentStep}`,
  )
  if (action === 'approve') {
    console.log(`[Workflow] Approving step ${step.order}...`)
    await moveToNextStep(payload, collection, doc, req)
  } else if (action === 'reject') {
    await payload.update({
      collection,
      id: documentId,
      data: { workflowStatus: 'rejected', status: 'rejected' },
      context: { skipWorkflowTrigger: true },
      ...(req ? { req } : {}),
    })

    simulateEmailNotification(
      'admin@company.com',
      `Workflow rejected: ${wf.name}`,
      `Document ${documentId} in ${collection} was rejected at step "${step.stepName}".${comment ? ` Comment: ${comment}` : ''}`,
    )
  }
  // 'comment' action — just the log entry, no state change
}

// ── Get Workflow Status ────────────────────────────────────────────────────────
export const getWorkflowStatus = async (payload: any, collection: string, documentId: string) => {
  const doc: any = await payload.findByID({
    collection,
    id: documentId,
  })

  const wf = await findWorkflow(payload, collection)

  let currentStepName: string | null = null
  let currentStepType: string | null = null
  let totalSteps = 0
  const completedSteps: any[] = []
  const pendingSteps: any[] = []

  if (wf && wf.steps) {
    const steps = getSortedSteps(wf)
    totalSteps = steps.length

    for (const step of steps) {
      const stepSummary = {
        order: step.order,
        stepName: step.stepName,
        stepType: step.stepType,
        assignedRole: step.assignedRole || null,
      }

      if (doc.currentStep != null && step.order < doc.currentStep) {
        completedSteps.push(stepSummary)
      } else if (step.order === doc.currentStep) {
        currentStepName = step.stepName
        currentStepType = step.stepType
      } else {
        pendingSteps.push(stepSummary)
      }
    }
  }

  const logs: any = await payload.find({
    collection: 'workflowLogs',
    where: { documentId: { equals: documentId } },
    sort: '-createdAt',
    limit: 100,
  })

  return {
    workflowStatus: doc.workflowStatus || null,
    currentStep: doc.currentStep || null,
    currentStepName,
    currentStepType,
    totalSteps,
    completedSteps,
    pendingSteps,
    hasWorkflow: !!wf,
    workflowName: wf?.name || null,
    logs: logs.docs,
  }
}

// ── SLA Check (call periodically or via cron) ──────────────────────────────────
export const checkSLAEscalations = async (payload: any) => {
  const workflows = await payload.find({
    collection: 'workflows',
    limit: 100,
  })

  for (const wf of workflows.docs) {
    const steps = getSortedSteps(wf)

    // Find documents stuck in this workflow
    const docs = await payload.find({
      collection: wf.targetCollection,
      where: { workflowStatus: { equals: 'started' } },
      limit: 100,
    })

    for (const doc of docs.docs) {
      const currentStep = steps.find((s: any) => s.order === doc.currentStep)
      if (!currentStep?.slaDays) continue

      // Find when this step was started
      const stepLog = await payload.find({
        collection: 'workflowLogs',
        where: {
          and: [
            { documentId: { equals: String(doc.id) } },
            { stepId: { equals: currentStep.order } },
            {
              or: [
                { action: { equals: 'step_started' } },
                { action: { equals: 'workflow_started' } },
              ],
            },
          ],
        },
        sort: '-createdAt',
        limit: 1,
      })

      if (!stepLog.docs.length) continue

      const stepStartDate = new Date(stepLog.docs[0].createdAt)
      const deadlineMs = currentStep.slaDays * 24 * 60 * 60 * 1000
      const now = Date.now()

      if (now - stepStartDate.getTime() > deadlineMs) {
        // SLA exceeded — auto-escalate
        simulateEmailNotification(
          'admin@company.com',
          `⚠️ SLA Exceeded: ${wf.name}`,
          `Step "${currentStep.stepName}" on ${wf.targetCollection} document ${doc.id} has exceeded its ${currentStep.slaDays}-day SLA deadline. Please escalate.`,
        )

        await payload.create({
          collection: 'workflowLogs',
          data: {
            workflowId: String(wf.id),
            collectionSlug: wf.targetCollection,
            documentId: String(doc.id),
            stepId: currentStep.order,
            action: 'sla_escalated',
            comment: `SLA of ${currentStep.slaDays} days exceeded. Auto-escalation triggered.`,
          },
        })
      }
    }
  }
}
