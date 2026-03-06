import type { CollectionConfig } from 'payload'

const Workflows: CollectionConfig = {
  slug: 'workflows',

  admin: {
    useAsTitle: 'name',
  },

  fields: [
    {
      name: 'name',
      type: 'text',

      required: true,
    },

    {
      name: 'targetCollection',
      type: 'text',
      required: true,
    },

    {
      name: 'steps',
      type: 'array',
      fields: [
        {
          name: 'stepName',
          type: 'text',
          required: true,
        },
        {
          name: 'stepType',
          type: 'select',
          options: [
            { label: 'Approval', value: 'approval' },
            { label: 'Review', value: 'review' },
            { label: 'Sign Off', value: 'signoff' },
            { label: 'Comment', value: 'comment' },
          ],
        },
        {
          name: 'assignedRole',
          type: 'select',
          options: [
            { label: 'Reviewer', value: 'reviewer' },
            { label: 'Manager', value: 'manager' },
            { label: 'Legal', value: 'legal' },
          ],
        },
        {
          name: 'order',
          type: 'number',
          required: true,
        },
      ],
    },
  ],
}

export default Workflows
