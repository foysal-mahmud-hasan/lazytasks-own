import { combineReducers } from 'redux'
import settingsReducer from '../components/Settings/store'
import usersReducer from '../reducers/usersSlice';
import workspaceReducer from '../reducers/workspaceSlice';
import projectReducer from '../reducers/projectSlice';
import taskReducer from '../reducers/taskSlice';
import authReducer from './auth';
import baseReducer from './base';
import notificationReducer from '../components/Notification/store';
import myZenReducer from '../components/MyZen/store';

/*const rootReducer = (asyncReducers) => (state, action) => {
    const combinedReducer = combineReducers({
        auth: authReducer,
        users: usersReducer,
        workspace: workspaceReducer,
        project: projectReducer,
        task: taskReducer,
        settings: settingsReducer,
        base: baseReducer,
        ...asyncReducers,
    })
    return combinedReducer(state, action)
}*/

const rootReducer = combineReducers({
    auth: authReducer,
    users: usersReducer,
    workspace: workspaceReducer,
    project: projectReducer,
    task: taskReducer,
    settings: settingsReducer,
    notifications: notificationReducer,
    base: baseReducer,
    zen: myZenReducer,

});

export default rootReducer
