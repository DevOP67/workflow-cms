import { headers as getHeaders } from 'next/headers.js'
import Image from 'next/image'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'
import './styles.css'

export default async function HomePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  return (
    <div className="home">
      <div className="content">
        <div className="logo">
          <Image
            alt="Workflow CMS"
            height={40}
            src="https://raw.githubusercontent.com/payloadcms/payload/main/packages/ui/src/assets/payload-favicon.svg"
            width={40}
          />
        </div>

        <div className="headline">
          <h1>Workflow CMS</h1>
          <p className="subtitle">
            {user
              ? `Welcome back, ${user.email}`
              : 'AI-powered dynamic workflow engine with multi-step approvals and real-time status tracking'}
          </p>
        </div>

        <div className="buttons">
          <a
            className="btn btn-primary"
            href={payloadConfig.routes.admin}
            rel="noopener noreferrer"
            target="_blank"
          >
            <span>→</span> Go to Admin Panel
          </a>
          <a
            className="btn btn-secondary"
            href="https://payloadcms.com/docs"
            rel="noopener noreferrer"
            target="_blank"
          >
            📖 Documentation
          </a>
        </div>
      </div>
    </div>
  )
}
