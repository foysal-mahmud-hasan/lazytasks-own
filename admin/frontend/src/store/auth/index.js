import { combineReducers } from '@reduxjs/toolkit'
import sessionReducer from './sessionSlice'
import userReducer from './userSlice'
import roleReducer from './roleSlice'

const reducer = combineReducers({
    session: sessionReducer,
    user: userReducer,
    role: roleReducer,
})

export default reducer
