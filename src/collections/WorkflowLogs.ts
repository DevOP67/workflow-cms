import { CollectionConfig } from 'payload'

const WorkflowLogs: CollectionConfig = {
  slug: 'workflowLogs',

  admin: {
    useAsTitle: 'action',
  },

  access: {
    update: () => false,
  },

  fields: [
    {
      name: 'workflowId',
      type: 'text',
      required: true,
    },
    {
      name: 'collectionSlug',
      type: 'text',
      required: true,
    },
    {
      name: 'documentId',
      type: 'text',
      required: true,
    },
    {
      name: 'stepId',
      type: 'number',
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'action',
      type: 'text',
      required: true,
    },
    {
      name: 'comment',
      type: 'textarea',
    },
    {
      name: 'timestamp',
      type: 'date',
      defaultValue: () => new Date(),
    },
  ],
}

export default WorkflowLogs
