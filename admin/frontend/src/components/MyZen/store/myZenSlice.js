import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import {addMyZen, getAllMyZens, getMyZen, updateMyZen} from "../../../services/MyZenService";

export const fetchAllMyZens = createAsyncThunk(
    'myZen/fetchAllMyZens',
    async () => {
        return getAllMyZens()
    }
)
//createNotificationTemplate
export const createMyZen = createAsyncThunk(
    'myZen/createMyZen',
    async (data) => {
        return addMyZen(data)
    }
    )
//fetchNotificationTemplate by id
export const fetchMyZen = createAsyncThunk(
    'myZen/fetchMyZen',
    async (id) => {
        return getMyZen(id)
    }
)

// updateNotificationTemplate by id
export const editMyZen = createAsyncThunk(
    'myZen/editMyZen',
    async ( { id, data } ) => {
        return updateMyZen(id, data)
    }
)


const initialState = {
    myZens: [],
    myZen:{},
    isLoading: false,
    isError: false,
    error: '',
    success: null,
}

const myZenSlice = createSlice({
    name: 'myZen',
    initialState,
    reducers: {
        removeSuccessMessage: (state) => {
            state.success = null
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAllMyZens.pending, (state) => {
                state.isLoading = true
                state.isError = false
            })
            .addCase(fetchAllMyZens.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.myZens = action.payload.data
                console.log(action.payload.data)
            })
            .addCase(fetchAllMyZens.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(createMyZen.pending, (state) => {
                state.isLoading = true
                state.isError = false
            })
            .addCase(createMyZen.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.success = action.payload.message
                state.myZens = state.myZens.map((zen) => {
                        if (zen.id === action.payload.data.id) {
                            return { ...action.payload.data }
                        }

                        return { ...zen }
                    }
                )
                if (action.payload.data && action.payload.data.id && action.payload.data.task_id===null) {
                    state.myZens.push(action.payload.data)
                }
            })
            .addCase(createMyZen.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(fetchMyZen.pending, (state) => {
                state.isLoading = true
                state.isError = false
            })
            .addCase(fetchMyZen.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.myZen = action.payload.data
            })
            .addCase(fetchMyZen.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(editMyZen.pending, (state) => {
                state.isLoading = true
                state.isError = false
            })
            .addCase(editMyZen.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.success = action.payload.message
                state.myZens = state.myZens.map((zen) => {
                    if (zen.id === action.payload.data.id) {
                        return { ...action.payload.data }
                    }
                    return { ...zen }
                }
                )
                console.log(action.payload.requestData)
            })
            .addCase(editMyZen.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })

    },
})
export const {
    removeSuccessMessage
} = myZenSlice.actions
export default myZenSlice.reducer
