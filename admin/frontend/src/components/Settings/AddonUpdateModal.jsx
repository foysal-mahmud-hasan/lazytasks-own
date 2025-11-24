import React, { Fragment, useEffect, useState } from 'react';
import {
    Modal,
    Text,
    Button,
    Anchor,
    Group,
    Stack,
    ThemeIcon,
    UnstyledButton,
    Loader,
    Divider,
} from '@mantine/core';
import { useDispatch, useSelector } from 'react-redux';
import { IconChalkboard, IconCheck, IconExclamationCircle, IconMoodHappy, IconRocket } from '@tabler/icons-react';
import { translate } from '../../utils/i18n';
import { showNotification, updateNotification } from "@mantine/notifications";
import { installAddonPlugin, checkUpdateAddonPlugin, updateAddonPlugin } from "../Settings/store/settingSlice";
import { hasPermission } from "../ui/permissions";

const AddonUpdateModal = () => {
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [opened, setOpened] = useState(false);
    const [pendingCheck, setPendingCheck] = useState(false);

    const { loggedUserId } = useSelector((state) => state.auth.user);
    const { loggedInUser } = useSelector((state) => state.auth.session);


    useEffect(() => {
        let didCheck = false;

        const checkAndMaybeShow = async () => {
            if (
                window.lazytasksWhiteboard &&
                appLocalizer &&
                appLocalizer.whiteboardInstalled === '1' &&
                hasPermission(loggedInUser && loggedInUser.llc_permissions, ['addon-install'])
            ) {
                try {
                    const result = await dispatch(
                        checkUpdateAddonPlugin(
                            loggedInUser ? loggedInUser.loggedUserId : loggedUserId
                        )
                    ).unwrap();

                    if (result?.latest_version && result?.already_shown === false) {
                        if (!window.isLicenseModalOpen) {
                            setOpened(true);
                        } else {
                            setPendingCheck(true);
                        }
                    }
                } catch (error) {
                    console.error('Modal check failed:', error);
                }
            }
            didCheck = true;
        };

        // Initial check
        setTimeout(checkAndMaybeShow, 1000);

        // Listen for license modal closing
        const onLicenseModalClose = () => {
            if (pendingCheck && !window.isLicenseModalOpen) {
                setOpened(true);
                setPendingCheck(false);
            }
        };

        window.addEventListener('licenseModalClosed', onLicenseModalClose);

        return () => {
            window.removeEventListener('licenseModalClosed', onLicenseModalClose);
        };
    }, [loggedInUser, loggedUserId, dispatch, pendingCheck]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);

        showNotification({
            id: 'load-data',
            loading: true,
            title: 'Addon',
            message: "Installing Addon...",
            disallowClose: true,
            color: 'green',
            styles: () => ({
                root: {
                    zIndex: 3000,
                },
            }),
        });

        dispatch(updateAddonPlugin({ addon: 'lazytasks-whiteboard' })).then((response) => {
            setLoading(false);
            if (response.payload && response.payload.status && response.payload.status === 200) {
                // Simulate successful form submission
                updateNotification({
                    id: 'load-data',
                    title: 'Addon Installed',
                    message: response.payload && response.payload.message && response.payload.message,
                    icon: <IconCheck />,
                    color: 'teal',
                    autoClose: 3000,
                });
                window.location.reload();
            } else if (response.payload && response.payload.status && response.payload.status === 500) {
                updateNotification({
                    id: 'load-data',
                    loading: true,
                    title: 'Addon Installation Failed',
                    message: response.payload && response.payload.message && response.payload.message,
                    autoClose: 2000,
                    disallowClose: true,
                    color: 'red',
                });
            } else {
                updateNotification({
                    id: 'load-data',
                    title: 'Addon Installed',
                    message: response.payload && response.payload.message && response.payload.message,
                    icon: <IconCheck />,
                    color: 'teal',
                    autoClose: 3000,
                });
                // window.location.reload();
            }
        }).catch((error) => {
            setLoading(false);
            updateNotification({
                id: 'load-data',
                loading: true,
                title: 'Addon Installation Error',
                message: response.payload && response.payload.message && response.payload.message,
                autoClose: 2000,
                disallowClose: true,
                color: 'red',
            });
        });
    };

    return (
        <>
            <Modal
                opened={opened}
                onClose={() => setOpened(false)}
                title={
                    <>
                        <Group spacing="xs">
                            <ThemeIcon color="orange" radius="xl" size="lg" variant="filled">
                                <IconChalkboard size={24} />
                            </ThemeIcon>
                            <Text size="md" weight={500}>
                                {translate('Update LazyTasks Whiteboard Addons')}
                            </Text>
                        </Group>
                    </>
                }
                size="md"
                centered
                trapFocus={false}
            >
                <Divider size="xs" my={0} className='!-ml-4 w-[calc(100%+2rem)]' />
                <Stack spacing="md" pt="md">
                    <Text size="sm" ta="center" pt={10} c="#4D4D4D">
                        The <strong>LazyTasks Whiteboard Addon</strong> has a new version available. <br />
                        Please update to the latest version to enjoy new features and improvements.
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
                                onClick={handleUpdate}
                                disabled={loading}
                                leftSection={loading ? <Loader size={16} color="white" /> : null}
                                rightSection={success ? <IconCheck size={16} color="white" /> : null}
                                fullWidth
                            >
                                {success
                                    ? 'Addon Updated!'
                                    : loading
                                        ? 'Updating...'
                                        : 'Update Addon'}
                            </Button>
                        </Group>
                    ) : (
                        <>
                            <Text size="sm" ta="center" c="#4D4D4D">
                                You do not have permission to update addons. <br />
                                Please contact your administrator to update the addon.
                            </Text>
                        </>
                    )}
                </Stack>
            </Modal>
        </>
    );
};

export default AddonUpdateModal;