
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import {
    getSettings,
    Lazytask_getConfig,
    Lazytask_updateConfig,
    Lazytask_updateSetting,
    getNotifications,
    notificationStatusChange,
    allNotificationStatusChange,
    getTimezoneOptions,
    saveFeedbackForm,
    Lazytask_updatePortalSetting,
    editLicenseModalStatus,
    installAddon,
    deactivateAddon,
    enableDisableSocialLogin
} from "../../../services/SettingService";


export const fetchSettings = createAsyncThunk(
    'setting/fetchSettings',
    async () => {
        return getSettings()
    }
)

export const editSetting = createAsyncThunk(
    'setting/editSetting',
    async ({data}) => {
    return Lazytask_updateSetting(data)
})

export const editPortalSetting = createAsyncThunk(
    'setting/editPortalSetting',
    async ({data}) => {
        console.log(data);
    return Lazytask_updatePortalSetting(data)
})

export const fatchLazytasksConfig = createAsyncThunk(
    'setting/fatchLazytasksConfig',
    async () => {
    return Lazytask_getConfig()
})

export const editLazytasksConfig = createAsyncThunk(
    'setting/editLazytasksConfig',
    async ({data}) => {
    return Lazytask_updateConfig( data )
})

export const fetchNotifications = createAsyncThunk(
    'setting/fetchNotifications',
    async (data) => {
        return getNotifications(data);
    }
)

export const markNotificationAsRead = createAsyncThunk(
    'setting/markNotificationAsRead',
    async ({id, data}) => {
        return notificationStatusChange(id, data);
    }
)

export const markAllNotificationsAsRead = createAsyncThunk(
    'setting/markAllNotificationsAsRead',
    async (data) => {
        return allNotificationStatusChange(data);
    }
)

export const fetchTimezoneOptions = createAsyncThunk(
    'setting/fetchTimezoneOptions',
    async (data) => {
        return getTimezoneOptions(data);
    }
)

export const sendFeedbackForm = createAsyncThunk(
    'setting/sendFeedbackForm',
    async (data) => {
        return saveFeedbackForm(data);
    }
)

export const updateLicenseModalStatus = createAsyncThunk(
    'setting/updateLicenseModalStatus',
    async (id) => {
        return editLicenseModalStatus(id);
    }
)

export const installAddonPlugin = createAsyncThunk(
    'setting/installAddonPlugin',
    async (data) => {
        return installAddon(data);
    }
)

export const deactivateAddonPlugin = createAsyncThunk(
    'setting/deactivateAddonPlugin',
    async (data) => {
        return deactivateAddon(data);
    }
)

export const activateSocialLogin = createAsyncThunk(
    'setting/activateSocialLogin',
    async (data) => {
        return enableDisableSocialLogin(data);
    }
)


const initialState = {
    settings: [],
    currentTimezone: '',
    serialSettings: {},
    portalSettings: {},
    notifications: [],
    lazytasksConfig:{},
    lazytasksSiteSettings:{},
    whiteboardAddonInstalled: false,
    socialLoginConfiguration: {},
    is_wpsms_active: false,
    is_lazytasks_premium_active: false,
    isSocialLoginEnabled: false,
    whiteboardAddonState: '',
    isLoading: false,
    isError: false,
    error: '',
    success: null,
}


const settingSlice = createSlice({
    name: 'setting',
    initialState,
    reducers: {
        updateLazytaskSettings: (state, action) => {
            state.settings = action.payload
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSettings.pending, (state) => {
                state.isLoading = true
                state.isError = false
            })
            .addCase(fetchSettings.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.settings = action.payload.data
                state.currentTimezone = action.payload.currentTimezone
                state.serialSettings = action.payload.serialSettings
                state.portalSettings = action.payload.portalSettings
                state.is_wpsms_active = action.payload.is_wpsms_active
                state.is_lazytasks_premium_active = action.payload.is_lazytasks_premium_active
                state.socialLoginConfiguration = action.payload.social_login_settings
                state.whiteboardAddonState = action.payload.whiteboard_addon_state
            })
            .addCase(fetchSettings.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(editSetting.pending, (state) => {
                state.isLoading = true
                state.isError = false
            })
            .addCase(editSetting.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                if(action.payload.status === 200){
                    state.settings= action.payload.data
                    state.currentTimezone = action.payload.currentTimezone
                    state.serialSettings = action.payload.serialSettings
                }
                state.success = `Setting Update Successfully`
            })
            .addCase(editSetting.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(fatchLazytasksConfig.pending, (state) => {
                state.isLoading = true
                state.isError = false
            })
            .addCase(fatchLazytasksConfig.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.lazytasksConfig = action.payload.data
                state.lazytasksSiteSettings = action.payload.settings
                state.socialLoginConfiguration = action.payload.social_login_settings
            })
            .addCase(fatchLazytasksConfig.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(editLazytasksConfig.pending, (state) => {
                // state.isLoading = true
                state.isError = false
            })
            .addCase(editLazytasksConfig.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.lazytasksConfig = action.payload.data
                state.success = `Setting Update Successfully`
            })
            .addCase(editLazytasksConfig.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(fetchNotifications.pending, (state) => {
                state.isLoading = true
                state.isError = false
            })
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.notifications = action.payload.data
            })
            .addCase(fetchNotifications.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(markNotificationAsRead.pending, (state) => {
                state.isLoading = true
                state.isError = false
            })
            .addCase(markNotificationAsRead.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.notifications = action.payload.data
            })
            .addCase(markNotificationAsRead.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(markAllNotificationsAsRead.pending, (state) => {
                state.isLoading = true
                state.isError = false
            })
            .addCase(markAllNotificationsAsRead.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.notifications = action.payload.data
            })
            .addCase(markAllNotificationsAsRead.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(fetchTimezoneOptions.pending, (state) => {
                state.isLoading = true
                state.isError = false
            })
            .addCase(fetchTimezoneOptions.fulfilled, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.timezones = action.payload.data
            })
            .addCase(fetchTimezoneOptions.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(editPortalSetting.pending, (state) => {
                state.isLoading = true
                state.isError = false
            })
            .addCase(editPortalSetting.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isError = false;
                if (action.payload.status === 200) {
                    state.portalSettings = action.payload.data;
                }
                state.success = action.payload.message;
            })
            .addCase(editPortalSetting.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(sendFeedbackForm.pending, (state) => {
                state.isLoading = true
                state.isError = false
            })
            .addCase(sendFeedbackForm.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isError = false;
                state.success = action.payload.message;
            })
            .addCase(sendFeedbackForm.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(installAddonPlugin.pending, (state) => {
                state.isLoading = true
                state.isError = false
            })
            .addCase(installAddonPlugin.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isError = false;
                if (action.payload.status === 200) {
                    state.whiteboardAddonInstalled = true;
                }
                state.success = action.payload.message;
                state.whiteboardAddonState = action.payload.whiteboard_addon_state;
            })
            .addCase(installAddonPlugin.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(deactivateAddonPlugin.pending, (state) => {
                state.isLoading = true
                state.isError = false
            })
            .addCase(deactivateAddonPlugin.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isError = false;
                state.success = action.payload.message;
                state.whiteboardAddonState = action.payload.whiteboard_addon_state;
            })
            .addCase(deactivateAddonPlugin.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })
            .addCase(activateSocialLogin.pending, (state) => {
                state.isLoading = true
                state.isError = false
            })
            .addCase(activateSocialLogin.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isError = false;
                state.success = action.payload.message;
                state.socialLoginConfiguration = action.payload.data;
            })
            .addCase(activateSocialLogin.rejected, (state, action) => {
                state.isLoading = false
                state.isError = false
                state.error = action.error?.message
            })

    },
})
export const {
    updateTaskLists
} = settingSlice.actions
export default settingSlice.reducer
