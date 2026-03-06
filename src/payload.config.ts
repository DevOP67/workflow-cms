import { buildConfig } from 'payload'
import { mongooseAdapter } from '@payloadcms/db-mongodb'

import Users from './collections/Users'
import Blog from './collections/Blog'
import Contract from './collections/Contract'
import Workflows from './collections/Workflows'
import WorkflowLogs from './collections/WorkflowLogs'

import { workflowActionEndpoint } from './api/workflows'

export default buildConfig({
  serverURL: 'http://localhost:3000',

  admin: {
    user: Users.slug,
  },

  collections: [Users, Blog, Contract, Workflows, WorkflowLogs],

  endpoints: [workflowActionEndpoint],

  db: mongooseAdapter({
    url: process.env.DATABASE_URI || 'mongodb://127.0.0.1:27017/workflow-cms',
  }),

  secret: process.env.PAYLOAD_SECRET || 'supersecret',
})
