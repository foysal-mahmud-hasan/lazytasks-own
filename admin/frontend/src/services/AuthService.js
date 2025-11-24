import ApiService from './ApiService'
import appConfig from "../configs/app.config";
import axios from "axios";

export async function apiSignIn(data) {
    const response = await fetch(`${appConfig.liveApiUrl}/jwt-auth/login`, {
        method: 'POST',
        headers: {
            'Content-type': 'application/json; charset=UTF-8',
        },
        body: JSON.stringify(data),
    }).then((response) => response.json())
        .then((responseJson) => {
            return responseJson;
        })
        .catch((error) => {
            console.error(error);
        });

    return response;

}

export async function googleSignIn(data) {
    const response = await fetch(`${appConfig.liveApiUrl}/google/login`, {
        method: 'POST',
        headers: {
            'Content-type': 'application/json; charset=UTF-8',
        },
        body: JSON.stringify(data),
    }).then((response) => response.json())
        .then((responseJson) => {
            return responseJson;
        })
        .catch((error) => {
            console.error(error);
        });

    return response;

}

export async function getTokenAfterAdminPanelLogin() {

    const response = await fetch(`${appConfig.liveApiUrl}/admin/after-login/token`, {
        method: 'GET',
        headers: {
            'Content-type': 'application/json; charset=UTF-8',
            'Access-Control-Allow-Origin': '*'
        },
    }).then((response) => response.json())
        .then((responseJson) => {
            return responseJson;
        })
        .catch((error) => {
            console.error(error);
        });

    return response;

}

export async function apiSignUp(data) {
    try {
        const response = await ApiService.fetchData({
            url: '/sign-up',
            method: 'post',
            data,
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export async function getAllMembers(data) {
    try {
        const response = await ApiService.fetchData({
            url: '/all-members',
            method: 'get',
            params: data,
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

export async function getAllInvitedMembers(data) {
    try {
        const response = await ApiService.fetchData({
            url: '/all-invited-members',
            method: 'get',
            params: data,
        })
        return response.data;
    } catch (error) {
        return error.message;
    }
}

// Update User

export const updateUser = async (id, data) => {

    try {
        const response = await ApiService.fetchData({
            url: `/users/edit/${id}`,
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
        return error.message
    }
}

export const updateUserRole = async (id, data) => {

    try {
        const response = await ApiService.fetchData({
            url: `/user/role/edit/${id}`,
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
        return error.message
    }
}

export const getUser = async (id) => {
    try {
        const response = await ApiService.fetchData({
            url: `/users/show/${id}`,
            method: 'get',
        })
        return response.data;

    } catch (error) {
        return error.message;
    }
}

export async function apiSignOut(data) {

    try {
        const response = await ApiService.fetchData({
            url: `/logout`,
            method: 'post',
        })

        return response.data;

    } catch (error) {
        return error.message;
    }
    /*try {
        const response = await axios.get(`${appConfig.liveApiUrl}/logout`, {
            method: 'get',
            headers: {
                "Content-Type": `application/json`,
            },
            // body: JSON.stringify(data),
        }).then(function (response) {
            console.log(response)
            return response.data;
        }).catch(function (errors){

            return errors.message;
        });
        console.log(response)
        return response;
    } catch (error) {

        return error.message;
    }*/
}

export async function apiForgotPassword(data) {
    const response = await fetch(`${appConfig.liveApiUrl}/forget-password-request`, {
        method: 'POST',
        headers: {
            'Content-type': 'application/json; charset=UTF-8',
        },
        body: JSON.stringify(data),
    }).then((response) => response.json())
        .then((responseJson) => {
            return responseJson;
        })
        .catch((error) => {
            console.error(error);
        });

    return response;
}

export async function apiResetPassword(data) {
    return ApiService.fetchData({
        url: '/reset-password',
        method: 'post',
        data,
    })
}
