import { buildConfig } from 'payload'
import { mongooseAdapter } from '@payloadcms/db-mongodb'

import Users from './collections/Users'
import Blog from './collections/Blog'
import Contract from './collections/Contract'
import Media from './collections/Media'
import Workflows from './collections/Workflows'
import WorkflowLogs from './collections/WorkflowLogs'

import { workflowPlugin } from './plugins/workflowPlugin'

export default buildConfig({
  serverURL: 'http://localhost:3000',

  admin: {
    user: Users.slug,
  },

  collections: [Users, Blog, Contract, Media, Workflows, WorkflowLogs],

  plugins: [workflowPlugin({ collections: ['blog', 'contract'] })],

  db: mongooseAdapter({
    url:
      process.env.DATABASE_URL ||
      'mongodb://hellocoder78_db_user:nADkb8IUBfBk9Zuj@database-workflow.eo9h4ug.mongodb.net/workflow-cms?retryWrites=true&w=majority',
  }),

  secret: process.env.PAYLOAD_SECRET || 'supersecret',
})
