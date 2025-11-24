import ApiService from "./ApiService";

// Get Users
export const getSettings = async () => {
    try {
        const response = await ApiService.fetchData({
            url: '/settings',
            method: 'get'
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

// Update setting

export const Lazytask_updateSetting = async (data) => {

    const response = await ApiService.fetchData({
        url: `/settings`,
        method: 'post',
        headers: {
            "Accept": "application/json, text/plain, */*",
            'Content-type': 'multipart/form-data',
            'Access-Control-Allow-Origin': '*',
        },
        data,
    })

    return response.data;
}

export const Lazytask_getConfig = async () => {

    const response = await ApiService.fetchData({
        url: `/settings/config`,
        method: 'get'
    })

    return response.data;
}

export const Lazytask_updateConfig = async (data) => {

    const response = await ApiService.fetchData({
        url: `/settings/config/update`,
        method: 'post',
        data
    })

    return response.data;
}

export const getNotifications = async (data) => {
    try {
        const response = await ApiService.fetchData({
            url: '/notifications',
            method: 'get',
            params : data
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export const notificationStatusChange = async (id, data) => {
    try {
        const response = await ApiService.fetchData({
            url: `/notifications/status/${id}`,
            method: 'put',
            data: data
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export const allNotificationStatusChange = async (data) => {
    try {
        const response = await ApiService.fetchData({
            url: `/notifications/mark-all-read`,
            method: 'put',
            data: {
                user_id: data.user_id,
                notification_ids: data.notification_ids,
                channels: data.channels
            }
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export const getTimezoneOptions = async () => {
    try {
        const response = await ApiService.fetchData({
            url: '/timezone-options',
            method: 'get',
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export const Lazytask_updatePortalSetting = async (data) => {
    try {
        const response = await ApiService.fetchData({
            url: 'portal-settings',
            method: 'put',
            headers: {
                'Content-Type': 'application/json'
            },
            data: data
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export const saveFeedbackForm = async (data) => {
    try {
        const response = await ApiService.fetchData({
            url: 'send-feedback',
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },
            data: data
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export const editLicenseModalStatus = async (id) => {
    try {
        const response = await ApiService.fetchData({
            url: '/edit-license-modal-status',
            method: 'get',
            params: { user_id: id }
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export const installAddon = async (data) => {
    console.log(data);
    try {
        const response = await ApiService.fetchData({
            url: 'install-activate/addon',
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },
            data: data
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export const deactivateAddon = async (data) => {
    try {
        const response = await ApiService.fetchData({
            url: 'deactivate/addon',
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },
            data: data
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export const enableDisableSocialLogin = async (data) => {
    try {
        const response = await ApiService.fetchData({
            url: 'social-login/on-off',
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },
            data: data
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

