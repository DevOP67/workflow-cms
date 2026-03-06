import type { CollectionConfig } from 'payload'
import { triggerWorkflow } from '../hooks/triggerWorkflow'

const Contract: CollectionConfig = {
  slug: 'contract',

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
      name: 'amount',
      type: 'number',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
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

export default Contract
