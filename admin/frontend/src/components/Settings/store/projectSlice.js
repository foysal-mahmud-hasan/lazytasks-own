import {
    addProject,
    getAllProjects,
    getProject,
    getProjectMembers, getProjectPriorities,
    getProjectSections,
    removeProject,
    restoreFromDeleteProject,
    updateProject,
    getProjectStatuses,
} from '../../../services/ProjectService'

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

export const fetchAllProjects = createAsyncThunk(
    'projects/fetchAllProject',
    async (data) => {
        return getAllProjects(data)
    }
)

export const createProject = createAsyncThunk('projects/createProject', async (data) => {
    return addProject(data)
})


// Fetch Single User
export const fetchProject = createAsyncThunk('projects/fetchProject', async (id) => {
    return getProject(id)
})


//Edit User Thunk
export const editProject = createAsyncThunk(
    'projects/editProject',
    async ({ id, data }) => {
        return updateProject(id, data)
    }
)

// Delete Project thunk
export const deleteProject = createAsyncThunk('projects/deleteProject', async ({id, data}) => {
    return removeProject(id, data);
})

// Restore Project thunk
export const restoreProject = createAsyncThunk('projects/restoreProject', async (id) => {
    return restoreFromDeleteProject(id)
})
//Edit User Thunk
export const fetchProjectMembers = createAsyncThunk(
    'projects/fetchProjectMembers',
    async (data) => {
        return getProjectMembers(data);
    }
)

export const fetchProjectTaskSections = createAsyncThunk(
    'projects/fetchProjectTaskSections',
    async (id) => {
        return getProjectSections(id);
    }
)

export const fetchProjectPriorities = createAsyncThunk(
    'projects/fetchProjectPriorities',
    async (id) => {
        return getProjectPriorities(id);
    }
)
export const fetchProjectStatuses = createAsyncThunk(
    'projects/fetchProjectStatuses',
    async (id) => {
        return getProjectStatuses(id);
    }
)

const initialState = {
    projects: [],
    project:{},
    projectMembers:[],
    projectSections:[],
    projectPriorities:[],
    projectStatuses:[],
    isLoading: false,
    isError: false,
    error: '',
    success: null,
}

const projectSlice = createSlice({
    name: 'project',
    initialState,
    reducers: {
        setEditableProject: (state, action) => {
            state.project = state.projects.find(
                (project) => project.id === action.payload
            )
        },
        removeSuccessMessage: (state) => {
            state.success = null
        },
        emptyProjectSection: (state) => {
            state.projectSections = []
        },
        removeProjectFromState: (state,action) => {
            state.project = action.payload
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAllProjects.pending, (state) => {
                state.isLoading = true
                state.isError = false
            })
            .addCase(fetchAllProjects.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.projects = action.payload.data
            })
            .addCase(fetchAllProjects.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(createProject.pending, (state) => {
                state.isLoading = true
                state.isError = false
            })
            .addCase(createProject.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.projects.push(action.payload.data)
                state.project = action.payload.data
                state.success = `${action.payload.data.name} Created Successfully`
            })
            .addCase(createProject.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(fetchProject.pending, (state) => {
                state.isLoading = true
                state.isError = false
            })
            .addCase(fetchProject.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.project = action.payload.data
            })
            .addCase(fetchProject.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(deleteProject.pending, (state) => {
                state.isError = false
                state.isLoading = true
            })
            .addCase(deleteProject.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false

                if(action.payload.data && action.payload.data.id){
                    //remove project from state
                    state.projects = state.projects.filter(project => parseInt(project.id) !== parseInt(action.payload.data.id))
                    state.success = `${action.payload.data.name} Deleted Successfully`
                }
                // state.projects = state.projects.filter(project => parseInt(project.id) !== parseInt(action.payload.data.id))
                // state.success = `${action.payload.data.name} Deleted Successfully`

            })
            .addCase(deleteProject.rejected, (state, action) => {
                state.isLoading = false
                state.isError = true
                state.error = action.error?.message
            })
            .addCase(restoreProject.pending, (state) => {
                state.isLoading = true
                state.isError = false
            })
            .addCase(restoreProject.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                const indexToUpdate = state.projects.findIndex(
                    (project) => project.id === action.payload.data.id
                )

                state.projects[indexToUpdate] = action.payload.data
                state.success = `${action.payload.data.name} Restore Successfully`
            })
            .addCase(restoreProject.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(editProject.pending, (state) => {
                state.isLoading = true
                state.isError = false
            })
            .addCase(editProject.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                if(action.payload.data && action.payload.data.id){
                    state.projects = state.projects.map((project) => {
                        if(parseInt(project.id) === parseInt(action.payload.data.id)){
                            return action.payload.data
                        }
                        return project
                    })
                    state.project={ ...action.payload.data }
                    state.success = `${action.payload.data.name} Update Successfully`
                }
            })
            .addCase(editProject.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(fetchProjectMembers.pending, (state) => {
                state.isLoading = true
                state.isError = false
            })
            .addCase(fetchProjectMembers.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.projectMembers = action.payload && action.payload.data && action.payload.data
            })
            .addCase(fetchProjectMembers.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(fetchProjectTaskSections.pending, (state) => {
                state.isLoading = true
                state.isError = false
            })
            .addCase(fetchProjectTaskSections.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.projectSections = action.payload.data
            })
            .addCase(fetchProjectTaskSections.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(fetchProjectPriorities.pending, (state) => {
                state.isLoading = true
                state.isError = false
            })
            .addCase(fetchProjectPriorities.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.projectPriorities = action.payload.data
            })
            .addCase(fetchProjectPriorities.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(fetchProjectStatuses.pending, (state) => {
                state.isLoading = true
                state.isError = false
            })
            .addCase(fetchProjectStatuses.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.projectStatuses = action.payload.data
            })
            .addCase(fetchProjectStatuses.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
    },
})
export const {
    setEditableProject,
    removeSuccessMessage,
    removeProjectFromState,
    emptyProjectSection
} = projectSlice.actions
export default projectSlice.reducer
