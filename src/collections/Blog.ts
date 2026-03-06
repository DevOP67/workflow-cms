import { CollectionConfig } from 'payload'
import { triggerWorkflow } from '../hooks/triggerWorkflow'

const Blog: CollectionConfig = {
  slug: 'blog',

  admin: {
    useAsTitle: 'title',
  },

  hooks: {
    afterChange: [triggerWorkflow],
  },

  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },

    {
      name: 'content',
      type: 'textarea',
      required: true,
    },

    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'In Review', value: 'review' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
      defaultValue: 'draft',
    },

    {
      name: 'workflowStatus',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },

    {
      name: 'currentStep',
      type: 'number',
      admin: {
        readOnly: true,
      },
    },
  ],
}

export default Blog
