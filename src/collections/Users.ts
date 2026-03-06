import { CollectionConfig } from 'payload'

const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      defaultValue: 'reviewer',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Reviewer', value: 'reviewer' },
        { label: 'Manager', value: 'manager' },
        { label: 'Legal', value: 'legal' },
      ],
    },
  ],
}

export default Users
