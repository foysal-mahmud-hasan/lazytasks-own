import ApiService from "./ApiService";

// Get Users
export const getAllTags = async () => {
    try {
        const response = await ApiService.fetchData({
            url: '/tags',
            method: 'get'
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export const addTag = async (data) => {
    try {
        const response = await ApiService.fetchData({
            url: '/tags/create',
            method: 'post',
            data,
        })
        console.log(response.data)
        return response.data;
    } catch (error) {
        return error.message;
    }
}


export const getTag = async (id) => {
    try {

        const response = await ApiService.fetchData({
            url: `/tags/${id}`,
            method: 'get',
        })
        return response.data;

    } catch (error) {
        return error.message;
    }
}



// Update Tag

export const updateTag = async (id, data) => {

    const response = await ApiService.fetchData({
        url: `/tags/edit/${id}`,
        method: 'put',
        data,
    })

    return response.data;
}

export const removeTag = async (id) => {
    try {

        const response = await ApiService.fetchData({
            url: `/tags/delete/${id}`,
            method: 'put',
        })
        return response.data;

    } catch (error) {
        return error.message;
    }
}

export const restoreFromDeleteTag = async (id) => {
    try {
        const response = await ApiService.fetchData({
            url: `/tags/restore/${id}`,
            method: 'get',
        })
        return response.data;

    } catch (error) {
        return error.message;
    }

}


