import {createAsyncThunk, createSlice} from '@reduxjs/toolkit'
import {apiSignUp, getAllMembers, getAllInvitedMembers, getUser, updateUser, updateUserRole} from "../../services/AuthService";

export const fetchAllMembers = createAsyncThunk(
    'auth/fetchAllMember',
    async (data) => {
    return getAllMembers(data);
})
export const fetchAllInvitedMember = createAsyncThunk(
    'auth/fetchAllInvitedMember',
    async (data) => {
    return getAllInvitedMembers(data);
})
export const createUser = createAsyncThunk('auth/createUser', async (data) => {
    return apiSignUp(data);
})

//Edit User Thunk
export const editUser = createAsyncThunk(
    'auth/editUser',
    async ({ id, data }) => {
        return updateUser(id, data)
    }
)

export const editUserRole = createAsyncThunk(
    'auth/editUserRole',
    async ({ id, data }) => {
        return updateUserRole(id, data)
    }
)

export const fetchUser = createAsyncThunk('auth/fetchUser', async (id) => {
    return getUser(id);
})
export const initialState = {
    avatar: '',
    user_id: '',
    username: '',
    name: '',
    email: '',
    authority: [],
    roles: [],
    llc_roles: [],
    llc_permissions: [],
    allMembers: [],
    allInvitedMembers: [],
    user : {},
    profileDrawerOpened: false,
    isLoading: false,
}

export const userSlice = createSlice({
    name: 'auth/user',
    initialState,
    reducers: {
        setUser: (_, action) => action.payload,
        userLoggedOut: () => initialState,
        updateIsLoading: (state, action) => {
            state.isLoading = action.payload
        },
        openProfileDrawer: (state) => {
            state.profileDrawerOpened = true
        },
        closeProfileDrawer: (state) => {
            state.profileDrawerOpened = false
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(createUser.fulfilled, (state, action) => {
                return action.payload.data
            })
            .addCase(createUser.rejected, (state, action) => {
                return action.payload
            })
            .addCase(fetchAllMembers.fulfilled, (state, action) => {
                state.allMembers = action.payload.data
            })
            .addCase(fetchAllMembers.rejected, (state, action) => {
                return action.payload
            })
            .addCase(fetchAllInvitedMember.fulfilled, (state, action) => {
                state.allInvitedMembers = action.payload.data
            })
            .addCase(fetchAllInvitedMember.rejected, (state, action) => {
                return action.payload
            })
            .addCase(fetchUser.fulfilled, (state, action) => {
                state.user = action.payload.data
            })
            .addCase(fetchUser.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(editUser.pending, (state) => {
                state.isError = false
                state.isLoading = true
            })
            .addCase(editUser.fulfilled, (state, action) => {
                if(state.allMembers && state.allMembers.length > 0){
                    const indexToUpdate = state.allMembers && state.allMembers.length > 0 && state.allMembers.findIndex(
                        (user) => parseInt(user.id) === parseInt(action.payload.data.id)
                    )
                    state.allMembers[indexToUpdate] = action.payload.data
                }
            })
            .addCase(editUser.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(editUserRole.fulfilled, (state, action) => {
                state.user = action.payload.data
            })

    }
})

export const {
    setUser,
    userLoggedOut,
    updateIsLoading,
    openProfileDrawer,
    closeProfileDrawer,
} = userSlice.actions

export default userSlice.reducer
