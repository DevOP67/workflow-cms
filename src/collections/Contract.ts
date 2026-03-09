import { CollectionConfig } from 'payload'

const Contract: CollectionConfig = {
  slug: 'contract',

  admin: {
    useAsTitle: 'title',
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
  ],
}

export default Contract
