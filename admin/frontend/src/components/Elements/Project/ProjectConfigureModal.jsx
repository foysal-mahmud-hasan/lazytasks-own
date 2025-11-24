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
    Switch,
    Box,
    Badge,
} from '@mantine/core';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { IconCalendar, IconChalkboard, IconCheck, IconLayoutKanban, IconList, IconListTree, IconSettings2, IconTimeline } from '@tabler/icons-react';
import { translate } from '../../../utils/i18n';
import { showNotification, updateNotification } from "@mantine/notifications";
import { installAddonPlugin } from "../../Settings/store/settingSlice";
import { editProjectNav, fetchProjectOverview } from "../../Settings/store/taskSlice";
import { hasPermission } from "../../ui/permissions";

const ProjectConfigureModal = ({ project_id, opened, onClose, isSettings }) => {
    const dispatch = useDispatch();
    // const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const { loggedInUser } = useSelector((state) => state.auth.session);
    const { projectNavbar } = useSelector((state) => state.settings.task);

    // Local state for enabled tabs
    const [localEnabled, setLocalEnabled] = useState({});

    const ProjectTabs = [
        {
            key: 'list',
            name: 'List',
            description: 'Manage your project tasks in a detailed list view.',
            icon: IconList,
            badge: null,
        },
        {
            key: 'board',
            name: 'Board',
            description: 'Organize your tasks with a Kanban-style board.',
            icon: IconLayoutKanban,
            badge: null,
        },
        {
            key: 'calendar',
            name: 'Calendar',
            description: 'View your tasks on a calendar to track deadlines.',
            icon: IconCalendar,
            badge: null,
        },
        {
            key: 'gantt',
            name: 'Gantt Chart',
            description: 'Plan and schedule your project with a Gantt chart.',
            icon: IconListTree,
            badge: null,
        },
        {
            key: 'whiteboard',
            name: 'Whiteboard',
            description: 'Visualize your project tasks on a whiteboard.',
            icon: IconChalkboard,
            badge: null,
        },
        {
            key: 'swimlane',
            name: 'Swimlane',
            description: 'Organize tasks into swimlanes for better workflow management.',
            icon: IconTimeline,
            badge: <Badge color="#39758D" size='xs'>{translate('Upcoming')}</Badge>,
        },
    ];

    const getEnabledStatus = (tabKey) => {
        // tabKey should be lowercase and match the keys in projectNavbar
        return projectNavbar && typeof projectNavbar[tabKey.toLowerCase()] !== 'undefined'
            ? projectNavbar[tabKey.toLowerCase()]
            : true; // default true if not found
    };

    const tabs = ProjectTabs.map(tab => ({
        ...tab,
        enabled: getEnabledStatus(tab.key),
    }));

    // Handle switch toggle
    const handleChange = (tabKey, checked) => {
        // Prevent disabling the "List" tab
        if (tabKey === 'list') {
            setLocalEnabled(prev => ({
                ...prev,
                list: true,
            }));
            return;
        }
        // Prevent disabling if it's the only enabled tab
        const enabledTabsCount = Object.values(localEnabled).filter(Boolean).length;
        if (!checked && enabledTabsCount <= 1 && localEnabled[tabKey]) {
            setError('At least one tab must be enabled.');
            setTimeout(() => setError(''), 3000);
            return;
        }
        setLocalEnabled(prev => ({
            ...prev,
            [tabKey]: checked,
            list: true,
        }));
    };

    // Save changes handler
    const handleSaveChanges = () => {
        setLoading(true);
        // onClose();
        dispatch(editProjectNav({ id: project_id, data: localEnabled }))
            .then((response) => {
                setLoading(false);
                onClose();
                if (response.payload && response.payload.status && response.payload.status === 200) {
                    // Simulate successful form submission
                    showNotification({
                        id: 'load-data',
                        title: 'Project Tabs Updated',
                        message: response.payload && response.payload.message && response.payload.message,
                        icon: <IconCheck />,
                        color: 'teal',
                        autoClose: 3000,
                    });

                } else {
                    showNotification({
                        id: 'load-data',
                        title: 'Project Tab Update Failed',
                        message: response.payload && response.payload.message && response.payload.message,
                        color: 'red',
                        disallowClose: true,
                        autoClose: 3000,
                    });
                }
            }).catch((error) => {
                setLoading(false);
                showNotification({
                    id: 'load-data',
                    loading: true,
                    title: 'Project Tab Update Error',
                    message: error?.message || 'Project Tab Update failed.',
                    autoClose: 2000,
                    disallowClose: true,
                    color: 'red',
                });
            });
    };

    useEffect(() => {
        setLocalEnabled(prev => ({
            ...projectNavbar,
            list: true, // Always true
        }));
    }, [projectNavbar, opened]);

    useEffect(() => {
        if (isSettings && project_id) {
            dispatch(fetchProjectOverview(project_id));
        }
    }, [isSettings]);

    return (
        <>
            <Modal
                opened={opened}
                onClose={onClose}
                title={
                    <>
                        <Group spacing="xs">
                            <ThemeIcon color="orange" radius="xl" size="lg" variant="filled">
                                <IconSettings2 size={24} />
                            </ThemeIcon>
                            <Text size="md" weight={500}>
                                {translate('Configure Project Tabs')}
                            </Text>
                        </Group>
                    </>
                }
                size="lg"
                centered
            >
                <Divider size="xs" my={0} className='!-ml-4 w-[calc(100%+2rem)]' />
                <Stack spacing="md" pt="md" pb="md" align='center'>
                    {tabs.map((tab) => (
                        <Group
                            key={tab.name}
                            position="apart"
                            spacing="xs"
                            justify='space-between'
                            style={{
                                padding: '12px 16px',
                                border: '1px solid #E0E0E0',
                                borderRadius: 8,
                                backgroundColor: success ? '#EBF1FA' : '#FFFFFF',
                                cursor: loading || success ? 'not-allowed' : 'pointer',
                                opacity: loading || success ? 0.6 : 1,
                                width: '100%',
                            }}
                        >
                            <Group spacing="sm" justify='space-between'>
                                <ThemeIcon color="orange" radius="xl" size="md" variant="light">
                                    <tab.icon size={20} />
                                </ThemeIcon>
                                <Box>
                                    <Text size="md" weight={700}>
                                        {translate(tab.name)}
                                        {tab.badge && <span style={{ marginLeft: 8 }}>{tab.badge}</span>}
                                    </Text>
                                    <Text size="xs" c="dimmed">
                                        {translate(tab.description)}
                                    </Text>
                                </Box>
                            </Group>
                            {tab.key !== 'list' ? (
                                <Switch
                                    checked={!!localEnabled[tab.key]}
                                    onChange={(e) => handleChange(tab.key, e.currentTarget.checked)}
                                    color="orange"
                                    size="sm"
                                    radius="sm"
                                />
                            ) : (
                                <Text size="xs" c="dimmed">
                                    {translate('Default')}
                                </Text>
                            )}
                        </Group>
                    ))}
                </Stack>
                <Divider size="xs" my={0} className='!-ml-4 w-[calc(100%+2rem)]' />
                <Group position="right" justify='flex-end' mt="md">
                    <Button variant="default" onClick={onClose} disabled={loading}>
                        {translate('Cancel')}
                    </Button>
                    <Button variant="filled" color='orange'
                        onClick={handleSaveChanges}
                        disabled={loading}
                        loading={loading}
                        loaderProps={{ type: 'dots' }}
                    >
                        {translate('Save Changes')}
                    </Button>

                </Group>
            </Modal>
        </>
    );
};

export default ProjectConfigureModal;