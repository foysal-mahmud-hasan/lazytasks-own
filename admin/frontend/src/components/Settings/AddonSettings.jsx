import React, { Fragment, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Card, Divider, Grid, Group, Loader, Modal, Stack, Text, ThemeIcon } from '@mantine/core';
import { hasPermission } from "../ui/permissions";
import { showNotification, updateNotification } from "@mantine/notifications";
import { translate } from '../../utils/i18n';
import { IconChalkboard, IconChalkboardOff, IconCheck, IconLogin } from '@tabler/icons-react';
import AddonInstallationModal from './AddonInstallationModal';
import { deactivateAddonPlugin, activateSocialLogin } from "./store/settingSlice";


const AddonSettings = () => {
    const dispatch = useDispatch();
    const { loggedInUser } = useSelector((state) => state.auth.session);
    const [addonModalOpened, setAddonModalOpened] = useState(false);
    const [deactivateAddon, setDeactivateAddon] = useState(false);
    const [loading, setLoading] = useState(false);

    const { socialLoginConfiguration, whiteboardAddonState } = useSelector((state) => state.settings.setting);

    const handleDeactivate = async (e) => {
        e.preventDefault();
        setLoading(true);

        showNotification({
            id: 'load-data',
            loading: true,
            title: 'Addon',
            message: "Deactivating Addon...",
            disallowClose: true,
            color: 'green',
        });

        dispatch(deactivateAddonPlugin({ addon: 'lazytasks-whiteboard' })).then((response) => {
            setLoading(false);
            if (response.payload && response.payload.status && response.payload.status === 200) {
                // Simulate successful form submission
                updateNotification({
                    id: 'load-data',
                    title: 'Addon Deactivated',
                    message: response.payload && response.payload.message && response.payload.message,
                    icon: <IconCheck />,
                    color: 'teal',
                    autoClose: 3000,
                });
                setDeactivateAddon(false);
                window.location.reload();
            } else {    
                updateNotification({
                    id: 'load-data',
                    loading: true,
                    title: 'Addon Deactivation Failed',
                    message: response.payload && response.payload.message && response.payload.message,
                    autoClose: 2000,
                    disallowClose: true,
                    color: 'red',
                });
                setDeactivateAddon(false);
            }
        }).catch((error) => {
            setLoading(false);
            updateNotification({
                id: 'load-data',
                loading: true,
                title: 'Addon Deactivation Error',
                message: error?.message || 'Addon deactivation failed.',
                autoClose: 2000,
                disallowClose: true,
                color: 'red',
            });
        });
    };

    const handleSocialLogin = () => {
        const socialLoginSettings = {
            social_login_enabled: socialLoginConfiguration && socialLoginConfiguration.social_login_enabled ? false : true,
        }

        dispatch(activateSocialLogin({ social_login_settings: socialLoginSettings })).then((response) => {
            setLoading(false);
            if (response.payload && response.payload.status && response.payload.status === 200) {
                showNotification({
                    id: 'load-data',
                    title: 'Addon Deactivated',
                    message: response.payload && response.payload.message && response.payload.message,
                    icon: <IconCheck />,
                    color: 'teal',
                    autoClose: 3000,
                });
            } else {
                showNotification({
                    id: 'load-data',
                    loading: true,
                    title: 'Addon Deactivation Failed',
                    message: response.payload && response.payload.message && response.payload.message,
                    autoClose: 2000,
                    disallowClose: true,
                    color: 'red',
                });
            }
        }).catch((error) => {
            setLoading(false);
            showNotification({
                id: 'load-data',
                loading: true,
                title: 'Addon Deactivation Error',
                message: error?.message || 'Addon deactivation failed.',
                autoClose: 2000,
                disallowClose: true,
                color: 'red',
            });
        });
    }

    return (
        <Fragment>

            <Grid columns={12}>
                <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 4, xl: 4 }}>
                    <Card withBorder radius="md" p="lg" mb="md" bg="#F5F8F9" h={'100%'}>
                        <Group align="flex-start" noWrap spacing="md">
                            <ThemeIcon color="orange" radius="xl" size={40} variant="filled">
                                <IconChalkboard size={24} />
                            </ThemeIcon>
                            <Stack spacing={2} style={{ flex: 1 }}>
                                <Text size="md" weight={700} c="black" style={{ lineHeight: 1.2 }}>
                                    {translate('LazyTasks Whiteboard')}
                                </Text>
                                <Text size="sm" c="#4D4D4D" mt={-10}>
                                    {translate('Add a collaborative whiteboard to your task management plugin for visual brainstorming and real-time teamwork.')}
                                </Text>
                                
                                {whiteboardAddonState && whiteboardAddonState === 'not_installed' && (
                                    <Button
                                        onClick={() => setAddonModalOpened(true)}
                                        variant="outline"
                                        size="sm"
                                        radius="sm"
                                        mt={4}
                                        color="#39758D"
                                        style={{ alignSelf: "flex-start" }}
                                    >
                                        {translate('Install Whiteboard')}
                                    </Button>
                                )}

                                {whiteboardAddonState && whiteboardAddonState === 'installed_inactive' && (
                                    <Button
                                        onClick={() => setAddonModalOpened(true)}
                                        variant="filled"
                                        size="sm"
                                        radius="sm"
                                        mt={4}
                                        color="#39758D"
                                        style={{ alignSelf: "flex-start" }}
                                    >
                                        {translate('Activate Whiteboard')}
                                    </Button>
                                )}

                                {whiteboardAddonState && whiteboardAddonState === 'installed_active' && (
                                    <Button
                                        onClick={() => setDeactivateAddon(true)}
                                        variant="light"
                                        size="sm"
                                        radius="sm"
                                        mt={4}
                                        color="red"
                                        style={{ alignSelf: "flex-start" }}
                                    >
                                        {translate('Deactivate Whiteboard')}
                                    </Button>
                                )}

                            </Stack>
                        </Group>
                    </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 4, xl: 4 }}>
                    <Card withBorder radius="md" p="lg" mb="md" bg="#F5F8F9" h={'100%'}>
                        <Group align="flex-start" noWrap spacing="md">
                            <ThemeIcon color="orange" radius="xl" size={40} variant="filled">
                                <IconLogin size={24} />
                            </ThemeIcon>
                            <Stack spacing={2} style={{ flex: 1 }}>
                                <Text size="md" weight={700} c="black" style={{ lineHeight: 1.2 }}>
                                    {translate('LazyTasks Social Login')}
                                </Text>
                                <Text size="sm" c="#4D4D4D" mt={-10}>
                                    {translate('Enable users to log in using their social media accounts, simplifying the authentication process and enhancing user experience.')}
                                </Text>
                                {socialLoginConfiguration && socialLoginConfiguration.social_login_enabled ? (
                                    <Button
                                        onClick={handleSocialLogin}
                                        variant="light" size="sm" radius="sm" mt={4}
                                        color='red'
                                        style={{ alignSelf: "flex-start" }}
                                    >
                                        {translate('Deactivate Social Login')}
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleSocialLogin}
                                        variant="outline" size="sm" radius="sm" mt={4}
                                        color='#39758D'
                                        style={{ alignSelf: "flex-start" }}
                                    >
                                        {translate('Activate Social Login')}
                                    </Button>
                                )}
                            </Stack>
                        </Group>
                    </Card>
                </Grid.Col>
            </Grid>

            <Modal
                opened={deactivateAddon}
                onClose={() => setDeactivateAddon(false)}
                title={
                    <>
                        <Group spacing="xs">
                            <ThemeIcon color="orange" radius="xl" size="lg" variant="filled">
                                <IconChalkboardOff size={24} />
                            </ThemeIcon>
                            <Text size="md" weight={500}>
                                {translate('Install LazyTasks Whiteboard Addons')}
                            </Text>
                        </Group>
                    </>
                }
                size="md"
                centered
            >
                <Divider size="xs" my={0} className='!-ml-4 w-[calc(100%+2rem)]' />
                <Stack spacing="md" pt="md">
                    <Text size="sm" ta="center" pt={10} c="#4D4D4D">
                        The Whiteboard feature requires the <Text size='sm' fw={700} span c="black">LazyTasks Whiteboard Addons</Text> to be installed.
                    </Text>
                    {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['addon-install']) ? (
                        <Group justify="center" pt={10}>
                            <Button
                                size="sm"
                                color={"#39758D"}
                                styles={{
                                    label: {
                                        color: "#fff"
                                    }
                                }}
                                onClick={handleDeactivate}
                                disabled={loading}
                                leftSection={loading ? <Loader size={16} color="white" /> : null}
                                fullWidth
                            >
                                {loading ? 'Deactivating...' : 'Deactivate Whiteboard'}
                            </Button>
                        </Group>
                    ) : (
                        <>
                            <Text size="sm" ta="center" c="#4D4D4D">
                                {translate('You do not have permission to deactivate addons.')} <br />
                                {translate('Please contact your administrator to deactivate the addon.')}
                            </Text>
                        </>
                    )}
                </Stack>
            </Modal>
            <AddonInstallationModal opened={addonModalOpened} onClose={() => setAddonModalOpened(false)} isSetting={true} />
        </Fragment>
    );
};

export default AddonSettings;
