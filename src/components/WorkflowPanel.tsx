'use client'
import React, { useEffect, useState } from 'react'

const WorkflowPanel = ({ data, collectionSlug }: any) => {
  const [status, setStatus] = useState<any>(null)

  useEffect(() => {
    const fetchStatus = async () => {
      const res = await fetch(`/api/workflows/status/${collectionSlug}/${data?.id}`)

      const result = await res.json()

      setStatus(result)
    }

    if (data?.id) fetchStatus()
  }, [data])

  const handleAction = async (action: string) => {
    await fetch('/api/workflows/action', {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({
        collection: collectionSlug,
        documentId: data?.id,
        action: action,
      }),
    })

    window.location.reload()
  }

  if (!status) return <div>Loading workflow...</div>

  return (
    <div
      style={{
        border: '1px solid #ddd',
        padding: '16px',
        marginTop: '20px',
        borderRadius: '6px',
      }}
    >
      <h3>Workflow Progress</h3>

      <p>
        <strong>Status:</strong> {status.workflowStatus}
      </p>

      <p>
        <strong>Current Step:</strong> {status.currentStep}
      </p>

      <div style={{ marginTop: '10px' }}>
        <button onClick={() => handleAction('approve')}>Approve</button>

        <button style={{ marginLeft: '10px' }} onClick={() => handleAction('reject')}>
          Reject
        </button>
      </div>

      <h4 style={{ marginTop: '20px' }}>Audit Logs</h4>

      <ul>
        {status.logs?.map((log: any) => (
          <li key={log.id}>
            {log.action} — Step {log.stepId}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default WorkflowPanel
