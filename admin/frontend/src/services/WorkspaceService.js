import { AuthenticatedFetch } from 'utils/BaseFetcher'

export const getWorkspaces = async () => {
    const response = AuthenticatedFetch('/workspaces')
    return response
}

// Add New Workspace
export const addWorkspace = async (data) => {
    const response = AuthenticatedFetch('/workspaces', 'post', data)
    return response
}

// Add New Member To Single Worksapce
export const addWorkspaceMember = async (id, data) => {
    const response = AuthenticatedFetch(`/workspaces/${id}`, 'put', data)
    return response
}

// Edit Workspace Name
export const editWorkspaceName = async (id, data) => {
    const response = AuthenticatedFetch(`/workspaces/${id}`, 'put', data)
    return response
}
// Edit Workspace Description
export const editWorkspaceDescription = async (id, data) => {
    const response = AuthenticatedFetch(`/workspaces/${id}`, 'put', data)
    return response
}

// Remove Workpsace

export const removeWorkspace = async (id) => {
    const response = AuthenticatedFetch(`/workspaces/${id}`, 'delete')
    return response
}
