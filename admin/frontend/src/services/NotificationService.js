import ApiService from "./ApiService";
// Get Notification actions list
export const getNotificationActions = async () => {
    try {
        const response = await ApiService.fetchData({
            url: '/notification-action-list',
            method: 'get'
        })
        return response.data;
    } catch (error) {
        return error.message;
    }

}

// Get Notification Channels
export const getNotificationChannels = async () => {
    try {
        const response = await ApiService.fetchData({
            url: '/notification-channels',
            method: 'get'
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}
// Get Notification Templates
export const getNotificationTemplates = async () => {
    try {
        const response = await ApiService.fetchData({
            url: '/notification-templates',
            method: 'get'
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

//add Notification Template
export const addNotificationTemplate = async (data) => {
    try {
        const response = await ApiService.fetchData({
            url: '/notification-templates/create',
            method: 'post',
            data
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}
//show Notification Template by id
export const showNotificationTemplate = async (id) => {
    try {
        const response = await ApiService.fetchData({
            url: `/notification-templates/show/${id}`,
            method: 'get'
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

//edit Notification Template by id
export const editNotificationTemplate = async ( id, data ) => {
    try {
        const response = await ApiService.fetchData({
            url: `/notification-templates/edit/${id}`,
            method: 'put',
            data
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

//delete notification template by id
export const deleteNotificationTemplate = async ( id ) => {
    try {
        const response = await ApiService.fetchData({
            url: `/notification-templates/delete/${id}`,
            method: 'delete'
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

