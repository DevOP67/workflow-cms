import type { CollectionConfig } from 'payload'

const Workflows: CollectionConfig = {
  slug: 'workflows',

  admin: {
    useAsTitle: 'name',
  },

  access: {
    read: () => true,
    create: ({ req: { user } }) => user?.role === 'admin',
    update: ({ req: { user } }) => user?.role === 'admin',
    delete: ({ req: { user } }) => user?.role === 'admin',
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
      admin: {
        description: 'The slug of the collection this workflow applies to (e.g. blog, contract)',
      },
    },

    {
      name: 'steps',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'stepName',
          type: 'text',
          required: true,
        },
        {
          name: 'stepType',
          type: 'select',
          required: true,
          options: [
            { label: 'Approval', value: 'approval' },
            { label: 'Review', value: 'review' },
            { label: 'Sign Off', value: 'signoff' },
            { label: 'Comment Only', value: 'comment' },
          ],
        },
        {
          name: 'assignedRole',
          type: 'select',
          options: [
            { label: 'Admin', value: 'admin' },
            { label: 'Reviewer', value: 'reviewer' },
            { label: 'Manager', value: 'manager' },
            { label: 'Legal', value: 'legal' },
          ],
          admin: {
            description: 'Role required for this step (leave blank if assigning a specific user)',
          },
        },
        {
          name: 'assignedUser',
          type: 'relationship',
          relationTo: 'users',
          admin: {
            description: 'Specific user assigned to this step (overrides role)',
          },
        },
        {
          name: 'condition',
          type: 'text',
          admin: {
            description: 'Optional condition e.g. "amount > 10000". Leave blank for unconditional.',
          },
        },
        {
          name: 'order',
          type: 'number',
          required: true,
        },
        {
          name: 'slaDays',
          type: 'number',
          admin: {
            description: 'SLA deadline in days. When exceeded, step is auto-escalated.',
          },
        },
      ],
    },
  ],
}

export default Workflows
