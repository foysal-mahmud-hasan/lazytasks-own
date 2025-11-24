import ApiService from "./ApiService";

export async function getProjectOverview(id) {
    try {
        const response = await ApiService.fetchData({
            url: `/project-overview/${id}`,
            method: 'get'
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export const projectArchive = async (id) => {
    try {
        const response = await ApiService.fetchData({
            url: `/project/archive/${id}`,
            method: 'put',
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export const projectUnarchive = async (id) => {
    try {
        const response = await ApiService.fetchData({
            url: `/project/unarchive/${id}`,
            method: 'put',
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export const updateProjectNav = async (id, data) => {
    const response = await ApiService.fetchData({
        url: `/projects/nav/edit/${id}`,
        method: 'post',
        data: { settings: data },
    })

    return response.data;
}

export async function getTaskListsBySection(projectId, sectionSlug, limit = 10, offset = 0, append = false) {
    try {
        const response = await ApiService.fetchData({
            url: `/project/${projectId}/section/${sectionSlug}`,
            method: 'get',
            params: { limit, offset }
        })
        return response.data;

    } catch (error) {
        return error.message;
    }
}

export async function getTaskListsByPriority(projectId, priorityId, prioritySlug, limit = 10, offset = 0, append = false) {
    try {
        const response = await ApiService.fetchData({
            url: `/project/${projectId}/priority/tasks`,
            method: 'get',
            params: { 
                priority_id: priorityId ?? 'none',
                limit, offset 
            }
        })
        return response.data;

    } catch (error) {
        return error.message;
    }
}

export async function getTaskListsByStatus(projectId, statusId, statusSlug, limit = 10, offset = 0, append = false) {
    try {
        const response = await ApiService.fetchData({
            url: `/project/${projectId}/status/tasks`,
            method: 'get',
            params: { 
                status_id: statusId ?? 'none',
                limit, offset 
            }
        })
        return response.data;

    } catch (error) {
        return error.message;
    }
}

export async function getTaskListsByMember(projectId, memberId, limit = 10, offset = 0, append = false) {
    try {
        const response = await ApiService.fetchData({
            url: `/project/${projectId}/member/tasks`,
            method: 'get',
            params: { 
                member_id: memberId ?? 'none',
                limit, offset
            }
        })
        return response.data;

    } catch (error) {
        return error.message;
    }
}

export async function getTaskListsByDueDate(projectId, dateType, limit = 10, offset = 0, append = false) {
    try {
        const response = await ApiService.fetchData({
            url: `/project/${projectId}/duedate/${dateType}`,
            method: 'get',
            params: { limit, offset }
        })
        return response.data;

    } catch (error) {
        return error.message;
    }
}

export async function getTaskListsByProject(id, data) {
    try {
        const response = await ApiService.fetchData({
            url: `/tasks/by/project/${id}`,
            method: 'get',
            params: data
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export async function getGanttTaskListsByProject(id, data) {
    try {
        const response = await ApiService.fetchData({
            url: `/gantt-tasks/by/project/${id}`,
            method: 'get',
            params: data
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export async function getTask(id) {
    try {
        const response = await ApiService.fetchData({
            url: `/tasks/show/${id}`,
            method: 'get',
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}
export async function getTaskCounts() {
    try {
        const response = await ApiService.fetchData({
            url: `/dashboard/task-count`,
            method: 'get',
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export async function getMembersTasksCounts(id) {
    try {
        const response = await ApiService.fetchData({
            url: `/dashboard/members/task-count`,
            method: 'get',
            params: { id }
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export async function getProjectsPieChartsData(id) {
    try {
        const response = await ApiService.fetchData({
            url: `/dashboard/project/pie-chart/data`,
            method: 'get',
            params: { id }
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export async function getUserActivities(id) {
    try {
        const response = await ApiService.fetchData({
            url: `/activity-log/by/user/${id}`,
            method: 'get',
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export async function removeTask(id, data) {
    try {
        const response = await ApiService.fetchData({
            url: `/tasks/delete/${id}`,
            method: 'put',
            data,
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export async function addTask( data ) {
    try {
        const response = await ApiService.fetchData({
            url: '/tasks/create',
            method: 'post',
            data,
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}


// Update Task

export const updateTask = async (id, data) => {

    const response = await ApiService.fetchData({
        url: `/tasks/edit/${id}`,
        method: 'put',
        data,
    })
    return response.data;
}

// Update Task Sort Order

export const updateTaskSortOrder = async (data) => {

    try {
        const response = await ApiService.fetchData({
            url: `/tasks/sort-order/update`,
            method: 'put',
            data,
        })
        return response.data;
    }catch (error) {
        return error.message;
    }
}

export const updateGanttTaskSortOrder = async (data) => {

    try {
        const response = await ApiService.fetchData({
            url: `/tasks/gantt-sort-order/update`,
            method: 'put',
            data,
        })
        return response.data;
    }catch (error) {
        return error.message;
    }
}

export async function addTaskSection( data ) {
    try {
        const response = await ApiService.fetchData({
            url: '/sections/create',
            method: 'post',
            data,
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export async function updateTaskSection( id, data ) {
    try {
        const response = await ApiService.fetchData({
            url: `/sections/edit/${id}`,
            method: 'put',
            data,
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export async function markIsCompleteTaskSection( id, data ) {
    try {
        const response = await ApiService.fetchData({
            url: `/sections/mark-is-complete/${id}`,
            method: 'put',
            data,
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export async function archiveSectionAllTask( id, data ) {
    try {
        const response = await ApiService.fetchData({
            url: `/sections/archive/${id}`,
            method: 'put',
            data,
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export async function taskArchive( id, data ) {
    try {
        const response = await ApiService.fetchData({
            url: `/sections/archive/${id}`,
            method: 'put',
            data,
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export async function removeTaskArchive( id, data ) {
    try {
        const response = await ApiService.fetchData({
            url: `/sections/unarchive/${id}`,
            method: 'put',
            data,
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export async function getArchivedTasks() {
    try {
        const response = await ApiService.fetchData({
            url: '/tasks/archiveList',
            method: 'get',
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export async function taskComplete(id,data) {
    try {
        const response = await ApiService.fetchData({
            url: `/tasks/complete/${id}`,
            method: 'put',
            data,
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export async function taskInComplete(id,data) {
    try {
        const response = await ApiService.fetchData({
            url: `/tasks/incomplete/${id}`,
            method: 'put',
            data,
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export async function convertToTask(id,data) {
    try {
        const response = await ApiService.fetchData({
            url: `/subtasks/convert/${id}`,
            method: 'put',
            data,
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export async function changeTaskPrivacy(id,data) {
    try {
        const response = await ApiService.fetchData({
            url: `/tasks/change-privacy/${id}`,
            method: 'put',
            data,
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export async function copyTask(id,data) {
    try {
        const response = await ApiService.fetchData({
            url: `/task/copy/${id}`,
            method: 'post',
            data,
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export async function copyTaskSection(id,data) {
    try {
        const response = await ApiService.fetchData({
            url: `/section/copy/${id}`,
            method: 'post',
            data,
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export async function toggoleSectionAllTaskToGantt(id,data) {
    try {
        const response = await ApiService.fetchData({
            url: `/section-tasks/toggole/gantt/${id}`,
            method: 'post',
            data,
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export async function removeTaskSection( id, data ) {
    try {
        const response = await ApiService.fetchData({
            url: `/sections/delete/${id}`,
            method: 'put',
            data,
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}


// Update Section Sort Order

export const updateSectionSortOrder = async (data) => {

    try {
        const response = await ApiService.fetchData({
            url: `/sections/sort-order/update`,
            method: 'put',
            data,
        })
        return response.data;
    }catch (error) {
        return error.message;
    }
}


export async function addProjectPriority( data ) {
    try {
        const response = await ApiService.fetchData({
            url: '/priorities/create',
            method: 'post',
            data,
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export async function removeProjectPriority( data ) {
    try {
        const response = await ApiService.fetchData({
            url: '/priorities/delete',
            method: 'get',
            params: data
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export async function updateProjectPrioritySortOrder( data ) {
    try {
        const response = await ApiService.fetchData({
            url: '/priorities/sortOrder/update',
            method: 'post',
            data,
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export async function addProjectStatus( data ) {
    try {
        const response = await ApiService.fetchData({
            url: '/status/create',
            method: 'post',
            data,
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export async function removeProjectStatus( data ) {
    try {
        const response = await ApiService.fetchData({
            url: '/status/delete',
            method: 'get',
            params: data
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export async function updateProjectStatusSortOrder( data ) {
    try {
        const response = await ApiService.fetchData({
            url: '/status/sortOrder/update',
            method: 'post',
            data,
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}


export async function addComments( data ) {
    try {
        const response = await ApiService.fetchData({
            url: '/comments/create',
            method: 'post',
            data,
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export async function removeComments( id, data ) {
    try {
        const response = await ApiService.fetchData({
            url: `/comments/delete/${id}`,
            method: 'put',
            data
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export async function addAttachments( data ) {
    try {
        const response = await ApiService.fetchData({
            url: '/attachments/create',
            method: 'post',
            headers: {
                "Accept": "application/json, text/plain, */*",
                'Content-type': 'multipart/form-data',
                'Access-Control-Allow-Origin': '*',
            },
            data,
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}
export async function attachmentsUpload( data ) {
    try {
        const response = await ApiService.fetchData({
            url: '/attachments/upload',
            method: 'post',
            headers: {
                "Accept": "application/json, text/plain, */*",
                'Content-type': 'multipart/form-data',
                'Access-Control-Allow-Origin': '*',
            },
            data,
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export async function removeAttachments( id, data ) {
    try {
        const response = await ApiService.fetchData({
            url: `/attachments/delete/${id}`,
            method: 'get',
            params: data
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export async function wpRemoveAttachments( id, data ) {
    try {
        const response = await ApiService.fetchData({
            url: `/attachments/remove/${id}`,
            method: 'get',
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export async function assignTagToTask( data ) {
    try {
        const response = await ApiService.fetchData({
            url: '/tasks/tag/assign',
            method: 'post',
            data
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export async function removeTagFromTask( data ) {
    try {
        const response = await ApiService.fetchData({
            url: '/tasks/tag/remove',
            method: 'put',
            data
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}


export async function getTaskListsByUser(id, data) {
    try {
        const response = await ApiService.fetchData({
            url: `/tasks/by/user/${id}`,
            method: 'get',
            params: data
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export async function getUserTaskListsByDate(id, data) {
    console.log(id, data);
    try {
        const response = await ApiService.fetchData({
            url: `/mytasks/${id}`,
            method: 'get',
            params: data
        })
        console.log(response.data);
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export async function getQuickTaskListsByUser(id, data) {
    try {
        const response = await ApiService.fetchData({
            url: `/quick-tasks/by/user/${id}`,
            method: 'get',
            params: data
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export async function deleteQuickTaskAfterConvertTask(id) {
    try {
        const response = await ApiService.fetchData({
            url: `/quick-tasks/delete/${id}`,
            method: 'delete',
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}



export async function addQuickTask( data ) {
    try {
        const response = await ApiService.fetchData({
            url: '/quick-tasks/create',
            method: 'post',
            data,
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}


