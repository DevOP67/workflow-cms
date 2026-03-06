import type { Plugin } from 'payload'

import {
  workflowTriggerEndpoint,
  workflowActionEndpoint,
  workflowStatusEndpoint,
} from '../api/workflows'

export const workflowPlugin: Plugin = (config) => {
  // Ensure endpoints array exists
  if (!config.endpoints) {
    config.endpoints = []
  }

  config.endpoints.push(workflowTriggerEndpoint, workflowActionEndpoint, workflowStatusEndpoint)

  return config
}
