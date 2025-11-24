import {createAsyncThunk, createSlice} from '@reduxjs/toolkit'
import {getAllRoles, getAllPermission, getRolePermissions, updateRolePermissions, addRole, EditRole, removeRole} from "../../services/RoleService";

export const createRole = createAsyncThunk('role/createRole', async (data) => {
    return addRole(data)
})
export const updateRole = createAsyncThunk('role/updateRole', async ({ id, data}) => {
    return EditRole(id, data)
})
export const deleteRole = createAsyncThunk('role/deleteRole', async (id) => {
    return removeRole(id)
})
export const fetchAllRoles = createAsyncThunk('role/fetchAllRoles', async () => {
    return getAllRoles()
})
export const fetchAllPermission = createAsyncThunk('permission/fetchAllPermission', async () => {
    return getAllPermission()
})
export const fetchRolePermissions = createAsyncThunk(
    'role/fetchRolePermissions',
    async () => {
        return getRolePermissions()
    }
)
export const editRolePermissions = createAsyncThunk(
    'role/editRolePermissions',
    async ({roles }) => {
        return updateRolePermissions(roles)
    }
)
export const roleSlice = createSlice({
    name: 'auth/role',
    initialState: {
        roles: [],
        role:{},
        permissions: [],
        rolePermissions: [],
        isLoading: false,
        isError: false,
        error: '',
        success: null,
    },
    reducers: {
        removeSuccessMessage: (state) => {
            state.success = null
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(createRole.pending, (state) => {
                state.roles = []
                state.isError = true
            })
            .addCase(createRole.fulfilled, (state, action) => {
                state.roles = action.payload.data
                state.isError = false
                state.success = 'Successfully created role.'
            })
            .addCase(createRole.rejected, (state) => {
                state.isError = true
            })
            .addCase(fetchAllRoles.pending, (state) => {
                state.roles = []
                state.isError = true
            })
            .addCase(fetchAllRoles.fulfilled, (state, action) => {
                state.roles = action.payload.data
                state.isError = false
                state.success = 'Successfully fetched roles.'
            })
            .addCase(fetchAllRoles.rejected, (state) => {
                state.isError = true
            })
            .addCase(updateRole.pending, (state) => {
                state.roles = []
                state.isError = true
            })
            .addCase(updateRole.fulfilled, (state, action) => {
                state.roles = action.payload.data
                state.isError = false
                state.success = 'Successfully created role.'
            })
            .addCase(updateRole.rejected, (state) => {
                state.isError = true
            })
            .addCase(deleteRole.pending, (state) => {
                state.roles = []
                state.isError = true
            })
            .addCase(deleteRole.fulfilled, (state, action) => {
                state.roles = action.payload.data
                state.isError = false
                state.success = 'Successfully created role.'
            })
            .addCase(deleteRole.rejected, (state) => {
                state.isError = true
            })
            .addCase(fetchAllPermission.pending, (state) => {
                state.permissions = []
                state.isError = true
            })
            .addCase(fetchAllPermission.fulfilled, (state, action) => {
                state.permissions = action.payload.data
                state.isError = false
                state.success = 'Successfully fetched permissions.'
            })
            .addCase(fetchAllPermission.rejected, (state) => {
                state.isError = true
            })
            .addCase(fetchRolePermissions.pending, (state) => {
                state.rolePermissions = []
                state.isError = false
            })
            .addCase(fetchRolePermissions.fulfilled, (state, action) => {
                state.rolePermissions = action.payload.data
                state.isError = false
            })
            .addCase(fetchRolePermissions.rejected, (state) => {
                state.isError = true
            })
            .addCase(editRolePermissions.fulfilled, (state, action) => {
                state.rolePermissions = action.payload.data.permissions;
                state.isError = false;
                state.success = 'Permissions updated successfully.';
            })
            .addCase(editRolePermissions.rejected, (state) => {
                state.isError = true;
                state.error = 'Failed to update permissions.';
            })
    }
})

export const {
    removeSuccessMessage
}=roleSlice.actions

export default roleSlice.reducer
