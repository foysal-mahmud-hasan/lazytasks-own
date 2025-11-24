
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import {
    addAttachments,
    addComments,
    addProjectPriority,
    addProjectStatus,
    removeProjectStatus,
    updateProjectStatusSortOrder,
    addTask,
    addTaskSection,
    assignTagToTask, attachmentsUpload,
    getTask,
    getTaskListsByProject,
    markIsCompleteTaskSection,
    archiveSectionAllTask,
    taskArchive,
    getArchivedTasks,
    removeTaskArchive,
    taskComplete,
    convertToTask,
    changeTaskPrivacy,
    copyTask,
    copyTaskSection,
    removeAttachments,
    removeComments, removeProjectPriority, updateProjectPrioritySortOrder,
    removeTagFromTask,
    removeTask,
    removeTaskSection,
    updateSectionSortOrder,
    updateTask,
    updateTaskSection,
    updateTaskSortOrder, wpRemoveAttachments, updateGanttTaskSortOrder,
    getTaskCounts, getGanttTaskListsByProject, getProjectOverview, getTaskListsBySection,
    getTaskListsByPriority,
    getTaskListsByStatus,
    getTaskListsByMember,
    getTaskListsByDueDate,
    updateProjectNav,
    getMembersTasksCounts,
    getProjectsPieChartsData,
    getUserActivities,
    taskInComplete,
    projectArchive,
    projectUnarchive,
    toggoleSectionAllTaskToGantt
} from "../../../services/TaskService";
import { act } from 'react';

export const fetchProjectOverview = createAsyncThunk(
    'tasks/fetchProjectOverview',
    async (id) => {
        return getProjectOverview(id)
    }
)

export const archiveProject = createAsyncThunk(
    'projects/archiveProject',
    async ({ id, data }) => {
        return projectArchive(id, data);
    }
)

export const unarchiveProject = createAsyncThunk(
    'projects/unarchiveProject',
    async ({ id, data }) => {
        return projectUnarchive(id, data);
    }
)

export const editProjectNav = createAsyncThunk(
    'projects/editProjectNav',
    async ({ id, data }) => {
        return updateProjectNav(id, data)
    }
)

export const fetchTasksByProject = createAsyncThunk(
    'tasks/fetchTasksByProject',
    async ({ id, data, userId }) => {
        const response = await getTaskListsByProject(id, data);
        return { ...response, userId };
    }
)

export const fetchTasksBySection = createAsyncThunk(
    'tasks/fetchTasksBySection',
    async ({ projectId, sectionSlug, limit = 10, offset = 0, append = false, userId }) => {
        // return await getTaskListsBySection(projectId, sectionSlug, limit = 10, offset = 0, append = false)
        const response = await getTaskListsBySection(projectId, sectionSlug, limit, offset);
    
        return {
            ...response,
            data: {
                ...response.data,
                sectionSlug,
                append,
                limit,
                userId,
            },
        };
    }
)

export const fetchTasksByPriority = createAsyncThunk(
    'tasks/fetchTasksByPriority',
    async ({ projectId, priorityId, prioritySlug, limit = 10, offset = 0, append = false, userId }) => {
        const response = await getTaskListsByPriority(projectId, priorityId, prioritySlug, limit, offset);
    
        return {
            ...response,
            data: {
                ...response.data,
                priorityId: priorityId ?? 'no-priority',
                prioritySlug: prioritySlug ?? 'no-priority',
                append,
                limit,
                userId,
            },
        };
    }
)

export const fetchTasksByStatus = createAsyncThunk(
    'tasks/fetchTasksByStatus',
    async ({ projectId, statusId, statusSlug, limit = 10, offset = 0, append = false, userId }) => {
        const response = await getTaskListsByStatus(projectId, statusId, statusSlug, limit, offset);
    
        return {
            ...response,
            data: {
                ...response.data,
                statusId: statusId ?? 'no-status',
                statusSlug: statusSlug ?? 'no-status',
                append,
                limit,
                userId,
            },
        };
    }
)

export const fetchTasksByMember = createAsyncThunk(
    'tasks/fetchTasksByMember',
    async ({ projectId, memberId, limit = 10, offset = 0, append = false, userId }) => {
        const response = await getTaskListsByMember(projectId, memberId, limit, offset);
    
        return {
            ...response,
            data: {
                ...response.data,
                memberId: memberId ?? 'no-assigned',
                append,
                limit,
                userId,
            },
        };
    }
)

export const fetchTasksByDueDate = createAsyncThunk(
    'tasks/fetchTasksByDueDate',
    async ({ projectId, dateType, limit = 10, offset = 0, append = false, userId }) => {
        const response = await getTaskListsByDueDate(projectId, dateType, limit, offset);
    
        return {
            ...response,
            data: {
                ...response.data,
                dateType,
                append,
                limit,
                userId,
            },
        };
    }
)

export const fetchGanttTasksByProject = createAsyncThunk(
    'tasks/fetchGanttTasksByProject',
    async ({ id, data }) => {
        return getGanttTaskListsByProject(id, data)
    }
)

export const createTask = createAsyncThunk('tasks/createTask', async (data) => {
    return addTask(data)
})

//Edit task Thunk
export const editTask = createAsyncThunk(
    'tasks/editTask',
    async ({ id, data }) => {
        return updateTask(id, data)
    }
)

export const editTaskSortOrder = createAsyncThunk(
    'tasks/editTaskSortOrder',
    async ({data}) => {
        return updateTaskSortOrder(data)
    })

export const editGanttTaskSortOrder = createAsyncThunk(
    'tasks/editGanttTaskSortOrder',
    async ({data}) => {
        return updateGanttTaskSortOrder(data)
    })
export const createTaskSection = createAsyncThunk('tasks/createTaskSection', async (data) => {
    return addTaskSection(data)
})

export const createProjectPriority = createAsyncThunk('tasks/createProjectPriority', async (data) => {
    return addProjectPriority(data)
})

export const deleteProjectPriority = createAsyncThunk('tasks/deleteProjectPriority', async ({data}) => {
    return removeProjectPriority(data)
})

export const editProjectPrioritySortOrder = createAsyncThunk('tasks/editProjectPrioritySortOrder', async ({data}) => {
    return updateProjectPrioritySortOrder(data);
})

export const createProjectStatus = createAsyncThunk('tasks/createProjectStatus', async (data) => {
    return addProjectStatus(data);
})

export const deleteProjectStatus = createAsyncThunk('tasks/deleteProjectStatus', async ({data}) => {
    return removeProjectStatus(data)
})

export const editProjectStatusSortOrder = createAsyncThunk('tasks/editProjectStatusSortOrder', async ({data}) => {
    return updateProjectStatusSortOrder(data);
})

export const editTaskSection = createAsyncThunk(
    'tasks/updateTaskSection',
    async ({id, data}) => {
    return updateTaskSection(id, data)
})

export const markIsCompletedTaskSection = createAsyncThunk(
    'tasks/markIsCompletedTaskSection',
    async ({id, data}) => {
    return markIsCompleteTaskSection(id, data)
})

export const archiveSectionTask = createAsyncThunk(
    'tasks/archiveSectionTask',
    async ({id, data}) => {
    return archiveSectionAllTask(id, data)
})

export const archiveTask = createAsyncThunk(
    'tasks/archiveTask',
    async ({id, data}) => {
    return taskArchive(id, data)
})

export const unarchiveTask = createAsyncThunk(
    'tasks/unarchiveTask',
    async ({id, data}) => {
    return removeTaskArchive(id, data)
})

export const completeTask = createAsyncThunk(
    'tasks/completeTask',
    async ({id,data}) => {
    return taskComplete(id,data)
})

export const inCompleteTask = createAsyncThunk(
    'tasks/inCompleteTask',
    async ({id,data}) => {
    return taskInComplete(id,data)
})

export const convertTask = createAsyncThunk(
    'tasks/convertTask',
    async ({id,data}) => {
        console.log(id, data);
    return convertToTask(id,data)
})

export const changeTaskVisibility = createAsyncThunk(
    'tasks/changeTaskVisibility',
    async ({id,data}) => {
        console.log(id, data);
    return changeTaskPrivacy(id,data)
})

export const duplicateTask = createAsyncThunk(
    'tasks/duplicateTask',
    async ({id,data}) => {
    return copyTask(id,data)
})

export const duplicateTaskSection = createAsyncThunk(
    'tasks/duplicateTaskSection',
    async ({id,data}) => {
    return copyTaskSection(id,data)
})

export const toggoleAllTaskToGantt = createAsyncThunk(
    'tasks/toggoleAllTaskToGantt',
    async ({id,data}) => {
    return toggoleSectionAllTaskToGantt(id,data)
})

export const fetchArchiveTasks = createAsyncThunk(
    'tasks/fetchArchiveTasks',
    async () => {
    return getArchivedTasks()
})

export const deleteTaskSection = createAsyncThunk(
    'tasks/deleteTaskSection',
    async ({id, data}) => {
    return removeTaskSection(id, data)
})

export const editSectionSortOrder = createAsyncThunk(
    'tasks/editSectionSortOrder',
    async ({data}) => {
    return updateSectionSortOrder(data)
})

export const createComment = createAsyncThunk('tasks/createComment', async (data) => {
    return addComments(data)
})


export const deleteComment = createAsyncThunk(
    'tasks/deleteComment',
    async ({ id, data}) => {
        return removeComments(id, data)
})

export const createAttachment = createAsyncThunk('tasks/createAttachment', async ({data}) => {
    return addAttachments(data)
})

export const uploadAttachments = createAsyncThunk('tasks/uploadAttachments', async ({data}) => {
    return attachmentsUpload(data)
})

export const deleteAttachment = createAsyncThunk(
    'tasks/deleteAttachment',
    async ({ id, data}) => {
    return removeAttachments(id, data)
})

export const wpDeleteAttachment = createAsyncThunk(
    'tasks/removeAttachment',
    async ({ id, data}) => {
    return wpRemoveAttachments(id)
})

export const addTagToTask = createAsyncThunk('tasks/addTagToTask', async (data) => {
    return assignTagToTask(data)
})
export const deleteTagFromTask = createAsyncThunk('tasks/deleteTagFromTask', async (data) => {
    return removeTagFromTask(data)
})

export const fetchTask = createAsyncThunk(
    'tasks/fetchTask',
    async ({ id }) => {
        return getTask(id)
    }
)

export const deleteTask = createAsyncThunk(
    'tasks/deleteTask',
    async ({ id, data }) => {
        return removeTask(id, data)
    }
)

export const fetchTaskCounts = createAsyncThunk(
    'tasks/fetchTaskCounts',
    async () => {
        return getTaskCounts()
    }
)

export const fetchMembersTasksCounts = createAsyncThunk(
    'tasks/fetchMembersTasksCounts',
    async ({id}) => {
        return getMembersTasksCounts(id)
    }
)

export const fetchProjectsPieChartsData = createAsyncThunk(
    'tasks/fetchProjectsPieChartsData',
    async ({id}) => {
        return getProjectsPieChartsData(id)
    }
)

export const fetchUserActivities = createAsyncThunk(
    'tasks/fetchUserActivities',
    async ({id}) => {
        return getUserActivities(id)
    }
)

const initialState = {
    tasks: [],
    allTasks: [],
    ganttTasks: [],
    archivedTasks: [],
    archivedSections: [],
    task:{},
    projectInfo: {},
    taskListSections: {},
    addedListSections: {},
    columns: {},
    reload : false,
    childColumns: {},
    ordered: [],
    boardMembers: [],
    projectPriorities: [],
    projectStatuses: [],
    projectNavbar: [],
    comment:{},
    attachments:[],
    uploadsAttachment:[],
    attachment:{},
    taskTags:[],
    isLoading: false,
    isError: false,
    error: '',
    success: null,
    addTaskDrawerOpen: false,
    projectId: null,
    taskSectionId: null,
    taskEditDrawerOpen: false,
    ganttViewMode: 'Day',
    taskCount: {},
    filterValues: {
        name: '',
        section_id: null,
        assigned_to: null,
        priority_id: null,
        internal_status_id: null,
        due_date: null,
        date_type: null,
    },
    loadedSections: {},
    loadingSections: {},
    buttonLoadingSections: {},
    membersTasksCounts: [],
    pieChartData: [],
    userActivities: {},
    accordianExpandedItems: [],
    loadedPriority: {},
    loadingPriority: {},
    buttonLoadingPriority: {},
    loadedStatus: {},
    loadingStatus: {},
    buttonLoadingStatus: {},
    loadedMember: {},
    loadingMember: {},
    buttonLoadingMember: {},
    loadedDueDate: {},
    loadingDueDate: {},
    buttonLoadingDueDate: {},
    groupByDateLabels: [
        { key: 'today', label: 'Today' },
        { key: 'next_seven_days', label: 'Next 7 Days' },
        { key: 'overdue', label: 'Overdue' },
        { key: 'upcoming', label: 'Upcoming' },
        { key: 'no-date', label: 'No Due Date' },
    ]
}

const taskSlice = createSlice({
    name: 'task',
    initialState,
    reducers: {
        initialTask: (state) => {
            state.task= {}
        },
        updateOrdered: (state, action) => {
            state.ordered = action.payload
        },
        updateColumns: (state, action) => {
            state.columns = action.payload
            // console.log(action.payload)
        },
        updateChildColumns: (state, action) => {
            state.childColumns = action.payload
            // console.log(action.payload)
        },
        updateProjectPriorities: (state, action) => {
            state.projectPriorities = action.payload
            // console.log(action.payload)
        },
        setEditableTask: (state, action) => {
            /*state.task = state.tasks.find(
                (task) => task.id === action.payload
            )*/

            if(action.payload && action.payload.section_slug && action.payload.parent===null){
                Object.entries(state.columns).forEach(([key, tasks]) => {
                    if (key === action.payload.section_slug) {
                        state.columns[key] = tasks.map(task =>
                            task.id === action.payload.id ? action.payload : {...task}
                        );
                    }
                });
            }

            // for sub task
            if (action.payload && action.payload.section_slug && action.payload.parent && action.payload.parent.slug) {
                Object.entries(state.childColumns).forEach(([key, tasks]) => {
                    if (key === action.payload.parent.slug) {
                        state.childColumns[key] = tasks.map(task =>
                            task.id === action.payload.id ? action.payload : {...task}
                        );
                    }
                });
            }

            state.task = action.payload
            /*Object.entries(state.columns).forEach(([key, tasks]) => {
                if (key === action.payload.section_slug) {
                    state.columns[key] = tasks.map(task =>
                        task.id === action.payload.id ? action.payload : task
                    );
                }
            });*/

        },
        updateTaskListSections: (state, action) => {
            state.taskListSections = action.payload
        },
        removeSuccessMessage: (state) => {
            state.success = null
        },
        removeProjectFromState: (state,action) => {
            state.task = action.payload
        },
        updateBoardMembers: (state, action) => {
            state.boardMembers = action.payload
        },
        //update is loading
        updateIsLoading: (state, action) => {
            state.isLoading = action.payload
        },
        openAddTaskDrawer: (state, action) => {
            const { projectId, projectInfo, sectionId } = action.payload;

            state.addTaskDrawerOpen = true;
            state.projectId = projectId;
            state.taskSectionId = sectionId;
        },
        closeAddTaskDrawer: (state) => {
            state.addTaskDrawerOpen = false;
            state.projectId = null;
            state.taskSectionId = null;
        },
        openTaskEditDrawer: (state) => {
            state.taskEditDrawerOpen = true;
        },
        closeTaskEditDrawer: (state) => {
            state.taskEditDrawerOpen = false;
        },
        //change ganttViewMode
        changeGanttViewMode: (state, action) => {
            state.ganttViewMode = action.payload
        },
        // save filter values
        updateFilterValues: (state, action) => {
            state.filterValues = action.payload
        },
        // reset filter values
        resetFilterValues: (state) => {
            state.filterValues = {
                name: '',
                section_id: null,
                assigned_to: null,
                priority_id: null,
                internal_status_id: null,
                due_date: null,
                date_type: null,
            };
        },
        updateExpandedItems: (state, action) => {
            state.accordianExpandedItems = action.payload; // Update expanded items
        },

    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchTasksByProject.pending, (state) => {
                // state.isLoading = true
                state.isError = false
            })
            .addCase(fetchTasksByProject.fulfilled, (state, action) => {
                const loggedUserId = action.payload.userId;
                state.isLoading = false
                state.isError = false
                state.tasks = action.payload.data
                state.projectInfo = action.payload.data && action.payload.data.projectInfo? action.payload.data.projectInfo:{}
                state.taskListSections = action.payload.data && action.payload.data.taskListSectionsName ? action.payload.data.taskListSectionsName : {}
                state.ordered = action.payload.data && action.payload.data.taskSections ? action.payload.data.taskSections : []
                // state.columns = action.payload.data && action.payload.data.tasks ? action.payload.data.tasks : {}
                state.childColumns = action.payload.data && action.payload.data.childTasks ? action.payload.data.childTasks : {}
                state.boardMembers = action.payload.data && action.payload.data.projectInfo && action.payload.data.projectInfo.members ? action.payload.data.projectInfo.members:[]
                state.projectPriorities = action.payload.data && action.payload.data.projectPriorities && action.payload.data.projectPriorities.length > 0 ? action.payload.data.projectPriorities:[]
                state.projectStatuses = action.payload.data && action.payload.data.projectStatuses && action.payload.data.projectStatuses.length > 0 ? action.payload.data.projectStatuses:[]
                state.allTasks = action.payload.data && action.payload.data.allTasks ? action.payload.data.allTasks:[]
                state.projectNavbar = action.payload.data && action.payload.data.projectNavbar ? action.payload.data.projectNavbar:[];

                const allTasks = action.payload.data.tasks || {};

                const filteredTasks = {};
                Object.entries(allTasks).forEach(([sectionId, tasks]) => {
                    filteredTasks[sectionId] = tasks.filter(task =>
                        task.taskPrivacy === 'public' ||
                        (task.taskPrivacy === 'private' && task.createdBy_id == loggedUserId)
                    );
                });

                state.columns = filteredTasks;
                
            })
            .addCase(fetchTasksByProject.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(fetchProjectOverview.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
            })
            .addCase(fetchProjectOverview.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isError = false;
                const data = action.payload.data;
                state.projectInfo = action.payload.data && action.payload.data.projectInfo? action.payload.data.projectInfo:{}
                state.taskListSections = action.payload.data && action.payload.data.taskListSectionsName ? action.payload.data.taskListSectionsName : {}
                state.ordered = action.payload.data && action.payload.data.taskSections ? action.payload.data.taskSections : []
                state.boardMembers = action.payload.data && action.payload.data.projectInfo && action.payload.data.projectInfo.members ? action.payload.data.projectInfo.members:[]
                state.projectPriorities = action.payload.data && action.payload.data.projectPriorities && action.payload.data.projectPriorities.length > 0 ? action.payload.data.projectPriorities:[]
                state.projectStatuses = action.payload.data && action.payload.data.projectStatuses && action.payload.data.projectStatuses.length > 0 ? action.payload.data.projectStatuses:[]
                state.projectNavbar = action.payload.data && action.payload.data.projectNavbar ? action.payload.data.projectNavbar:[]
                // state.groupByDateLabels = action.payload.data && action.payload.data.groupByDueDate ? action.payload.data.groupByDueDate:[]
            })
            .addCase(fetchProjectOverview.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.error = action.error?.message;
            })
            .addCase(archiveProject.pending, (state) => {
                // state.isLoading = true;
                state.isError = false;
            })
            .addCase(archiveProject.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isError = false;
                state.projectInfo = action.payload && action.payload.projectInfo ? action.payload.projectInfo:{}
            })
            .addCase(archiveProject.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.error = action.error?.message;
            })
            .addCase(unarchiveProject.pending, (state) => {
                // state.isLoading = true;
                state.isError = false;
            })
            .addCase(unarchiveProject.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isError = false;
                state.projectInfo = action.payload && action.payload.projectInfo ? action.payload.projectInfo:{}
            })
            .addCase(unarchiveProject.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.error = action.error?.message;
            })
            .addCase(editProjectNav.pending, (state, action) => {
                // state.isLoading = true;
                state.isError = false;
            })
            .addCase(editProjectNav.fulfilled, (state, action) => {
                // state.isLoading = false;
                state.isError = false;
                const data = action.payload.data;
                state.projectNavbar = action.payload.data && action.payload.data.navbar ? action.payload.data.navbar:[]
            })
            .addCase(editProjectNav.rejected, (state, action) => {
                // state.isLoading = false;
                state.isError = true;
                state.error = action.error?.message;
            })
            .addCase(fetchTasksBySection.pending, (state, action) => {
                state.isError = false;
                const { sectionSlug, append } = action.meta.arg;
                if (append) {
                    state.buttonLoadingSections[sectionSlug] = true;
                } else {
                    state.loadingSections[sectionSlug] = true;
                }
            })
            .addCase(fetchTasksBySection.fulfilled, (state, action) => {
                const { sectionSlug, tasks, childTasks, append, limit, hasMore, userId } = action.payload.data;
                // Filter tasks
                const filteredTasks = tasks.filter(task =>
                    task.taskPrivacy === 'public' ||
                    (task.taskPrivacy === 'private' && task.createdBy_id == userId)
                );
                
                if (append) {
                    state.buttonLoadingSections[sectionSlug] = false;
                } else {
                    state.loadingSections[sectionSlug] = false;
                }

                if (append) {
                    if (filteredTasks.length > 0) {
                    //     state.columns[sectionSlug] = [];
                    // }else{
                        if (!state.columns[sectionSlug]) {
                            state.columns[sectionSlug] = [];
                        }
                        // state.columns[sectionSlug].push(...tasks);
                        const existingIds = new Set(state.columns[sectionSlug].map(task => task.id));
                        const uniqueNewTasks = filteredTasks.filter(task => !existingIds.has(task.id));
                        state.columns[sectionSlug].push(...uniqueNewTasks);
                    }
                } else {
                    state.columns[sectionSlug] = filteredTasks;
                }

                state.childColumns = {
                ...state.childColumns,
                ...childTasks,
                };

                const prevOffset = state.loadedSections[sectionSlug]?.offset || 0;
                
                state.loadedSections[sectionSlug] = {
                    offset: append ? prevOffset + tasks.length : tasks.length,
                    hasMore: hasMore,
                };
            })
            .addCase(fetchTasksBySection.rejected, (state, action) => {
                const { sectionSlug, append } = action.meta.arg;
                if (append) {
                    state.buttonLoadingSections[sectionSlug] = false;
                } else {
                    state.loadingSections[sectionSlug] = false;
                }
                state.isError = true;
                state.error = action.error?.message;
            })
            .addCase(fetchTasksByPriority.pending, (state, action) => {
                state.isError = false;
                const { priorityId, prioritySlug, append } = action.meta.arg;
                const key = prioritySlug ?? 'no-priority';
                if (append) {
                    state.buttonLoadingPriority[key] = true;
                } else {
                    state.loadingPriority[key] = true;
                }
            })
            .addCase(fetchTasksByPriority.fulfilled, (state, action) => {
                const { priorityId, prioritySlug, tasks, childTasks, append, limit, hasMore, userId } = action.payload.data;
                const key = prioritySlug === 'no-priority' ? 'no-priority' : prioritySlug;
                // Filter tasks
                const filteredTasks = tasks.filter(task =>
                    task.taskPrivacy === 'public' ||
                    (task.taskPrivacy === 'private' && task.createdBy_id == userId)
                );
                
                if (append) {
                    state.buttonLoadingPriority[key] = false;
                } else {
                    state.loadingPriority[key] = false;
                }

                if (append) {
                    if (filteredTasks.length > 0) {
                    //     state.columns[sectionSlug] = [];
                    // }else{
                        if (!state.columns[key]) {
                            state.columns[key] = [];
                        }
                        // state.columns[sectionSlug].push(...tasks);
                        const existingIds = new Set(state.columns[key].map(task => task.id));
                        const uniqueNewTasks = filteredTasks.filter(task => !existingIds.has(task.id));
                        state.columns[key].push(...uniqueNewTasks);
                    }
                } else {
                    state.columns[key] = filteredTasks;
                }

                state.childColumns = {
                ...state.childColumns,
                ...childTasks,
                };

                const prevOffset = state.loadedPriority[key]?.offset || 0;
                
                state.loadedPriority[key] = {
                    offset: append ? prevOffset + tasks.length : tasks.length,
                    hasMore: hasMore,
                };
            })
            .addCase(fetchTasksByPriority.rejected, (state, action) => {
                const { priorityId, prioritySlug, append } = action.meta.arg;
                const key = prioritySlug ?? 'no-priority';
                if (append) {
                    state.buttonLoadingPriority[key] = false;
                } else {
                    state.loadingPriority[key] = false;
                }
                state.isError = true;
                state.error = action.error?.message;
            })
            .addCase(fetchTasksByStatus.pending, (state, action) => {
                state.isError = false;
                const { statusId, statusSlug, append } = action.meta.arg;
                const key = statusSlug ?? 'no-status';
                if (append) {
                    state.buttonLoadingStatus[key] = true;
                } else {
                    state.loadingStatus[key] = true;
                }
            })
            .addCase(fetchTasksByStatus.fulfilled, (state, action) => {
                const { statusId, statusSlug, tasks, childTasks, append, limit, hasMore, userId } = action.payload.data;
                const key = statusSlug ?? 'no-status';
                // Filter tasks
                const filteredTasks = tasks.filter(task =>
                    task.taskPrivacy === 'public' ||
                    (task.taskPrivacy === 'private' && task.createdBy_id == userId)
                );
                
                if (append) {
                    state.buttonLoadingStatus[key] = false;
                } else {
                    state.loadingStatus[key] = false;
                }

                if (append) {
                    if (filteredTasks.length > 0) {
                    //     state.columns[sectionSlug] = [];
                    // }else{
                        if (!state.columns[key]) {
                            state.columns[key] = [];
                        }
                        // state.columns[sectionSlug].push(...tasks);
                        const existingIds = new Set(state.columns[key].map(task => task.id));
                        const uniqueNewTasks = filteredTasks.filter(task => !existingIds.has(task.id));
                        state.columns[key].push(...uniqueNewTasks);
                    }
                } else {
                    state.columns[key] = filteredTasks;
                }

                state.childColumns = {
                ...state.childColumns,
                ...childTasks,
                };

                const prevOffset = state.loadedStatus[key]?.offset || 0;
                
                state.loadedStatus[key] = {
                    offset: append ? prevOffset + tasks.length : tasks.length,
                    hasMore: hasMore,
                };
            })
            .addCase(fetchTasksByStatus.rejected, (state, action) => {
                const { statusId, statusSlug, append } = action.meta.arg;
                const key = w ?? 'no-status';
                if (append) {
                    state.buttonLoadingStatus[key] = false;
                } else {
                    state.loadingStatus[key] = false;
                }
                state.isError = true;
                state.error = action.error?.message;
            })
            .addCase(fetchTasksByMember.pending, (state, action) => {
                state.isError = false;
                const { memberId, append } = action.meta.arg;
                const key = memberId ?? 'no-assigned';
                if (append) {
                    state.buttonLoadingMember[key] = true;
                } else {
                    state.loadingMember[key] = true;
                }
            })
            .addCase(fetchTasksByMember.fulfilled, (state, action) => {
                const { memberId, tasks, childTasks, append, limit, hasMore, userId } = action.payload.data;
                const key = memberId ?? 'no-assigned';
                // Filter tasks
                const filteredTasks = tasks.filter(task =>
                    task.taskPrivacy === 'public' ||
                    (task.taskPrivacy === 'private' && task.createdBy_id == userId)
                );
                
                if (append) {
                    state.buttonLoadingMember[key] = false;
                } else {
                    state.loadingMember[key] = false;
                }

                if (append) {
                    if (filteredTasks.length > 0) {
                    //     state.columns[sectionSlug] = [];
                    // }else{
                        if (!state.columns[key]) {
                            state.columns[key] = [];
                        }
                        // state.columns[sectionSlug].push(...tasks);
                        const existingIds = new Set(state.columns[key].map(task => task.id));
                        const uniqueNewTasks = filteredTasks.filter(task => !existingIds.has(task.id));
                        state.columns[key].push(...uniqueNewTasks);
                    }
                } else {
                    state.columns[key] = filteredTasks;
                }

                state.childColumns = {
                ...state.childColumns,
                ...childTasks,
                };

                const prevOffset = state.loadedMember[key]?.offset || 0;
                
                state.loadedMember[key] = {
                    offset: append ? prevOffset + tasks.length : tasks.length,
                    hasMore: hasMore,
                };
            })
            .addCase(fetchTasksByMember.rejected, (state, action) => {
                const { memberId, append } = action.meta.arg;
                const key = memberId ?? 'no-assigned';
                if (append) {
                    state.buttonLoadingMember[key] = false;
                } else {
                    state.loadingMember[key] = false;
                }
                state.isError = true;
                state.error = action.error?.message;
            })
            .addCase(fetchTasksByDueDate.pending, (state, action) => {
                state.isError = false;
                const { dateType, append } = action.meta.arg;
                if (append) {
                    state.buttonLoadingDueDate[dateType] = true;
                } else {
                    state.loadingDueDate[dateType] = true;
                }
            })
            .addCase(fetchTasksByDueDate.fulfilled, (state, action) => {
                const { dateType, tasks, childTasks, append, limit, hasMore, userId } = action.payload.data;
                // Filter tasks
                const filteredTasks = tasks.filter(task =>
                    task.taskPrivacy === 'public' ||
                    (task.taskPrivacy === 'private' && task.createdBy_id == userId)
                );
                
                if (append) {
                    state.buttonLoadingDueDate[dateType] = false;
                } else {
                    state.loadingDueDate[dateType] = false;
                }

                if (append) {
                    if (filteredTasks.length > 0) {
                    //     state.columns[sectionSlug] = [];
                    // }else{
                        if (!state.columns[dateType]) {
                            state.columns[dateType] = [];
                        }
                        // state.columns[sectionSlug].push(...tasks);
                        const existingIds = new Set(state.columns[dateType].map(task => task.id));
                        const uniqueNewTasks = filteredTasks.filter(task => !existingIds.has(task.id));
                        state.columns[dateType].push(...uniqueNewTasks);
                    }
                } else {
                    state.columns[dateType] = filteredTasks;
                }

                state.childColumns = {
                ...state.childColumns,
                ...childTasks,
                };

                const prevOffset = state.loadedDueDate[dateType]?.offset || 0;
                
                state.loadedDueDate[dateType] = {
                    offset: append ? prevOffset + tasks.length : tasks.length,
                    hasMore: hasMore,
                };
            })
            .addCase(fetchTasksByDueDate.rejected, (state, action) => {
                const { dateType, append } = action.meta.arg;
                if (append) {
                    state.buttonLoadingDueDate[dateType] = false;
                } else {
                    state.loadingDueDate[dateType] = false;
                }
                state.isError = true;
                state.error = action.error?.message;
            })
            .addCase(fetchGanttTasksByProject.pending, (state) => {
                state.isError = false
            })
            .addCase( fetchGanttTasksByProject.fulfilled, (state, action) => {
                state.projectInfo = action.payload.data && action.payload.data.projectInfo? action.payload.data.projectInfo:{}
                state.boardMembers = action.payload.data && action.payload.data.projectInfo && action.payload.data.projectInfo.members ? action.payload.data.projectInfo.members:[]
                // state.ganttTasks = action.payload.data.ganttTasks || [];
                if (action.meta.arg.data?.offset > 0) {
                    state.ganttTasks = [...state.ganttTasks, ...action.payload.data.ganttTasks];
                } else {
                    state.ganttTasks = action.payload.data.ganttTasks || [];
                }
                state.projectNavbar = action.payload.data && action.payload.data.projectNavbar ? action.payload.data.projectNavbar:[];

            })
            .addCase(fetchGanttTasksByProject.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })

            .addCase(fetchTask.pending, (state) => {
                // state.isLoading = true
                state.isError = false
            })
            .addCase(fetchTask.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.task = action.payload.data
            })
            .addCase(fetchTask.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(createTask.pending, (state) => {
                // state.isLoading = true
                state.isError = false
            })
            .addCase(createTask.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                // for task
                if(action.payload.data && action.payload.data.section_slug && action.payload.data.parent===null){
                    Object.entries(state.columns).findIndex(([key, value]) => {
                        if (key === action.payload.data.section_slug) {
                            state.columns[key].push(action.payload.data)
                        }
                    })
                }

                // for sub task
                if (action.payload.data && action.payload.data.section_slug && action.payload.data.parent && action.payload.data.parent.slug) {
                    let keyExist = Object.keys(state.childColumns).some(key => key === action.payload.data.parent.slug);

                    if (!keyExist) {
                        state.childColumns[action.payload.data.parent.slug] = [action.payload.data]
                    }else {
                        state.childColumns[action.payload.data.parent.slug].push(action.payload.data)
                    }
                }

                //task added push allTasks
                if (action.payload.data && action.payload.data.id) {
                    state.allTasks[action.payload.data.id] = action.payload.data

                    state.ganttTasks.push(action.payload.data);
                }
                //state.ganttTasks

                state.success = `Task Created Successfully`
            })
            .addCase(createTask.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(editTask.pending, (state) => {
                // state.isLoading = true
                state.isError = false
            })
            .addCase(editTask.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false

                /*if (
                    action.payload.data &&
                    action.payload.data.section_slug &&
                    action.payload.data.parent === null
                ) {
                    const sectionKey = action.payload.data.section_slug;
                     state.reload = true

                    if (state.columns[sectionKey]) {
                        state.columns[sectionKey] = state.columns[sectionKey].map(task =>
                            task.id === action.payload.data.id ? action.payload.data : task
                        );
                    }
                }

                // for sub task
                if (action.payload.data && action.payload.data.section_slug && action.payload.data.parent && action.payload.data.parent.slug) {
                    Object.entries(state.childColumns).forEach(([key, tasks]) => {
                        if (key === action.payload.data.parent.slug) {
                            state.childColumns[key] = tasks.map(task =>
                                task.id === action.payload.data.id ? action.payload.data : {...task}
                            );
                        }
                    });
                }
                //allTasks update id match
                if (action.payload.data && action.payload.data.id && state.allTasks[action.payload.data.id]) {
                    state.allTasks[action.payload.data.id] = action.payload.data;
                }*/

                if (action.payload.data) {
                    const { section_slug, parent, id, slug } = action.payload.data;

                    if (section_slug && parent === null) {
                        const sectionKey = section_slug;
                        state.reload = true;

                        if (state.columns[sectionKey]) {
                            state.columns[sectionKey] = state.columns[sectionKey].map(task =>
                                task.id === id ? action.payload.data : task
                            );
                        }
                    } else if (section_slug && parent?.slug) {
                        const parentSlug = parent.slug;

                        if (state.childColumns[parentSlug]) {
                            state.childColumns[parentSlug] = state.childColumns[parentSlug].map(task =>
                                task.id === id ? action.payload.data : { ...task }
                            );
                        }
                    }

                    if (id && state.allTasks[id]) {
                        state.allTasks[id] = action.payload.data;
                    }

                    const deletedTaskId = action.payload?.data?.id;
                    const ganttVisible = action.payload?.data?.ganttIsVisible;
                    if (deletedTaskId && ganttVisible == 0) {
                        state.ganttTasks = state.ganttTasks.filter(task => task.id !== deletedTaskId);
                    }

                    if(action.payload.data && action.payload.data.children){
                        state.childColumns[slug] = action.payload.data.children;
                    }

                    // replacing the task with the updated data
                    // state.task                             = action.payload.data;
                    // Update the ganttTasks array with the updated task
                    const taskIndex = state.ganttTasks.findIndex(task => task.id === id);

                    if (taskIndex !== -1 && state.ganttTasks[taskIndex].id === id) {
                        state.ganttTasks[taskIndex] = { ...state.ganttTasks[taskIndex], ...action.payload.data };
                    } else {
                        console.error(`Task with id ${id} not found in ganttTasks`);
                    }


                }

                state.success = `Task update successfully`
            })
            .addCase(editTask.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
                console.log(action)
            })
            .addCase(editTaskSortOrder.pending, (state) => {
                // state.isLoading = true
                state.isError = false
            })
            .addCase(editTaskSortOrder.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                // console.log(action.payload.data)
                /*Object.entries(state.columns).findIndex(([key, value]) => {
                    if (key === action.payload.data.section_slug) {
                        state.columns[key].push(action.payload.data)
                    }
                })*/
                // state.success = `Task update successfully`
            })
            .addCase(editTaskSortOrder.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(createTaskSection.pending, (state) => {
                // state.isLoading = true
                state.isError = false
            })
            .addCase(createTaskSection.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                const addedTaskListSection = action.payload.data && action.payload.data.taskListSectionsName ? action.payload.data.taskListSectionsName : {}
                const addedData = action.payload.data && action.payload.data.taskSections ? action.payload.data.taskSections : ''
                const addedColumn = action.payload.data && action.payload.data.tasks ? action.payload.data.tasks : {}
                state.ordered = [...state.ordered, addedData]
                state.taskListSections = {...state.taskListSections, ...addedTaskListSection}
                state.columns = {...state.columns, ...addedColumn}
                state.success = `${action.payload.data.name} Created Successfully`
            })
            .addCase(createTaskSection.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(editTaskSection.pending, (state) => {
                // state.isLoading = true
                state.isError = false
            })
            .addCase(editTaskSection.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                const addedTaskListSection = action.payload.data && action.payload.data.taskListSectionsName ? action.payload.data.taskListSectionsName : {}
                const addedData = action.payload.data && action.payload.data.taskSections ? action.payload.data.taskSections : ''
                // state.ordered = [...state.ordered, addedData]
                // state.taskListSections = {...state.taskListSections, ...addedTaskListSection}

                // Get updated section name from API response
                const updatedSections = action.payload.data && action.payload.data.taskListSectionsName
                    ? action.payload.data.taskListSectionsName
                    : {};

                // Merge updated section(s) into taskListSections
                state.taskListSections = {
                    ...state.taskListSections,
                    ...updatedSections
                };

                state.success = `Task Section Updated Successfully`
            })
            .addCase(editTaskSection.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(markIsCompletedTaskSection.pending, (state) => {
                // state.isLoading = true
                state.isError = false
            })
            .addCase(markIsCompletedTaskSection.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false


                if (action.payload && action.payload.status === 200) {
                    if (action.payload.data && action.payload.data.taskSections) {
                        /*state.taskListSections[action.payload.data.taskSections] = {
                            ...state.taskListSections[action.payload.data.taskSections],
                            ...action.payload.data.section
                        };*/

                        state.taskListSections =   {
                        ...state.taskListSections,
                            [action.payload.data.taskSections]: {
                        ...state.taskListSections[action.payload.data.taskSections],
                                mark_is_complete: action.payload.data.section.mark_is_complete
                        }
                        };
                    }
                    state.success = `Task Section Updated Successfully`
                }
                // state.ordered = [...state.ordered, addedData]
                // state.taskListSections = {...state.taskListSections, ...addedTaskListSection}
            })
            .addCase(markIsCompletedTaskSection.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(archiveSectionTask.pending, (state) => {
                // state.isLoading = true
                state.isError = false
            })
            .addCase(archiveSectionTask.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isError = false;
                
                
            })
            .addCase(archiveSectionTask.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(archiveTask.pending, (state) => {
                // state.isLoading = true
                state.isError = false
            })
            .addCase(archiveTask.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isError = false;
                if(action.payload.data && action.payload.data.section_slug && action.payload.data.parent===null){
                    Object.entries(state.columns).forEach(([key, tasks]) => {
                        if (key === action.payload.data.section_slug) {
                            // item remove
                            state.columns[key] = tasks.filter(task => task.id !== action.payload.data.id)
                        }
                    });
                }
                
            })
            .addCase(archiveTask.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(unarchiveTask.pending, (state) => {
                // state.isLoading = true
                state.isError = false
            })
            .addCase(unarchiveTask.fulfilled, (state, action) => {
                state.isLoading = true;
                state.isError = false;
                
                state.archivedTasks = action.payload?.tasks || [];
                state.archivedSections = action.payload?.sections || [];
                if(action.payload.data && action.payload.data.section_slug && action.payload.data.parent === null) {
        
                    // Check if section already exists in columns
                    if (state.columns[action.payload.data.section_slug]) {
                        
                        // Add the task back to the section (unarchive the task)
                        state.columns[action.payload.data.section_slug] = [
                            ...state.columns[action.payload.data.section_slug],  // Retain existing tasks in the section
                            action.payload.data  // Add the unarchived task
                        ];
                    }
                }
                
            })
            .addCase(unarchiveTask.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(fetchArchiveTasks.pending, (state) => {
                // state.isLoading = true
                state.isError = false
            })
            .addCase(fetchArchiveTasks.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isError = false;
                state.archivedTasks = action.payload.tasks;
                state.archivedSections = action.payload.sections;

                
                
            })
            .addCase(fetchArchiveTasks.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(completeTask.pending, (state) => {
                // state.isLoading = true;
                state.isError = false;
            })
            .addCase(completeTask.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isError = false;
            
                // if (action.payload.data && action.payload.data.section_slug) {
                //     // Remove task from its original section
                //     Object.entries(state.columns).forEach(([key, tasks]) => {
                //         state.columns[key] = tasks.filter(task => 
                //             task.id !== action.payload.data.id
                //         );
                //     });
            
                //     // Add task to its new section (completed section)
                //     if (!state.columns[action.payload.data.section_slug]) {
                //         state.columns[action.payload.data.section_slug] = [];
                //     }
                //     state.columns[action.payload.data.section_slug].push(action.payload.data);
            
                //     // Update task in taskData if it exists
                //     if (state.taskData && state.taskData[action.payload.data.id]) {
                //         state.taskData[action.payload.data.id] = action.payload.data;
                //     }
                // }

                const completedTask = action.payload.data;

                if (completedTask && completedTask.section_slug) {
                    // Main task logic (parent === null)
                    if (completedTask.parent === null) {
                        // Remove task from its original section
                        Object.entries(state.columns).forEach(([key, tasks]) => {
                            state.columns[key] = tasks.filter(task => 
                                task.id !== completedTask.id
                            );
                        });

                        // Add task to its new section (completed section)
                        if (!state.columns[completedTask.section_slug]) {
                            state.columns[completedTask.section_slug] = [];
                        }
                        state.columns[completedTask.section_slug].push(completedTask);

                        // Update task in taskData if it exists
                        if (state.taskData && state.taskData[completedTask.id]) {
                            state.taskData[completedTask.id] = completedTask;
                        }
                    } else if (completedTask.parent && completedTask.parent.slug) {
                        // Subtask logic: update subtask data only (e.g., change bg color/status)
                        const parentSlug = completedTask.parent.slug;
                        if (state.childColumns[parentSlug]) {
                            state.childColumns[parentSlug] = state.childColumns[parentSlug].map(subtask =>
                                subtask.id === completedTask.id ? completedTask : subtask
                            );
                        }
                        // Optionally, update the subtask in allTasks if you use that for rendering
                        if (state.allTasks[completedTask.id]) {
                            state.allTasks[completedTask.id] = completedTask;
                        }
                    }
                }
            
                state.success = "Task completed successfully";
            })
            .addCase(completeTask.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.error = action.error?.message || 'Failed to complete task';
            })
            .addCase(inCompleteTask.pending, (state) => {
                // state.isLoading = true;
                state.isError = false;
            })
            .addCase(inCompleteTask.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isError = false;

                const incompletedTask = action.payload.data;

                if (incompletedTask && incompletedTask.parent && incompletedTask.parent.slug) {
                    // Subtask logic: update subtask data in childColumns
                    const parentSlug = incompletedTask.parent.slug;

                    if (state.childColumns[parentSlug]) {
                        // Update the specific subtask in childColumns
                        state.childColumns[parentSlug] = state.childColumns[parentSlug].map(subtask =>
                            subtask.id === incompletedTask.id
                                ? { ...subtask, ...incompletedTask } // Merge updated subtask data
                                : subtask
                        );
                    }

                    // Update the subtask in allTasks if it exists
                    if (state.allTasks[incompletedTask.id]) {
                        state.allTasks = {
                            ...state.allTasks,
                            [incompletedTask.id]: { ...state.allTasks[incompletedTask.id], ...incompletedTask },
                        };
                    }
                }

                state.success = "Task marked as incomplete successfully";
            })
            .addCase(inCompleteTask.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.error = action.error?.message || 'Failed to incomplete task';
            })
            // Add these cases to the extraReducers section
            .addCase(convertTask.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
            })
            .addCase(convertTask.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isError = false;

                state.success = "Subtask converted to task successfully";
            })
            .addCase(convertTask.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.error = action.error?.message || 'Failed to convert subtask to task';
            })
            .addCase(changeTaskVisibility.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
            })
            .addCase(changeTaskVisibility.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isError = false;

                state.success = "Task Visibility Changed successfully";

                const updatedTask = action.payload.data;
                if (updatedTask) {
                    const { section_slug, parent, id } = updatedTask;

                    // Update in columns
                    if (section_slug && parent === null) {
                        if (state.columns[section_slug]) {
                            state.columns[section_slug] = state.columns[section_slug].map(task =>
                                task.id === id ? updatedTask : task
                            );
                        }
                    }
                    // Update in childColumns
                    if (section_slug && parent && parent.slug) {
                        const parentSlug = parent.slug;
                        if (state.childColumns[parentSlug]) {
                            state.childColumns[parentSlug] = state.childColumns[parentSlug].map(task =>
                                task.id === id ? updatedTask : task
                            );
                        }
                    }
                    // Update in allTasks
                    if (id && state.allTasks[id]) {
                        state.allTasks[id] = updatedTask;
                    }
                    // Update current task
                    state.task = updatedTask;
                }
            })
            .addCase(changeTaskVisibility.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.error = action.error?.message || 'Failed to change task visibility';
            })
            .addCase(duplicateTask.pending, (state) => {
                // state.isLoading = true
                state.isError = false
            })
            .addCase(duplicateTask.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                // for task
                if(action.payload.data && action.payload.data.section_slug && action.payload.data.parent===null){
                    Object.entries(state.columns).findIndex(([key, value]) => {
                        if (key === action.payload.data.section_slug) {
                            state.columns[key].push(action.payload.data)
                        }
                    })
                }

                // for sub task
                if (action.payload.data && action.payload.data.section_slug && action.payload.data.parent && action.payload.data.parent.slug) {
                    let keyExist = Object.keys(state.childColumns).some(key => key === action.payload.data.parent.slug);

                    if (!keyExist) {
                        state.childColumns[action.payload.data.parent.slug] = [action.payload.data]
                    }else {
                        state.childColumns[action.payload.data.parent.slug].push(action.payload.data)
                    }
                }

                //task added push allTasks
                // if (action.payload.data && action.payload.data.id) {
                //     state.allTasks[action.payload.data.id] = action.payload.data

                //     state.ganttTasks.push(action.payload.data);
                // }
                //state.ganttTasks

                if (action.payload.data && action.payload.data.id) {
                    const parentTask = action.payload.data;
                    const subtasks = parentTask.subtasks || [];

                    console.log(subtasks);

                    // Save parent task
                    state.allTasks[parentTask.id] = parentTask;
                    state.ganttTasks.push(parentTask);

                    // Save subtasks
                    subtasks.forEach((subtask) => {
                        state.allTasks[subtask.id] = subtask;
                        state.ganttTasks.push(subtask);

                        const parentSlug = subtask.parent?.slug;
                        if (parentSlug) {
                            if (!state.childColumns[parentSlug]) {
                                state.childColumns[parentSlug] = [];
                            }
                            state.childColumns[parentSlug].push(subtask);
                        }
                    });
                }

                state.success = `Task Created Successfully`
            })
            .addCase(duplicateTask.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(duplicateTaskSection.pending, (state) => {
                // state.isLoading = true
                state.isError = false
            })
            .addCase(duplicateTaskSection.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false

                state.success = `Task Section Duplicate Successfully`
            })
            .addCase(duplicateTaskSection.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(toggoleAllTaskToGantt.pending, (state) => {
                // state.isLoading = true
                state.isError = false
            })
            .addCase(toggoleAllTaskToGantt.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isError = false;

                const updatedTasks = action.payload.data?.tasks || [];
                const updatedChildTasks = action.payload.data?.childTasks || {};

                // Update ganttTasks
                // updatedTasks.forEach(task => {
                //     const taskExists = state.ganttTasks.some(ganttTask => ganttTask.id === task.id);
                //     if (!taskExists) {
                //         state.ganttTasks.push(task);
                //     }
                // });

                // Update columns
                updatedTasks.forEach(task => {
                    if (task.section_slug && task.parent === null) {
                        if (!state.columns[task.section_slug]) {
                            state.columns[task.section_slug] = [];
                        }
                        const taskIndex = state.columns[task.section_slug].findIndex(columnTask => columnTask.id === task.id);
                        if (taskIndex !== -1) {
                            // Update the existing task
                            state.columns[task.section_slug][taskIndex] = task;
                        } else {
                            // Add the new task
                            state.columns[task.section_slug].push(task);
                        }
                    }
                });

                // Update childColumns
                Object.entries(updatedChildTasks).forEach(([parentSlug, childTasks]) => {
                    if (!state.childColumns[parentSlug]) {
                        state.childColumns[parentSlug] = [];
                    }
                    childTasks.forEach(childTask => {
                        const childIndex = state.childColumns[parentSlug].findIndex(child => child.id === childTask.id);
                        if (childIndex !== -1) {
                            // Update the existing subtask
                            state.childColumns[parentSlug][childIndex] = childTask;
                        } else {
                            // Add the new subtask
                            state.childColumns[parentSlug].push(childTask);
                        }
                    });
                });

                state.success = `All Tasks Added to Gantt Successfully`;
            })
            .addCase(toggoleAllTaskToGantt.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(deleteTaskSection.pending, (state) => {
                // state.isLoading = true
                state.isError = false
            })
            .addCase(deleteTaskSection.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false

                // deleted section remove
                state.ordered = state.ordered.filter(section => section !== action.payload.data.taskSections)
                state.taskListSections = Object.keys(state.taskListSections).reduce((object, key) => {
                    if (key !== action.payload.data.taskListSectionsName) {
                        object[key] = state.taskListSections[key]
                    }
                    return object
                    },
                    {})

                state.success = `Task Section Deleted Successfully`
            })
            .addCase(deleteTaskSection.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(editSectionSortOrder.pending, (state) => {
                // state.isLoading = true
                state.isError = false
            })
            .addCase(editSectionSortOrder.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                // state.ordered = [...state.ordered, addedData]
                // state.taskListSections = {...state.taskListSections, ...addedTaskListSection}
                state.success = `Updated Successfully`
            })
            .addCase(editSectionSortOrder.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(createProjectPriority.pending, (state) => {
                state.isLoading = false
                state.isError = false
            })
            .addCase(createProjectPriority.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.projectPriorities = action.payload.data
                state.success = `Priority Created Successfully`
            })
            .addCase(createProjectPriority.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(editProjectPrioritySortOrder.pending, (state) => {
                state.isLoading = false
                state.isError = false
            })
            .addCase(editProjectPrioritySortOrder.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.projectPriorities = action.payload.data
                state.success = `Priority Sorted Successfully`
            })
            .addCase(editProjectPrioritySortOrder.rejected, (state, action) => {
                console.error('Error Payload:', action.error);
                state.isLoading = false;
                state.isError = true;
                state.error = action.error?.message || 'Failed to update project priorities';
            })
            //deleteProjectPriority
            .addCase(deleteProjectPriority.pending, (state) => {
                // state.isLoading = true
                state.isError = false
            })
            .addCase(deleteProjectPriority.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.projectPriorities = action.payload.data
                state.success = `Priority Deleted Successfully`
            })
            .addCase(deleteProjectPriority.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(createProjectStatus.pending, (state) => {
                state.isLoading = false
                state.isError = false
            })
            .addCase(createProjectStatus.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.projectStatuses = action.payload.data
                state.success = `Status Created Successfully`
            })
            .addCase(createProjectStatus.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(deleteProjectStatus.pending, (state) => {
                // state.isLoading = true
                state.isError = false
            })
            .addCase(deleteProjectStatus.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.projectStatuses = action.payload.data
                state.success = `Priority Deleted Successfully`
            })
            .addCase(deleteProjectStatus.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(editProjectStatusSortOrder.pending, (state) => {
                state.isLoading = false
                state.isError = false
            })
            .addCase(editProjectStatusSortOrder.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.projectStatuses = action.payload.data
                state.success = `Status Sorted Successfully`
            })
            .addCase(editProjectStatusSortOrder.rejected, (state, action) => {
                console.error('Error Payload:', action.error);
                state.isLoading = false;
                state.isError = true;
                state.error = action.error?.message || 'Failed to update project priorities';
            })
            .addCase(createComment.pending, (state) => {
                // state.isLoading = true
                state.isError = false
            })
            .addCase(createComment.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false

                if(action.payload.task && action.payload.task.section_slug && action.payload.task.parent===null){
                    Object.entries(state.columns).forEach(([key, tasks]) => {
                        if (key === action.payload.task.section_slug) {
                            state.columns[key] = tasks.map(task =>
                                task.id === action.payload.task.id ? action.payload.task : {...task}
                            );
                        }
                    });
                }

                // for sub task
                if (action.payload.task && action.payload.task.section_slug && action.payload.task.parent && action.payload.task.parent.slug) {
                    Object.entries(state.childColumns).forEach(([key, tasks]) => {
                        if (key === action.payload.task.parent.slug) {
                            state.childColumns[key] = tasks.map(task =>
                                task.id === action.payload.task.id ? action.payload.task : {...task}
                            );
                        }
                    });
                }

                state.comment = action.payload.data
                state.success = `Comment Created Successfully`
            })
            .addCase(createComment.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(deleteComment.pending, (state) => {
                // state.isLoading = true
                state.isError = false
            })
            .addCase(deleteComment.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.attachments = action.payload.data
                /*Object.entries(state.columns).forEach(([key, tasks]) => {
                    if (action.payload.task && key === action.payload.task.section_slug) {
                        state.columns[key] = tasks.map(task =>
                            task.id === action.payload.task.id ? action.payload.task : task
                        );
                    }
                });*/

                if(action.payload.task && action.payload.task.section_slug && action.payload.task.parent===null){
                    Object.entries(state.columns).forEach(([key, tasks]) => {
                        if (key === action.payload.task.section_slug) {
                            state.columns[key] = tasks.map(task =>
                                task.id === action.payload.task.id ? action.payload.task : {...task}
                            );
                        }
                    });
                }

                // for sub task
                if (action.payload.task && action.payload.task.section_slug && action.payload.task.parent && action.payload.task.parent.slug) {
                    Object.entries(state.childColumns).forEach(([key, tasks]) => {
                        if (key === action.payload.task.parent.slug) {
                            state.childColumns[key] = tasks.map(task =>
                                task.id === action.payload.task.id ? action.payload.task : {...task}
                            );
                        }
                    });
                }
                state.success = `Attachment Upload Successfully`
                console.log(action.payload.data)
            })
            .addCase(deleteComment.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            // attachment start
            .addCase(createAttachment.pending, (state) => {
                // state.isLoading = true
                state.isError = false
            })
            .addCase(createAttachment.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.attachments = action.payload.data
                /*Object.entries(state.columns).forEach(([key, tasks]) => {
                    if (action.payload.task && key === action.payload.task.section_slug) {
                        state.columns[key] = tasks.map(task =>
                            task.id === action.payload.task.id ? action.payload.task : {...task}
                        );
                    }
                });*/

                if(action.payload.task && action.payload.task.section_slug && action.payload.task.parent===null){
                    Object.entries(state.columns).forEach(([key, tasks]) => {
                        if (key === action.payload.task.section_slug) {
                            state.columns[key] = tasks.map(task =>
                                task.id === action.payload.task.id ? action.payload.task : {...task}
                            );
                        }
                    });
                }

                // for sub task
                if (action.payload.task && action.payload.task.section_slug && action.payload.task.parent && action.payload.task.parent.slug) {
                    Object.entries(state.childColumns).forEach(([key, tasks]) => {
                        if (key === action.payload.task.parent.slug) {
                            state.childColumns[key] = tasks.map(task =>
                                task.id === action.payload.task.id ? action.payload.task : {...task}
                            );
                        }
                    });
                }
                state.success = `Attachment Upload Successfully`
                console.log(action.payload.data)
            })
            .addCase(createAttachment.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(uploadAttachments.pending, (state) => {
                // state.isLoading = true
                state.isError = false
            })
            .addCase(uploadAttachments.fulfilled, (state, action) => {
                state.uploadsAttachment = action.payload.data
            })
            .addCase(uploadAttachments.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(deleteAttachment.pending, (state) => {
                // state.isLoading = true
                state.isError = false
            })
            .addCase(deleteAttachment.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.attachments = action.payload.data
                /*Object.entries(state.columns).forEach(([key, tasks]) => {
                    if (action.payload.task && key === action.payload.task.section_slug) {
                        state.columns[key] = tasks.map(task =>
                            task.id === action.payload.task.id ? action.payload.task : task
                        );
                    }
                });*/

                if(action.payload.task && action.payload.task.section_slug && action.payload.task.parent===null){
                    Object.entries(state.columns).forEach(([key, tasks]) => {
                        if (key === action.payload.task.section_slug) {
                            state.columns[key] = tasks.map(task =>
                                task.id === action.payload.task.id ? action.payload.task : {...task}
                            );
                        }
                    });
                }

                // for sub task
                if (action.payload.task && action.payload.task.section_slug && action.payload.task.parent && action.payload.task.parent.slug) {
                    Object.entries(state.childColumns).forEach(([key, tasks]) => {
                        if (key === action.payload.task.parent.slug) {
                            state.childColumns[key] = tasks.map(task =>
                                task.id === action.payload.task.id ? action.payload.task : {...task}
                            );
                        }
                    });
                }
                state.success = `Attachment Upload Successfully`
                console.log(action.payload.data)
            })
            .addCase(deleteAttachment.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(addTagToTask.pending, (state) => {
                // state.isLoading = true
                state.isError = false
            })
            .addCase(addTagToTask.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false

                if(action.payload.task && action.payload.task.section_slug && action.payload.task.parent===null){
                    Object.entries(state.columns).forEach(([key, tasks]) => {
                        if (key === action.payload.task.section_slug) {
                            state.columns[key] = tasks.map(task =>
                                task.id === action.payload.task.id ? action.payload.task : {...task}
                            );
                        }
                    });
                }

                // for sub task
                if (action.payload.task && action.payload.task.section_slug && action.payload.task.parent && action.payload.task.parent.slug) {
                    Object.entries(state.childColumns).forEach(([key, tasks]) => {
                        if (key === action.payload.task.parent.slug) {
                            state.childColumns[key] = tasks.map(task =>
                                task.id === action.payload.task.id ? action.payload.task : {...task}
                            );
                        }
                    });
                }

                state.taskTags = action.payload.data
                state.success = `Attachment Upload Successfully`
            })
            .addCase(addTagToTask.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(deleteTagFromTask.pending, (state) => {
                // state.isLoading = true
                state.isError = false
            })
            .addCase(deleteTagFromTask.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false

                // for task
                if(action.payload.task && action.payload.task.section_slug && action.payload.task.parent===null){
                    Object.entries(state.columns).forEach(([key, tasks]) => {
                        if (key === action.payload.task.section_slug) {
                            state.columns[key] = tasks.map(task =>
                                task.id === action.payload.task.id ? action.payload.task : {...task}
                            );
                        }
                    });
                }


                // for sub task
                if (action.payload.task && action.payload.task.section_slug && action.payload.task.parent && action.payload.task.parent.slug) {
                    Object.entries(state.childColumns).forEach(([key, tasks]) => {
                        if (key === action.payload.task.parent.slug) {
                            state.childColumns[key] = tasks.map(task =>
                                task.id === action.payload.task.id ? action.payload.task : {...task}
                            );
                        }
                    });
                }
                state.taskTags = action.payload.data
                state.success = `Attachment Upload Successfully`
            })
            .addCase(deleteTagFromTask.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(deleteTask.pending, (state) => {
                // state.isLoading = true
                state.isError = false
            })
            .addCase(deleteTask.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                console.log(action.payload.task)
                // for task
                if(action.payload.task && action.payload.task.section_slug && action.payload.task.parent===null){
                    Object.entries(state.columns).forEach(([key, tasks]) => {
                        if (key === action.payload.task.section_slug) {
                            // item remove
                            state.columns[key] = tasks.filter(task => task.id !== action.payload.task.id)
                        }
                    });
                }


                // for sub task
                if (action.payload.task && action.payload.task.section_slug && action.payload.task.parent && action.payload.task.parent.slug) {
                    /*Object.entries(state.childColumns).forEach(([key, tasks]) => {
                        if (key === action.payload.task.parent.slug) {
                            // item remove
                            state.childColumns[key] = tasks.filter(task => task.id !== action.payload.task.id)
                        }
                    });*/
                    // remove children
                    state.childColumns[action.payload.task.parent.slug] = state.childColumns[action.payload.task.parent.slug].filter(task => task.id !== action.payload.task.id)

                    //remove children into parent
                    state.columns[action.payload.task.parent.section_slug] = state.columns[action.payload.task.parent.section_slug].map(task => {
                        if( parseInt(task.id) === parseInt(action.payload.task.parent.id)){
                            return {
                                ...task,
                                children: task.children.filter(child => parseInt(child.id) !== parseInt(action.payload.task.id))
                            }
                        }
                        return task
                    }
                    )
                }

                state.success = `Task deleted Successfully`
            })
            .addCase(deleteTask.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            // Dashboard task count
            .addCase(fetchTaskCounts.pending, (state) => {
                // state.isLoading = true
                state.isError = false
            })
            .addCase(fetchTaskCounts.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.taskCount = action.payload.data
            })
            .addCase(fetchTaskCounts.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            // Dashboard members task count
            .addCase(fetchMembersTasksCounts.pending, (state) => {
                // state.isLoading = true
                state.isError = false
            })
            .addCase(fetchMembersTasksCounts.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.membersTasksCounts = action.payload.data
            })
            .addCase(fetchMembersTasksCounts.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            // Dashboard project pie chart task count
            .addCase(fetchProjectsPieChartsData.pending, (state) => {
                // state.isLoading = true
                state.isError = false
            })
            .addCase(fetchProjectsPieChartsData.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.pieChartData = action.payload.data
            })
            .addCase(fetchProjectsPieChartsData.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            // Dashboard user activities
            .addCase(fetchUserActivities.pending, (state) => {
                // state.isLoading = true
                state.isError = false
            })
            .addCase(fetchUserActivities.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.userActivities = action.payload.data
            })
            .addCase(fetchUserActivities.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
        //wpDeleteAttachment
            .addCase(wpDeleteAttachment.pending, (state) => {
                // state.isLoading = true
                state.isError = false
            })
            .addCase(wpDeleteAttachment.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.success = `Attachment Upload Successfully`
            })
            .addCase(wpDeleteAttachment.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            //updateGanttTaskSortOrder
            .addCase(editGanttTaskSortOrder.pending, (state) => {
                // state.isLoading = true
                state.isError = false
            })
            .addCase(editGanttTaskSortOrder.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.success = `Task Sort Order Updated Successfully`
            })
            .addCase(editGanttTaskSortOrder.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })


    },
})
export const {
    updateOrdered,
    updateColumns,
    updateChildColumns,
    updateProjectPriorities,
    updateTaskListSections,
    setEditableTask,
    removeSuccessMessage,
    removeProjectFromState,
    updateBoardMembers,
    updateIsLoading,
    initialTask,
    openTaskEditDrawer,
    closeTaskEditDrawer,
    openAddTaskDrawer,
    closeAddTaskDrawer,
    changeGanttViewMode,
    updateFilterValues,
    resetFilterValues,
    updateExpandedItems
} = taskSlice.actions
export default taskSlice.reducer
