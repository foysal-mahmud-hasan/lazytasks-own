import React, { useState } from 'react';
import {
    Modal,
    Text,
    Button,
    Group,
    Stack,
    ThemeIcon,
    Loader,
    Divider,
} from '@mantine/core';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { IconChalkboard, IconCheck } from '@tabler/icons-react';
import { translate } from '../../utils/i18n';
import { showNotification, updateNotification } from "@mantine/notifications";
import { installAddonPlugin } from "../Settings/store/settingSlice";
import { hasPermission } from "../ui/permissions";

const AddonInstallationModal = ({ opened, onClose, isSetting = false }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id } = useParams();

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const whiteboardPagePathName = `/project/whiteboard/${id}`;

    const { loggedInUser } = useSelector((state) => state.auth.session);
    const { whiteboardAddonState, portalSettings } = useSelector((state) => state.settings.setting);

    const handleInstall = async (e) => {
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

        dispatch(installAddonPlugin({ addon: 'lazytasks-whiteboard' })).then((response) => {
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
                onClose();
                if(appLocalizer?.is_admin){
                    window.location.reload();
                }else if(!isSetting && !appLocalizer?.is_admin){
                    window.location.href = `${portalSettings && portalSettings.slug}/#${whiteboardPagePathName}`;
                }
            } else {
                updateNotification({
                    id: 'load-data',
                    title: 'Addon Installation Failed',
                    message: response.payload && response.payload.message && response.payload.message,
                    color: 'red',
                    autoClose: 3000,
                    disallowClose: true,
                });
                onClose();
            }
        }).catch((error) => {
            setLoading(false);
            updateNotification({
                id: 'load-data',
                loading: true,
                title: 'Addon Installation Error',
                message: error?.message || 'Addon Installation failed.',
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
                onClose={onClose}
                title={
                    <>
                        <Group spacing="xs">
                            <ThemeIcon color="orange" radius="xl" size="lg" variant="filled">
                                <IconChalkboard size={24} />
                            </ThemeIcon>
                            <Text size="md" weight={500}>
                                {whiteboardAddonState == 'not_installed' ? translate('Install LazyTasks Whiteboard Addons') : translate('Activate LazyTasks Whiteboard Addons')}
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
                                onClick={handleInstall}
                                disabled={loading}
                                leftSection={loading ? <Loader size={16} color="white" /> : null}
                                rightSection={success ? <IconCheck size={16} color="white" /> : null}
                                fullWidth
                            >
                                {
                                    success
                                        ? (whiteboardAddonState === 'not_installed'
                                            ? 'Addon Installed!'
                                            : 'Addon Activated!')
                                        : loading
                                            ? (whiteboardAddonState === 'not_installed'
                                                ? 'Installing Addon'
                                                : 'Activating Addon')
                                            : (whiteboardAddonState === 'not_installed'
                                                ? 'Install Addon'
                                                : 'Activate Addon')
                                }
                            </Button>
                        </Group>
                    ) : (
                        <>
                            <Text size="sm" ta="center" c="#4D4D4D">
                                You do not have permission to install addons. <br />
                                Please contact your administrator to install the addon.
                            </Text>
                        </>
                    )}
                </Stack>
            </Modal>
        </>
    );
};

export default AddonInstallationModal;