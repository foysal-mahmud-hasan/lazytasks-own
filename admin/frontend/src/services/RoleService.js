import ApiService from "./ApiService";
// Create Role
export const addRole = async (data) => {
    try {
        const response = await ApiService.fetchData({
            url: '/lazy-link/create/role',
            method: 'post',
            data
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export const EditRole = async (id, data) => {
    console.log(id, data);
    try {
        const response = await ApiService.fetchData({
            url: `/lazy-link/role/edit/${id}`,
            method: 'put',
            data
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export const removeRole = async (id) => {
    try {
        const response = await ApiService.fetchData({
            url: `/lazy-link/role/delete/${id}`,
            method: 'put',
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

// Get Users
export const getAllRoles = async () => {
    try {
        const response = await ApiService.fetchData({
            url: '/lazy-link/roles',
            method: 'get'
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export const getAllPermission = async () => {
    try {
        const response = await ApiService.fetchData({
            url: '/lazy-link/permissions',
            method: 'get'
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}
// Get Role Permissions
export const getRolePermissions = async () => {
    try {
        const response = await ApiService.fetchData({
            url: '/lazy-link/role/permissions',
            method: 'get'
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

// Update Role Permissions
export const updateRolePermissions = async (roles) => {
    try {
        const response = await ApiService.fetchData({
            url: `/lazy-link/role/permissions`,
            method: 'post',
            data: { roles }
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}


