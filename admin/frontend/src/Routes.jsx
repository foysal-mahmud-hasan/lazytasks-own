import React, { useEffect, useMemo, useState } from 'react';
import { Routes, Route, HashRouter, useLocation, browserHistory } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile/Profile';
import ResetPassword from './components/Profile/ResetPassword';
import Settings from './components/Settings/Settings';
import SettingsPanel from './components/Settings/SettingsPanel';
import Workspace from './components/Settings/Workspace';
import Projects from './components/Settings/Projects';
import ProjectDetails from './components/Elements/Project/ProjectDetails';
import { Provider, useDispatch } from 'react-redux';
import store from './store';
import { useSelector } from 'react-redux';
import ProfileEdit from "./components/Profile/ProfileEdit";
import Login from "./components/Login";
import ProtectedRoute from "./route/ProtectedRoute";
import PublicRoute from "./route/PublicRoute";
import MyTask from "./components/MyTask";
import NotificationTemplate from "./components/Notification/Template";
import { onSignInSuccess, setLoggedInUser, setToken } from "./store/auth/sessionSlice";
import { jwtDecode } from "jwt-decode";
import appConfig from "./configs/app.config";
import Cookies from "js-cookie";
import { setUser } from "./store/auth/userSlice";
import ForgetPassword from "./components/Profile/ForgetPassword";
import ChangePassword from "./components/Login/ChangePassword";
import Users from "./components/Settings/Users";
import PremiumRoute from "./route/PremiumRoute";
import WhiteboardRoute from './route/WhiteboardRoute';
import Header from './components/Header';
import SettingMain from "./components/Settings/SettingMain";
import MyZen from "./components/MyZen";
import Onboarding from './components/Onboarding/Onboarding';
import ProjectDetailsList from './components/Elements/Project/ProjectDetailsList';
import ProjectDetailsBoard from './components/Elements/Project/ProjectDetailsBorad';
import ProjectDetailsCalendar from './components/Elements/Project/ProjectDetailsCalendar';
import ProjectDetailsGanttChart from './components/Elements/Project/ProjectDetailsGanttChart';
import NotFound from './components/NotFound';
import { Center, Loader, LoadingOverlay } from '@mantine/core';
import RolesPermission from './components/Settings/Partial/RolesPermission';
import License from "./components/Settings/License";
import ProjectDetailsListByPriority from './components/Elements/Project/ProjectDetailsListByPriority';
import ProjectDetailsListByStatus from './components/Elements/Project/ProjectDetailsListByStatus';
import ProjectDetailsListByMember from './components/Elements/Project/ProjectDetailsListByMember';
import ProjectDetailsListByDueDate from './components/Elements/Project/ProjectDetailsListByDueDate';

// import License from "./view/license/License"

const AppRoutes = () => {

    const dispatch = useDispatch()

    useEffect(() => {
        if (appLocalizer?.is_admin) {
            if (appLocalizer.userResponse.data.token) {
                const user_token = appLocalizer.userResponse.data.token
                dispatch(onSignInSuccess(user_token))
                dispatch(setToken(user_token))
                const decode_token = jwtDecode(user_token)
                if (decode_token.iss === appConfig.liveSiteUrl) {

                    const userData = decode_token.data;

                    const user = {
                        "authority": userData.roles,
                        "loggedUserId": userData.user_id,
                        "name": userData.name,
                        "email": userData.email,
                        "roles": userData.roles,
                        "llc_roles": userData.llc_roles,
                        "llc_permissions": userData.llc_permissions,
                        "avatar": userData.avatar
                    }
                    dispatch(setLoggedInUser(user || {}))
                    Cookies.set('user_id', userData.user_id);
                    dispatch(
                        setUser(
                            user || {
                                avatar: '',
                                loggedUserId: '',
                                name: '',
                                authority: [],
                                email: '',
                                roles: [],
                                llc_roles: [],
                                llc_permissions: [],
                            }
                        )
                    )
                }
            }

        }


    }, [dispatch]);

    const { signedIn, loggedInUser } = useSelector((state) => state.auth.session);

    useEffect(() => {
        window.loggedInUser = loggedInUser;
    }, [loggedInUser]);

    const [premiumRoutes, setPremiumRoutes] = useState([]);
    const [whiteboardRoutes, setWhiteboardRoutes] = useState([]);
    const [routesLoaded, setRoutesLoaded] = useState(false);
    document.addEventListener('DOMContentLoaded', function () {
        if (window.lazytaskPremium) {
            setPremiumRoutes(...premiumRoutes, window.lazytaskPremium.premiumAppRoutes || []);
        }
        if (window.lazytasksWhiteboard) {
            setWhiteboardRoutes(...whiteboardRoutes, window.lazytasksWhiteboard.whiteboardRoutes || []);
        }
        setRoutesLoaded(true);
    });

    // Show loader until routes are loaded
    if (!routesLoaded) {
        return (
            <Center style={{ height: '100vh' }}>
                <LoadingOverlay visible={true} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
            </Center>
        );
    }

    return (
        <>
            <HashRouter>
                <Routes>
                    {/*<Route path="/" element={<ProtectedRoute authenticated={signedIn} />}>*/}
                    <Route path="/" element={<ProtectedWithHeader signedIn={signedIn} />}>
                        {/*<Route path="/" element={<Dashboard />} />*/}

                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/my-task" element={<MyTask />} />
                        <Route path="/my-zen" element={<MyZen />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/profile/:id" element={<ProfileEdit />} />
                        <Route path="/resetpassword" element={<ResetPassword />} />
                        <Route path="/" element={<SettingMain />}>
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/workspace/projects" element={<SettingsPanel />} />
                            <Route path="/roles/permissions" element={<RolesPermission />} />
                            <Route path="/users" element={<Users />} />
                            <Route path="/workspace" element={<Workspace />} />
                            <Route path="/project" element={<Projects />} />
                            { appLocalizer.premiumInstalled==='' && window.appLocalizerPremium === undefined &&
                                <Route path="/license" element={<License />} />
                            }

                            {premiumRoutes.length > 0 && premiumRoutes.map((route, index) => (
                                <Route
                                    key={route.key + index}
                                    path={route.path}
                                    element={
                                        <PremiumRoute
                                            routeKey={route.key}
                                            component={route.component}
                                            {...route.meta}
                                        />
                                    }
                                />
                            ))}
                        </Route>

                        <Route path="/notification-template" element={<NotificationTemplate />} />
                        <Route path="/" element={<ProjectDetails />}>
                            <Route path="/project/task/list/:id" element={<ProjectDetailsList />} />
                            <Route path="/project/task/board/:id" element={<ProjectDetailsBoard />} />
                            <Route path="/project/task/calendar/:id" element={<ProjectDetailsCalendar />} />
                            <Route path="/project/task/gantt/:id" element={<ProjectDetailsGanttChart />} />
                            <Route path="/project/task/list/by/priority/:id" element={<ProjectDetailsListByPriority />} />
                            <Route path="/project/task/list/by/status/:id" element={<ProjectDetailsListByStatus />} />
                            <Route path="/project/task/list/by/member/:id" element={<ProjectDetailsListByMember />} />
                            <Route path="/project/task/list/by/duedate/:id" element={<ProjectDetailsListByDueDate />} />
                            {whiteboardRoutes.length > 0 && whiteboardRoutes.map((white_route, index) => (
                                white_route.key === 'whiteboard' && (
                                    <Route
                                        key={white_route.key + index}
                                        path={white_route.path}
                                        element={
                                            <WhiteboardRoute
                                                routeKey={white_route.key}
                                                component={white_route.component}
                                                {...white_route.meta}
                                            />
                                        }
                                    />
                                )
                            ))}
                        </Route>

                    </Route>
                    <Route path="/" element={<ProtectedWithoutHeader signedIn={signedIn} />}>
                        {whiteboardRoutes.length > 0 && whiteboardRoutes.map((white_route, index) => (
                            white_route.key === 'whiteboard-fullscreen' && (
                                <Route
                                    key={white_route.key + index}
                                    path={white_route.path}
                                    element={
                                        <WhiteboardRoute
                                            routeKey={white_route.key}
                                            component={white_route.component}
                                            {...white_route.meta}
                                        />
                                    }
                                />
                            )
                        ))}
                    </Route>
                    <Route path="/" element={<PublicRoute authenticated={signedIn} />}>
                        <Route path="/" element={<Login />} />
                        <Route path="/lazy-login" element={<Login />} />
                        <Route path="/forget-password" element={<ForgetPassword />} />
                        <Route path="/change-password" element={<ChangePassword />} />
                    </Route>

                    {/*<Route path="/project/project-details" element={<ProjectDetails />} />*/}
                    {/*<Route path="/project/project-board" element={<ProjectDetails />} />*/}

                    {/* Fallback route for unmatched paths */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </HashRouter>
        </>
    );
};

function ProtectedWithHeader({ element, signedIn }) {
    return (
        <>
            <Header />
            <ProtectedRoute element={element} authenticated={signedIn} />
        </>
    );
}
function ProtectedWithoutHeader({ element, signedIn }) {
    return (
        <ProtectedRoute element={element} authenticated={signedIn} />
    );
}

export default AppRoutes;
