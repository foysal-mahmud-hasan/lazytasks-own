import React, { Fragment, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Container, Grid, ScrollArea, Tabs, Tooltip } from '@mantine/core';
import { hasPermission } from "../ui/permissions";
import GeneralSettings from "./Partial/GeneralSettings";
import ManagedTags from "./Partial/ManagedTags";
import PortalSettings from './Partial/PortalSettings';
import SerialSettings from './Partial/SerialSettings';
import AddonSettings from '../Settings/AddonSettings';
import { translate } from '../../utils/i18n';
import SMTPConfiguration from '../Notification/Template/SMTPConfiguration';
import NotificationSettings from './Partial/NotificationSettings';
import SocialLoginSettings from './Partial/SocialLoginSettings';

const Settings = () => {
    const { loggedInUser } = useSelector((state) => state.auth.session);
    const { socialLoginConfiguration } = useSelector((state) => state.settings.setting);

    const permissions = loggedInUser?.llc_permissions || [];
    const hasGeneral = permissions.length > 0 && permissions.includes('general-settings');
    const hasRolePermission = permissions.length > 0 && permissions.includes('manage-rolls-permissions');
    const hasManageTags = permissions.length > 0 && permissions.includes('manage-tags');

    // Determine where to go based on permissions
    let settingsLink = null;

    if (hasGeneral && hasRolePermission && hasManageTags) {
        settingsLink = 'general-setting';
    } else if (hasGeneral) {
        settingsLink = 'general-setting';
    } else if (hasRolePermission) {
        settingsLink = 'roles-permissions';
    } else if (hasManageTags) {
        settingsLink = 'managed-tags';
    }

    return (
        <Fragment>

            <ScrollArea scrollbars="y" scrollbarSize={4}
                className={`w-full pr-1 ${appLocalizer?.is_admin ? 'h-[calc(100vh-296px)]' : 'h-[calc(100vh-250px)]'}`}
                offsetScrollbars={true}
            >

                <Tabs color="orange" orientation="vertical" defaultValue={settingsLink}>
                    <Tabs.List>
                        {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['general-settings']) && (
                            <>
                                <Tabs.Tab value="general-setting" >
                                    {translate('General Settings')}
                                </Tabs.Tab>
                                <Tabs.Tab value="portal-settings" >
                                    {translate('Portal Settings')}
                                </Tabs.Tab>
                            </>
                        )}
                        {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['manage-notifications']) && (
                            <Tabs.Tab value="notification-settings" >
                                {translate('Notification Settings')}
                            </Tabs.Tab>
                        )}
                        {/* {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['manage-rolls-permissions']) && (
                            <Tabs.Tab value="roles-permissions" >
                                {translate('Roles & Permission')}
                            </Tabs.Tab>
                        )} */}
                        {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['addon-install']) && (
                            <Tabs.Tab value="addons" >
                                {translate('Addons')}
                            </Tabs.Tab>
                        )}
                        {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['manage-tags']) && (
                            <Tabs.Tab value="managed-tags" >
                                {translate('Manage Tags')}
                            </Tabs.Tab>
                        )}
                        {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['general-settings']) && (
                            <Tabs.Tab value="serial-no-settings" >
                                {translate('Task Reference No')}
                            </Tabs.Tab>
                        )}
                        {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['addon-install']) && (
                            socialLoginConfiguration?.social_login_enabled ? (
                                <Tabs.Tab value="social-login">
                                    {translate('Social Login')}
                                </Tabs.Tab>
                            ) : (
                                <Tooltip label={translate('Please activate social login from Addons')} withArrow>
                                    <Tabs.Tab value="social-login" disabled>
                                        {translate('Social Login')}
                                    </Tabs.Tab>
                                </Tooltip>
                            )
                        )}


                    </Tabs.List>
                    {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['general-settings']) && (
                        <>
                            <Tabs.Panel value="general-setting" px={'md'}>
                                <Grid columns={12}>
                                    <Grid.Col span={12}>
                                        <GeneralSettings />
                                    </Grid.Col>
                                </Grid>
                            </Tabs.Panel>
                            <Tabs.Panel value="portal-settings" px={'md'}>
                                <Grid columns={12}>
                                    <Grid.Col span={12}>
                                        <PortalSettings />
                                    </Grid.Col>
                                </Grid>
                            </Tabs.Panel>
                        </>
                    )}
                    {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['manage-rolls-permissions']) && (
                        <Tabs.Panel value="notification-settings" px={'md'}>
                            <Grid columns={12}>
                                <Grid.Col span={12}>
                                    <NotificationSettings />
                                </Grid.Col>
                            </Grid>
                        </Tabs.Panel>
                    )}
                    {/* {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['manage-rolls-permissions']) && (
                    <Tabs.Panel value="roles-permissions" px={'md'}>
                        <Grid columns={12}>
                            <Grid.Col span={12}>
                                <RolesPermission />
                            </Grid.Col>
                        </Grid>
                    </Tabs.Panel>
                    )} */}
                    {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['addon-install']) && (
                        <Tabs.Panel value="addons" px={'md'}>
                            <Grid columns={12}>
                                <Grid.Col span={12}>
                                    <AddonSettings />
                                </Grid.Col>
                            </Grid>
                        </Tabs.Panel>
                    )}
                    {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['manage-tags']) && (
                        <Tabs.Panel value="managed-tags" px={'md'}>
                            <Grid columns={12}>
                                <Grid.Col span={12}>
                                    <ManagedTags />
                                </Grid.Col>
                            </Grid>
                        </Tabs.Panel>
                    )}
                    {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['general-settings']) && (
                        <Tabs.Panel value="serial-no-settings" px={'md'}>
                            <Grid columns={12}>
                                <Grid.Col span={12}>
                                    <SerialSettings />
                                </Grid.Col>
                            </Grid>
                        </Tabs.Panel>
                    )}
                    {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['addon-install']) && (
                        <Tabs.Panel value="social-login" px={'md'}>
                            <Grid columns={12}>
                                <Grid.Col span={12}>
                                    <SocialLoginSettings />
                                </Grid.Col>
                            </Grid>
                        </Tabs.Panel>
                    )}

                </Tabs>


            </ScrollArea>
        </Fragment>
    );
};

export default Settings;
