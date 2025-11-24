import ApiService from "./ApiService";

// Get All MyZens
export const getAllMyZens = async () => {
    try {
        const response = await ApiService.fetchData({
            url: '/my-zen',
            method: 'get'
        })

        return response.data;
    } catch (error) {
        return error.message;
    }
}

export const addMyZen = async (data) => {
    try {
        const response = await ApiService.fetchData({
            url: '/my-zen/create',
            method: 'post',
            data,
        })
        console.log(response.data)
        return response.data;
    } catch (error) {
        return error.message;
    }
}


export const getMyZen = async (id) => {
    try {

        const response = await ApiService.fetchData({
            url: `/my-zen/${id}`,
            method: 'get',
        })
        return response.data;

    } catch (error) {
        return error.message;
    }
}



// Update MyZen

export const updateMyZen = async (id, data) => {

    const response = await ApiService.fetchData({
        url: `/my-zen/edit/${id}`,
        method: 'put',
        data,
    })

    return response.data;
}



