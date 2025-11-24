import { combineReducers } from 'redux'
import myZenSlice from './myZenSlice'
const reducer = combineReducers({
    myzen: myZenSlice,
})
export default reducer