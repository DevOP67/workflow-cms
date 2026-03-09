'use client'

import React from 'react'
import WorkflowPanel from './WorkflowPanel'

const EditLayout = ({ children }: any) => {
  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
      }}
    >
      <div
        style={{
          flex: 1,
          paddingRight: '30px',
        }}
      >
        {children}
      </div>

      <WorkflowPanel />
    </div>
  )
}

export default EditLayout
