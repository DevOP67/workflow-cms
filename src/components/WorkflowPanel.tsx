'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'
import { useRouter } from 'next/navigation.js'

type StepSummary = {
  order: number
  stepName: string
  stepType: string
  assignedRole: string | null
}

type WorkflowData = {
  workflowStatus: string | null
  currentStep: number | null
  currentStepName: string | null
  currentStepType: string | null
  totalSteps: number
  completedSteps: StepSummary[]
  pendingSteps: StepSummary[]
  hasWorkflow: boolean
  workflowName: string | null
  logs: any[]
}

const badgeColors: Record<string, { bg: string; fg: string }> = {
  approved: { bg: '#16a34a', fg: '#fff' },
  workflow_completed: { bg: '#16a34a', fg: '#fff' },
  rejected: { bg: '#dc2626', fg: '#fff' },
  started: { bg: '#f59e0b', fg: '#fff' },
  workflow_started: { bg: '#3b82f6', fg: '#fff' },
  approve: { bg: '#16a34a', fg: '#fff' },
  reject: { bg: '#dc2626', fg: '#fff' },
  step_started: { bg: '#3b82f6', fg: '#fff' },
}

const getBadgeStyle = (status: string | undefined): React.CSSProperties => {
  const colors = status ? badgeColors[status] : undefined
  return {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    background: colors?.bg ?? 'var(--theme-elevation-200)',
    color: colors?.fg ?? 'var(--theme-text)',
  }
}

const WorkflowPanel = () => {
  const { id, collectionSlug } = useDocumentInfo()
  const router = useRouter()

  const [data, setData] = useState<WorkflowData | null>(null)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [fetching, setFetching] = useState(false)

  const fetchStatus = useCallback(async () => {
    if (!id || !collectionSlug) return
    setFetching(true)
    try {
      const res = await fetch(
        `/api/workflow-engine/status?collection=${collectionSlug}&docId=${id}`,
        {
          credentials: 'include',
        },
      )
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error('Failed to load workflow status', err)
    } finally {
      setFetching(false)
    }
  }, [id, collectionSlug])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  // -- Pre-save state
  if (!id) {
    return (
      <div style={{ padding: '4px 0', color: 'var(--theme-text)', fontSize: '13px', opacity: 0.6 }}>
        Save the document to start a workflow.
      </div>
    )
  }

  // -- Loading
  if (fetching && !data) {
    return (
      <div style={{ padding: '4px 0', color: 'var(--theme-text)', fontSize: '13px', opacity: 0.6 }}>
        Loading workflow…
      </div>
    )
  }

  // -- No workflow configured for this collection
  if (data && !data.hasWorkflow) {
    return (
      <div style={{ padding: '4px 0', color: 'var(--theme-text)', fontSize: '13px', opacity: 0.5 }}>
        No workflow configured for this collection.
      </div>
    )
  }

  const runAction = async (action: string) => {
    setLoading(true)
    setActionError(null)
    try {
      const res = await fetch('/api/workflow-engine/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          collection: collectionSlug,
          documentId: id,
          action,
          comment,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json.error || `Action failed (${res.status})`)
      }
      setComment('')
      // Refresh sidebar data + reload form so field values update
      await fetchStatus()
      router.refresh()
    } catch (err: any) {
      setActionError(err.message || 'Action failed')
    } finally {
      setLoading(false)
    }
  }

  const triggerWorkflow = async () => {
    setLoading(true)
    setActionError(null)
    try {
      const res = await fetch('/api/workflow-engine/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          collection: collectionSlug,
          documentId: id,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json.error || `Trigger failed (${res.status})`)
      }
      await fetchStatus()
      router.refresh()
    } catch (err: any) {
      setActionError(err.message || 'Failed to start workflow')
    } finally {
      setLoading(false)
    }
  }

  const status = data?.workflowStatus
  const isActive = status === 'started'
  const isTerminal =
    status === 'approved' || status === 'rejected' || status === 'workflow_completed'
  const notStarted = !status || (!isActive && !isTerminal)
  const isCommentOnly = data?.currentStepType === 'comment'

  return (
    <div style={{ padding: '4px 0', color: 'var(--theme-text)' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <span style={{ fontWeight: 600, fontSize: '14px' }}>
          {data?.workflowName || 'Workflow'}
        </span>
        {status && <span style={getBadgeStyle(status)}>{status}</span>}
      </div>

      {/* Step progress (completed / pending) */}
      {data && data.totalSteps > 0 && isActive && (
        <div
          style={{
            fontSize: '11px',
            marginBottom: '8px',
            display: 'flex',
            gap: '4px',
          }}
        >
          {Array.from({ length: data.totalSteps }, (_, i) => {
            const stepNum = i + 1
            const isCompleted = data.completedSteps.some((s) => s.order === stepNum)
            const isCurrent = data.currentStep === stepNum
            return (
              <div
                key={stepNum}
                title={
                  isCompleted
                    ? `Step ${stepNum}: completed`
                    : isCurrent
                      ? `Step ${stepNum}: current`
                      : `Step ${stepNum}: pending`
                }
                style={{
                  flex: 1,
                  height: '4px',
                  borderRadius: '2px',
                  background: isCompleted
                    ? '#16a34a'
                    : isCurrent
                      ? '#f59e0b'
                      : 'var(--theme-elevation-200)',
                }}
              />
            )
          })}
        </div>
      )}

      {/* Current step info */}
      {isActive && data?.currentStepName && (
        <div
          style={{
            fontSize: '12px',
            marginBottom: '12px',
            padding: '8px 10px',
            borderRadius: '4px',
            background: 'var(--theme-elevation-100)',
          }}
        >
          <span style={{ opacity: 0.6 }}>
            Step {data.currentStep} of {data.totalSteps}:
          </span>{' '}
          <strong>{data.currentStepName}</strong>
          {data.currentStepType && (
            <span
              style={{
                marginLeft: '6px',
                fontSize: '10px',
                opacity: 0.5,
                textTransform: 'uppercase',
              }}
            >
              ({data.currentStepType})
            </span>
          )}
        </div>
      )}

      {/* Not started — offer to trigger */}
      {notStarted && data?.hasWorkflow && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', opacity: 0.6, marginBottom: '8px' }}>
            Workflow has not been started for this document.
          </div>
          <button
            disabled={loading}
            onClick={triggerWorkflow}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid var(--theme-elevation-400)',
              background: 'var(--theme-elevation-100)',
              color: 'var(--theme-text)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Starting…' : 'Start Workflow'}
          </button>
        </div>
      )}

      {/* Active — approve / reject / comment */}
      {isActive && (
        <>
          <textarea
            placeholder={isCommentOnly ? 'Add a comment' : 'Add a comment (optional)'}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            style={{
              width: '100%',
              marginBottom: '8px',
              padding: '8px 10px',
              borderRadius: '4px',
              border: '1px solid var(--theme-elevation-300)',
              background: 'var(--theme-input-bg)',
              color: 'var(--theme-text)',
              fontSize: '13px',
              resize: 'vertical',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />

          <div style={{ display: 'flex', gap: '8px' }}>
            {!isCommentOnly && (
              <>
                <button
                  disabled={loading}
                  onClick={() => runAction('approve')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: 'none',
                    background: '#16a34a',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading ? '…' : 'Approve'}
                </button>

                <button
                  disabled={loading}
                  onClick={() => runAction('reject')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #dc2626',
                    background: 'transparent',
                    color: '#dc2626',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading ? '…' : 'Reject'}
                </button>
              </>
            )}

            <button
              disabled={loading || (!comment.trim() && isCommentOnly)}
              onClick={() => runAction('comment')}
              style={{
                flex: isCommentOnly ? 1 : undefined,
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid var(--theme-elevation-400)',
                background: 'var(--theme-elevation-100)',
                color: 'var(--theme-text)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading || (!comment.trim() && isCommentOnly) ? 0.6 : 1,
              }}
            >
              {loading ? '…' : 'Comment'}
            </button>
          </div>
        </>
      )}

      {/* Completed/Pending steps list */}
      {isActive && (data?.completedSteps?.length ?? 0) + (data?.pendingSteps?.length ?? 0) > 0 && (
        <div style={{ marginTop: '12px' }}>
          <div
            style={{
              borderTop: '1px solid var(--theme-elevation-200)',
              margin: '0 0 8px',
            }}
          />
          <span
            style={{ fontWeight: 600, fontSize: '12px', display: 'block', marginBottom: '4px' }}
          >
            Steps
          </span>
          {[...(data?.completedSteps || []), ...(data?.pendingSteps || [])].map((step) => {
            const isCompleted = data?.completedSteps?.some((s) => s.order === step.order)
            const isCurrent = step.order === data?.currentStep
            return (
              <div
                key={step.order}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  padding: '3px 0',
                  opacity: isCompleted ? 0.5 : 1,
                }}
              >
                <span>{isCompleted ? '✓' : isCurrent ? '▶' : '○'}</span>
                <span style={{ textDecoration: isCompleted ? 'line-through' : 'none' }}>
                  {step.stepName}
                </span>
                <span style={{ fontSize: '10px', opacity: 0.5, textTransform: 'uppercase' }}>
                  {step.stepType}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Terminal state message */}
      {isTerminal && (
        <div
          style={{
            fontSize: '12px',
            opacity: 0.6,
            marginBottom: '8px',
          }}
        >
          This workflow has been {status === 'workflow_completed' ? 'completed' : status}. No
          further actions available.
        </div>
      )}

      {/* Error message */}
      {actionError && (
        <div
          style={{
            color: '#dc2626',
            fontSize: '12px',
            marginTop: '8px',
            padding: '6px 8px',
            borderRadius: '4px',
            background: 'rgba(220, 38, 38, 0.08)',
          }}
        >
          {actionError}
        </div>
      )}

      {/* Activity log */}
      {data && data.logs.length > 0 && (
        <>
          <div
            style={{
              borderTop: '1px solid var(--theme-elevation-200)',
              margin: '14px 0 10px',
            }}
          />
          <span
            style={{ fontWeight: 600, fontSize: '12px', display: 'block', marginBottom: '6px' }}
          >
            Activity
          </span>

          {data.logs.map((log: any, i: number) => (
            <div
              key={log.id || i}
              style={{
                padding: '6px 0',
                borderBottom:
                  i < data.logs.length - 1 ? '1px solid var(--theme-elevation-100)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={getBadgeStyle(log.action)}>{log.action?.replace(/_/g, ' ')}</span>
              </div>
              <div
                style={{
                  fontSize: '11px',
                  opacity: 0.5,
                  marginTop: '3px',
                }}
              >
                {log.createdAt
                  ? new Date(log.createdAt).toLocaleString()
                  : log.timestamp
                    ? new Date(log.timestamp).toLocaleString()
                    : ''}
              </div>
              {log.comment && (
                <div style={{ fontSize: '12px', marginTop: '3px', color: 'var(--theme-text)' }}>
                  {log.comment}
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  )
}

export default WorkflowPanel
