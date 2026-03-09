import type { Plugin, CollectionConfig } from 'payload'

import {
  workflowTriggerEndpoint,
  workflowActionEndpoint,
  workflowStatusEndpoint,
} from '../api/workflows'
import { triggerWorkflow } from '../hooks/triggerWorkflow'

/**
 * Workflow Plugin
 *
 * Automatically:
 * 1. Registers workflow API endpoints
 * 2. Injects workflow fields (workflowStatus, currentStep) into target collections
 * 3. Injects the afterChange hook for auto-triggering workflows
 * 4. Injects the WorkflowSidebar UI component into the edit view sidebar
 *
 * Usage:
 *   plugins: [workflowPlugin({ collections: ['blog', 'contract'] })]
 */
interface WorkflowPluginConfig {
  /** Collection slugs to enable workflows on */
  collections: string[]
}

export const workflowPlugin =
  (options: WorkflowPluginConfig): Plugin =>
  (config) => {
    // Inject API endpoints
    if (!config.endpoints) config.endpoints = []
    config.endpoints.push(workflowTriggerEndpoint, workflowActionEndpoint, workflowStatusEndpoint)

    // Inject workflow fields and hooks into specified collections
    config.collections = (config.collections || []).map((collection): CollectionConfig => {
      if (!options.collections.includes(collection.slug)) return collection

      const hasWorkflowStatus = collection.fields?.some((f: any) => f.name === 'workflowStatus')

      const workflowFields = hasWorkflowStatus
        ? []
        : [
            {
              name: 'workflowStatus' as const,
              type: 'text' as const,
              admin: { readOnly: true, hidden: true },
            },
            {
              name: 'currentStep' as const,
              type: 'number' as const,
              admin: { readOnly: true, hidden: true },
            },
            {
              name: 'workflowSidebar' as const,
              type: 'ui' as const,
              admin: {
                position: 'sidebar' as const,
                components: {
                  Field: { path: '@/components/WorkflowSidebar' },
                },
              },
            },
          ]

      const existingAfterChange = collection.hooks?.afterChange || []
      const hasTriggerHook = existingAfterChange.some(
        (h: any) => h === triggerWorkflow || h.name === 'triggerWorkflow',
      )

      return {
        ...collection,
        fields: [...(collection.fields || []), ...workflowFields],
        hooks: {
          ...collection.hooks,
          afterChange: hasTriggerHook
            ? existingAfterChange
            : [...existingAfterChange, triggerWorkflow],
        },
      }
    })

    return config
  }
