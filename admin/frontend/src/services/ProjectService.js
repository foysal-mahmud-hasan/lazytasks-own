import ApiService from "./ApiService";

// Get Users
export const getAllProjects = async (data) => {
    try {
        const response = await ApiService.fetchData({
            url: '/projects',
            method: 'get',
            params: data,
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export const addProject = async (data) => {
    try {
        const response = await ApiService.fetchData({
            url: '/projects/create',
            method: 'post',
            data,
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}


export const getProject = async (id) => {
    try {

        const response = await ApiService.fetchData({
            url: `/projects/${id}`,
            method: 'get',
        })
        return response.data;

    } catch (error) {
        return error.message;
    }
}



// Update Project

export const updateProject = async (id, data) => {

    const response = await ApiService.fetchData({
        url: `/projects/edit/${id}`,
        method: 'put',
        data,
    })

    return response.data;
}

export const removeProject = async (id, data) => {
    try {

        const response = await ApiService.fetchData({
            url: `/projects/delete/${id}`,
            method: 'put',
            data
        })
        return response.data;

    } catch (error) {
        return error.message;
    }
}

export const restoreFromDeleteProject = async (id) => {
    try {
        const response = await ApiService.fetchData({
            url: `/projects/restore/${id}`,
            method: 'get',
        })
        return response.data;

    } catch (error) {
        return error.message;
    }

}


export const getProjectMembers = async (data) => {
    try {
        const response = await ApiService.fetchData({
            url: `/projects/members`,
            method: 'get',
            params: data,
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export const getProjectSections = async (id) => {
    try {
        const response = await ApiService.fetchData({
            url: `/projects/sections/${id}`,
            method: 'get',
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export const getProjectPriorities = async (id) => {
    try {
        const response = await ApiService.fetchData({
            url: `/projects/priorities/${id}`,
            method: 'get',
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export const getProjectStatuses = async (id) => {
    try {
        const response = await ApiService.fetchData({
            url: `/projects/status/${id}`,
            method: 'get',
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}



