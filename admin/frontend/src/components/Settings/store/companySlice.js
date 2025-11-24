import {
    getAllCompanies,
    getCompany,
    addCompany,
    updateCompany,
    removeCompany,
    restoreFromDeleteCompany,
    getCompanyMembers
} from '../../../services/CompanyService'

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

export const fetchAllCompanies = createAsyncThunk(
    'companies/fetchAllCompany',
    async () => {
        return getAllCompanies()
    }
)

export const createCompany = createAsyncThunk('companies/createCompany', async (data) => {
    return addCompany(data)
})


// Fetch Single User
export const fetchCompany = createAsyncThunk('companies/fetchCompany', async (id) => {
    return getCompany(id)
})


//Edit User Thunk
export const editCompany = createAsyncThunk(
    'companies/editCompany',
    async ({ id, data }) => {
        console.log(id, data)
        return updateCompany(id, data)
    }
)

// Delete Company thunk
export const deleteCompany = createAsyncThunk('companies/deleteCompany', async ({id, data}) => {
    return removeCompany(id, data);
})

// Restore Company thunk
export const restoreCompany = createAsyncThunk('companies/restoreCompany', async (id) => {
    const comapny = restoreFromDeleteCompany(id)
    return comapny
})
//Edit User Thunk
export const fetchCompanyMembers = createAsyncThunk(
    'companies/fetchCompanyMembers',
    async (data) => {
        return getCompanyMembers(data);
    }
)

const initialState = {
    companies: [],
    company:{},
    companyMembers:[],
    isLoading: false,
    isError: false,
    error: '',
    success: null,
}

const companySlice = createSlice({
    name: 'company',
    initialState,
    reducers: {
        setEditableCompany: (state, action) => {
            state.company = state.companies.find(
                (company) => company.id === action.payload
            )
        },
        removeSuccessMessage: (state) => {
            state.success = null
        },
        removeCompanyFromState: (state,action) => {
            state.company = action.payload
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAllCompanies.pending, (state) => {
                state.isLoading = true
                state.isError = false
            })
            .addCase(fetchAllCompanies.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.companies = action.payload && action.payload.data && action.payload.data
            })
            .addCase(fetchAllCompanies.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(createCompany.pending, (state) => {
                state.isLoading = true
                state.isError = false
            })
            .addCase(createCompany.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                if(action.payload && action.payload.status && action.payload.status === 200){
                    state.companies.push(action.payload && action.payload.data && action.payload.data)
                    state.company = action.payload && action.payload.data && action.payload.data
                    state.success =action.payload && action.payload.data && `${action.payload.data.name} Created Successfully`
                }
            })
            .addCase(createCompany.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(fetchCompany.pending, (state) => {
                state.isLoading = true
                state.isError = false
            })
            .addCase(fetchCompany.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.company = action.payload && action.payload.data ? action.payload.data:{}
            })
            .addCase(fetchCompany.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(deleteCompany.pending, (state) => {
                state.isError = false
                state.isLoading = true
            })
            .addCase(deleteCompany.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                if(action.payload.status && action.payload.status === 200){
                    state.companies = state.companies.filter(company => parseInt(company.id) !== parseInt(action.payload.data.id))
                    state.success = `${action.payload.data.name} Deleted Successfully`
                }
            })
            .addCase(deleteCompany.rejected, (state, action) => {
                state.isLoading = false
                state.isError = true
                state.error = action.error?.message
            })
            .addCase(restoreCompany.pending, (state) => {
                state.isLoading = true
                state.isError = false
            })
            .addCase(restoreCompany.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                const indexToUpdate = state.companies.findIndex(
                    (company) => parseInt(company.id) === parseInt(action.payload.data.id)
                )

                state.companies[indexToUpdate] = action.payload.data
                state.success = `${action.payload.data.name} Restore Successfully`
            })
            .addCase(restoreCompany.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(editCompany.pending, (state) => {
                state.isLoading = true
                state.isError = false
            })
            .addCase(editCompany.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                if(action.payload && action.payload.status && action.payload.status === 200){
                    const indexToUpdate = state.companies.findIndex(
                        (company) => parseInt(company.id) === parseInt(action.payload.data.id)
                    )
                    state.companies[indexToUpdate] = action.payload.data
                    state.company={ ...action.payload.data }
                    state.success = `${action.payload.data.name} Update Successfully`
                }
            })
            .addCase(editCompany.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(fetchCompanyMembers.pending, (state) => {
                state.isLoading = true
                state.isError = false
            })
            .addCase(fetchCompanyMembers.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.companyMembers = action.payload && action.payload.data ? action.payload.data : []
            })
            .addCase(fetchCompanyMembers.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
    },
})
export const {
    setEditableCompany,
    removeSuccessMessage,
    removeCompanyFromState,
} = companySlice.actions
export default companySlice.reducer
