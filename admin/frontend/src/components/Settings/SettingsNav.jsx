import React, { useCallback, useEffect, useState } from 'react';
import { Button, Select, Title } from '@mantine/core';
import { useLocation, NavLink, Link } from 'react-router-dom';
import { IconX } from '@tabler/icons-react';
import { useDispatch, useSelector } from "react-redux";
import { hasPermission } from "../ui/permissions";
import { fetchAllCompanies } from "./store/companySlice";
import { fetchAllMembers } from "../../store/auth/userSlice";
import { fetchAllProjects } from "./store/projectSlice";
import { translate } from '../../utils/i18n';
const SettingsNav = () => {
    const location = useLocation();
    const dispatch = useDispatch();
    const { loggedInUser } = useSelector((state) => state.auth.session)
    const { companies } = useSelector((state) => state.settings.company);
    const { projects } = useSelector((state) => state.settings.project);

    useEffect(() => {
        dispatch(fetchAllCompanies());
        dispatch(fetchAllProjects());
    }, []);

    const [selectedCompanyId, setSelectedCompanyId] = useState(null);

    const onCompanyChange = useCallback(
        (e) => {
            if (location.pathname === '/users') {
                if (e && e.value && e.value !== '') {
                    dispatch(fetchAllMembers({ company_id: e.value }));
                    dispatch(fetchAllProjects({ company_id: e.value }));
                    setSelectedCompanyId(e.value);
                } else {
                    dispatch(fetchAllMembers());
                    dispatch(fetchAllProjects());
                    setSelectedCompanyId(null);
                }
            }
            if (location.pathname === '/project') {
                if (e && e.value && e.value !== '' && e.value !== null) {
                    dispatch(fetchAllProjects({ company_id: e.value }));
                } else {
                    console.log('else')
                    dispatch(fetchAllProjects());
                }
            }
        },
        [dispatch],
    );

    const onProjectChange = (e) => {
        if (location.pathname === '/users') {
            if (e && e.value && e.value !== '') {
                dispatch(fetchAllMembers({ project_id: e.value, company_id: selectedCompanyId }));
            } else {
                dispatch(fetchAllMembers({ company_id: selectedCompanyId }));
            }
        }
    };

    document.addEventListener('DOMContentLoaded', function () {
        if (window.lazytaskPremium &&
            hasPermission(loggedInUser && loggedInUser.llc_permissions, ['license-tab'])
        ) {
            window.lazytaskPremium.licenseTabButton();
        }
    }
    );
    useEffect(() => {
        if (window.lazytaskPremium &&
            hasPermission(loggedInUser && loggedInUser.llc_permissions, ['license-tab'])
        ) {
            window.lazytaskPremium.licenseTabButton();
        }
    }, [location]);

    return (
        <>
            <div className="relative flex justify-between mb-3">
                <Title order={4}>
                    {translate('Settings')}
                </Title>
                {/*<Link to="/dashboard" className="text-gray-600 hover:text-gray-800 focus:shadow-none">
                    <IconX size={24} color="#202020" /> 
                </Link>*/}
            </div>
            <div className="relative flex mb-5 space-x-3">
                {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['general-settings']) &&
                    <NavLink to="/settings" className="nav-link" activeClassName="active-link">
                        <Button
                            size="sm"
                            color={location.pathname === '/settings' ? "#39758D" : "#EBF1F4"}
                            styles={{
                                label: {
                                    color: location.pathname === '/settings' ? "#fff" : "#000"
                                }
                            }}
                        >
                            {translate('General')}
                        </Button>
                    </NavLink>
                }
                {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['manage-workspace-projects']) &&
                    <NavLink to="/workspace/projects" className="nav-link" activeClassName="active-link">
                        <Button
                            size="sm"
                            color={location.pathname === '/workspace/projects' ? "#39758D" : "#EBF1F4"}
                            styles={{
                                label: {
                                    color: location.pathname === '/workspace/projects' ? "#fff" : "#000"
                                }
                            }}
                        >
                            {translate('Workspace & Projects')}
                        </Button>
                    </NavLink>
                }
                {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['manage-rolls-permissions']) &&
                    <NavLink to="/roles/permissions" className="nav-link" activeClassName="active-link">
                        <Button
                            size="sm"
                            color={location.pathname === '/roles/permissions' ? "#39758D" : "#EBF1F4"}
                            styles={{
                                label: {
                                    color: location.pathname === '/roles/permissions' ? "#fff" : "#000"
                                }
                            }}
                        >
                            {translate('Roles & Permissions')}
                        </Button>
                    </NavLink>
                }
                {/* {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['superadmin','admin','director']) &&
                <NavLink to="/users" className="nav-link" activeClassName="active-link">
                    <Button
                        size="sm"
                        color={location.pathname === '/users' ? "#39758D" : "#EBF1F4"}
                        styles={{
                            label: {
                                color: location.pathname === '/users' ? "#fff" : "#000"
                            }
                        }}
                    >
                        Users
                    </Button>
                </NavLink>
                } */}
                {/*{hasPermission(loggedInUser && loggedInUser.llc_permissions, ['superadmin']) &&
                <NavLink to="/workspace" className="nav-link" activeClassName="active-link">
                    <Button 
                        size="sm"
                        color={location.pathname === '/workspace' ? "#39758D" : "#EBF1F4"}
                        styles={{
                            label: {
                                color: location.pathname === '/workspace' ? "#fff" : "#000"
                            }
                        }}
                    >
                        Workspace
                    </Button>
                </NavLink>
                }*/}
                {/*{hasPermission(loggedInUser && loggedInUser.llc_permissions, ['superadmin', 'admin', 'director']) &&
                <NavLink to="/project" className="nav-link" activeClassName="active-link">
                    <Button 
                        size="sm"
                        color={location.pathname === '/project' ? "#39758D" : "#EBF1F4"}
                        styles={{
                            label: {
                                color: location.pathname === '/project' ? "#fff" : "#000"
                            }
                        }}
                    >
                        Projects
                    </Button>
                </NavLink>
                }*/}
                {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['manage-notifications']) &&
                    <NavLink to="/notification-template" className="nav-link" activeClassName="active-link">
                        <Button
                            size="sm"
                            color={location.pathname === '/notification-template' ? "#39758D" : "#EBF1F4"}
                            styles={{
                                label: {
                                    color: location.pathname === '/notification-template' ? "#fff" : "#000"
                                }
                            }}
                        >
                            {translate('Notification Templates')}
                        </Button>
                    </NavLink>
                }

                {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['license-tab']) &&
                    <>
                        { appLocalizer.premiumInstalled==='' && window.appLocalizerPremium === undefined ? (
                            <NavLink to="/license" className="nav-link" activeClassName="active-link">
                                <Button
                                    size="sm"
                                    color={location.pathname === '/license' ? "#39758D" : "#EBF1F4"}
                                    styles={{
                                        label: {
                                            color: location.pathname === '/license' ? "#fff" : "#000"
                                        }
                                    }}
                                >
                                    {translate('License')}
                                </Button>
                            </NavLink>
                        ) : (
                            <div id="lazytask_premium_license_tab_button">
                                {/*for preminum*/}

                            </div>
                        )

                        }
                    </>

                }


                <div className={`flex w-full justify-end gap-2`}>
                    {(location.pathname === '/project' || location.pathname === '/users') &&
                        <Select
                            searchable
                            clearable
                            size="sm"
                            placeholder="Select Workspace"
                            data={companies && companies.length > 0 && companies.map((company) => ({
                                value: company.id,
                                label: company.name
                            }))}
                            // defaultValue="React"
                            allowDeselect
                            onChange={(e, option) => {
                                onCompanyChange(option);
                            }}
                        />
                    }

                    {location.pathname === '/users' &&
                        <Select
                            searchable
                            clearable
                            size="sm"
                            placeholder="Select Project"
                            data={projects && projects.length > 0 && projects.map((project) => ({
                                value: project.id,
                                label: project.name
                            }))}
                            // defaultValue="React"
                            allowDeselect
                            onChange={(e, option) => {
                                onProjectChange(option);
                            }}
                        />
                    }

                </div>
            </div>
        </>

    );
}

export default SettingsNav;
