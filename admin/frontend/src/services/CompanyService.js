import ApiService from "./ApiService";

// Get Users
export const getAllCompanies = async () => {
    try {
        const response = await ApiService.fetchData({
            url: '/companies',
            method: 'get'
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export const addCompany = async (data) => {
    try {
        const response = await ApiService.fetchData({
            url: '/companies/create',
            method: 'post',
            data,
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}


export const getCompany = async (id) => {
    try {
        const response = await ApiService.fetchData({
            url: `/companies/show/${id}`,
            method: 'get',
        })
        return response.data;

    } catch (error) {
        return error.message;
    }
}



// Update Company

export const updateCompany = async (id, data) => {

    const response = await ApiService.fetchData({
        url: `/companies/edit/${id}`,
        method: 'put',
        data,
    })

    return response.data;
}

export const removeCompany = async (id, data) => {
    try {

        const response = await ApiService.fetchData({
            url: `/companies/delete/${id}`,
            method: 'put',
            data
        })
        return response.data;

    } catch (error) {
        return error.message;
    }
}

export const restoreFromDeleteCompany = async (id) => {
    try {
        const response = await ApiService.fetchData({
            url: `/companies/restore/${id}`,
            method: 'get',
        })
        return response.data;

    } catch (error) {
        return error.message;
    }

}


export const getCompanyMembers = async (data) => {
    try {
        const response = await ApiService.fetchData({
            url: `/companies/masterData/members/data`,
            method: 'get',
            params: data,
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

