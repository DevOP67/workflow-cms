'use client'
import React from 'react'

const WorkflowPanel = ({ data }: any) => {
  const handleAction = async (action: string) => {
    await fetch('/api/workflows/action', {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({
        collection: 'blog',
        documentId: data?.id,
        action: action,
      }),
    })

    window.location.reload()
  }

  return (
    <div
      style={{
        padding: '16px',
        border: '1px solid #ddd',
        marginTop: '20px',
        borderRadius: '6px',
      }}
    >
      <h3>Workflow Panel</h3>

      <p>
        <strong>Status:</strong> {data?.workflowStatus || 'Not started'}
      </p>

      <p>
        <strong>Current Step:</strong> {data?.currentStep || 0}
      </p>

      <button onClick={() => handleAction('approve')}>Approve</button>

      <button onClick={() => handleAction('reject')} style={{ marginLeft: '10px' }}>
        Reject
      </button>
    </div>
  )
}

export default WorkflowPanel
