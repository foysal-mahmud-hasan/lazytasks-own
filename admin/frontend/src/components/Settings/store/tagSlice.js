import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import {addTag, getAllTags, getTag, removeTag, restoreFromDeleteTag, updateTag} from "../../../services/TagService";

export const fetchAllTags = createAsyncThunk(
    'tags/fetchAllTag',
    async () => {
        return getAllTags()
    }
)

export const createTag = createAsyncThunk('tags/createTag', async (data) => {
    return addTag(data)
})


// Fetch Single User
export const fetchTag = createAsyncThunk('tags/fetchTag', async (id) => {
    return getTag(id)
})


//Edit User Thunk
export const editTag = createAsyncThunk(
    'tags/editTag',
    async ({ id, data }) => {
        return updateTag(id, data)
    }
)

// Delete Tag thunk
export const deleteTag = createAsyncThunk('tags/deleteTag', async (id) => {
    return removeTag(id);
})

// Restore Tag thunk
export const restoreTag = createAsyncThunk('tags/restoreTag', async (id) => {
    return restoreFromDeleteTag(id)
})


const initialState = {
    tags: [],
    tag:{},
    isLoading: false,
    isError: false,
    error: '',
    success: null,
}

const tagSlice = createSlice({
    name: 'tag',
    initialState,
    reducers: {
        setEditableTag: (state, action) => {
            state.tag = state.tags.find(
                (tag) => tag.id === action.payload
            )
        },
        removeSuccessMessage: (state) => {
            state.success = null
        },
        removeTagFromState: (state,action) => {
            state.tag = action.payload
        },
        addNewTag: (state, action) => {
            const exists = state.tags.find(tag => tag.id === action.payload.id);
            if (!exists) {
                state.tags.push(action.payload);
            }
            
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAllTags.pending, (state) => {
                state.isLoading = true
                state.isError = false
            })
            .addCase(fetchAllTags.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.tags = action.payload.data
            })
            .addCase(fetchAllTags.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(createTag.pending, (state) => {
                state.isLoading = true
                state.isError = false
            })
            .addCase(createTag.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                const newTag = action.payload.data
                const exists = state.tags.some(tag => tag.name.toLowerCase() === newTag.name.toLowerCase())
                if (!exists) {
                    state.tags.push(action.payload.data)
                }
                state.tag = action.payload.data
                state.success = `${action.payload.data.name} Created Successfully`
            })
            .addCase(createTag.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(fetchTag.pending, (state) => {
                state.isLoading = true
                state.isError = false
            })
            .addCase(fetchTag.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.tag = action.payload.data
            })
            .addCase(fetchTag.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(deleteTag.pending, (state) => {
                state.isError = false
                state.isLoading = true
            })
            .addCase(deleteTag.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false

                state.tags = state.tags.filter(tag => parseInt(tag.id) !== parseInt(action.payload.data.id))

                state.success = `${action.payload.data.name} Deleted Successfully`
            })
            .addCase(deleteTag.rejected, (state, action) => {
                state.isLoading = false
                state.isError = true
                state.error = action.error?.message
            })
            .addCase(restoreTag.pending, (state) => {
                state.isLoading = true
                state.isError = false
            })
            .addCase(restoreTag.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                const indexToUpdate = state.tags.findIndex(
                    (tag) => tag.id === action.payload.data.id
                )

                state.tags[indexToUpdate] = action.payload.data
                state.success = `${action.payload.data.name} Restore Successfully`
            })
            .addCase(restoreTag.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(editTag.pending, (state) => {
                state.isLoading = true
                state.isError = false
            })
            .addCase(editTag.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                if(action.payload.data && action.payload.data.id){
                    state.tags = state.tags.map((tag) => {
                        if(parseInt(tag.id) === parseInt(action.payload.data.id)){
                            return action.payload.data
                        }
                        return tag
                    })
                }
                state.tag={}
                state.success = `${action.payload.data.name} Update Successfully`
            })
            .addCase(editTag.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
    },
})
export const {
    setEditableTag,
    removeSuccessMessage,
    removeTagFromState,
    addNewTag,
} = tagSlice.actions
export default tagSlice.reducer
