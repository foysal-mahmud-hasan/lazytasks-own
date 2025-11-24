import {createAsyncThunk, createSlice} from '@reduxjs/toolkit'
import {getTokenAfterAdminPanelLogin} from "../../services/AuthService";
import BaseService from "../../services/BaseService";
import {REQUEST_HEADER_AUTH_KEY, TOKEN_TYPE} from "../../constants/api.constant";

export const loggedInUserToken = createAsyncThunk('user/token', async () => {
    return getTokenAfterAdminPanelLogin()
})
export const sessionSlice = createSlice({
    name: 'auth/session',
    initialState: {
        token: '',
        signedIn: false,
        loggedInUser: {},
    },
    reducers: {
        onSignInSuccess: (state, action) => {
            state.signedIn = true
            state.token = action.payload
            BaseService.defaults.headers[REQUEST_HEADER_AUTH_KEY] = `${TOKEN_TYPE}${action.payload}`
        },
        onSignOutSuccess: (state) => {
            state.signedIn = false
            state.token = ''
        },
        setToken: (state, action) => {
            state.token = action.payload
        },
        setLoggedInUser: (state, action) => {
            state.loggedInUser = action.payload
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(loggedInUserToken.pending, (state) => {
                state.token = ''
                state.signedIn = false
            })
            .addCase(loggedInUserToken.fulfilled, (state, action) => {
                state.token = action.payload.token
                state.signedIn = true
            })
            .addCase(loggedInUserToken.rejected, (state) => {
                state.token = ''
                state.signedIn = false
            })
    }
})

export const {
    onSignInSuccess,
    onSignOutSuccess,
    setLoggedInUser,
    setToken } =
    sessionSlice.actions

export default sessionSlice.reducer
