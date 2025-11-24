import React, { Fragment, useEffect, useState, useRef } from 'react';
import {
    Modal,
    Text,
    Button,
    Group,
    Stack,
    ThemeIcon,
    Divider,
    Switch,
    Box,
    Badge,
    Card,
    Grid,
    ScrollArea,
    Title,
    TextInput,
    ActionIcon,
} from '@mantine/core';
import { useDispatch, useSelector } from 'react-redux';
import { IconCalendar, IconChalkboard, IconCheck, IconDeviceFloppy, IconGripHorizontal, IconLayoutKanban, IconList, IconListTree, IconPencil, IconPlus, IconSettings2, IconTimeline, IconTrash, IconX } from '@tabler/icons-react';
import { translate } from '../../../utils/i18n';
import { notifications, showNotification } from "@mantine/notifications";
import { installAddonPlugin } from "../../Settings/store/settingSlice";
import { createProjectPriority, createProjectStatus, deleteProjectPriority, deleteProjectStatus, editProjectNav, editProjectPrioritySortOrder, editProjectStatusSortOrder, fetchProjectOverview } from "../../Settings/store/taskSlice";
import { hasPermission } from "../../ui/permissions";
import ProjectConfigureModal from './ProjectConfigureModal';
import UserAvatarSingle from '../../ui/UserAvatarSingle';
import { modals } from '@mantine/modals';
import { editProject } from '../../Settings/store/projectSlice';
import { fetchAllCompanies } from '../../Settings/store/companySlice';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';

const ProjectSettingsModal = ({ project_id, opened, onClose, isSettings }) => {
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const { loggedInUser } = useSelector((state) => state.auth.session);
    const { loggedUserId } = useSelector((state) => state.auth.user);
    const { projectNavbar, boardMembers, projectPriorities, projectStatuses } = useSelector((state) => state.settings.task);

    const [isPriorityLoading, setIsPriorityLoading] = useState(false);
    const [isStatusLoading, setIsStatusLoading] = useState(false);

    const [newPriority, setNewPriority] = useState('');
    const [newPriorityColor, setNewPriorityColor] = useState('#346A80');
    const [showPriorityAddInput, setShowPriorityAddInput] = useState(false);
    const [showPriorityEditInput, setShowPriorityEditInput] = useState(false);
    const [priorityId, setPriorityId] = useState(null);

    const [newStatus, setNewStatus] = useState('');
    const [newStatusColor, setNewStatusColor] = useState('#346A80');
    const [showStatusAddInput, setShowStatusAddInput] = useState(false);
    const [showStatusEditInput, setShowStatusEditInput] = useState(false);
    const [statusId, setStatusId] = useState(null);

    const priorityInputRef = useRef(null);
    const statusInputRef = useRef(null);

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
            description: 'Swimlanes to organize and streamline tasks',
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

    const handlePriorityDragEnd = (priorityResult) => {
        if (!priorityResult.destination) return;
        setIsPriorityLoading(true);

        const reorderedPriorities = Array.from(projectPriorities);
        const [movedItem] = reorderedPriorities.splice(priorityResult.source.index, 1);
        reorderedPriorities.splice(priorityResult.destination.index, 0, movedItem);

        // Check if the order has changed
        const isOrderChanged = reorderedPriorities.some((priority, index) => priority.id !== projectPriorities[index].id);

        if (!isOrderChanged) {
            return;
        }

        if (priorityResult.type === 'priority') {

            dispatch(editProjectPrioritySortOrder({
                data: {
                    project_id: project_id,
                    sort_order: reorderedPriorities.map((priority, index) => ({
                        id: priority.id,
                        sort_order: index + 1,
                    })),
                },
            })).then((response) => {
                if (response.payload && response.payload.status === 200) {
                    // setShowPriorityList(false);
                    notifications.show({
                        color: "green",
                        title: response.payload.message,
                        icon: <IconCheck />,
                        autoClose: 5000,
                        // withCloseButton: true,
                    });
                }
            })
                .finally(() => {
                    setIsPriorityLoading(false);
                });
        } else {
            setIsPriorityLoading(false);
        }


    };

    const handleStatusDragEnd = (statusResult) => {
        if (!statusResult.destination) return;
        setIsStatusLoading(true);

        const reorderedStatuses = Array.from(projectStatuses);
        const [movedItem] = reorderedStatuses.splice(statusResult.source.index, 1);
        reorderedStatuses.splice(statusResult.destination.index, 0, movedItem);

        // Check if the order has changed
        const isOrderChanged = reorderedStatuses.some((status, index) => status.id !== projectStatuses[index].id);

        if (!isOrderChanged) {
            return;
        }

        if (statusResult.type === 'status') {

            dispatch(editProjectStatusSortOrder({
                data: {
                    project_id: project_id,
                    sort_order: reorderedStatuses.map((status, index) => ({
                        id: status.id,
                        sort_order: index + 1,
                    })),
                },
            })).then((response) => {
                if (response.payload && response.payload.status === 200) {
                    // setShowStatusList(false);
                    notifications.show({
                        color: "green",
                        title: response.payload.message,
                        icon: <IconCheck />,
                        autoClose: 5000,
                        // withCloseButton: true,
                    });
                }
            })
                .finally(() => {
                    setIsStatusLoading(false);
                });
        } else {
            setIsStatusLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setNewPriority(e.target.value);
    };

    const handleColorInputChange = (e) => {
        setNewPriorityColor(e.target.value);
    };

    const handleStatusInputChange = (e) => {
        setNewStatus(e.target.value);
    };

    const handleStatusColorInputChange = (e) => {
        setNewStatusColor(e.target.value);
    };

    const handleCancelAddPriority = () => {
        setNewPriority('');
        setShowPriorityAddInput(false);
        setShowPriorityEditInput(false);
    }

    const handleCreatePriority = () => {
        setNewPriority('');
        setShowPriorityAddInput(true);
        setShowPriorityEditInput(false);
        setNewPriorityColor('#346A80');
        setTimeout(() => {
            if (priorityInputRef.current) {
                priorityInputRef.current.focus();
            }
        }, 0);
    };

    const handleAddPriority = () => {
        if (newPriority.trim() !== '' && newPriority !== 'Type name here') {
            const submitData = {
                name: newPriority,
                project_id: project_id,
                color_code: newPriorityColor,
                created_by: loggedInUser ? loggedInUser.loggedUserId : loggedUserId
            }
            dispatch(createProjectPriority(submitData))
            setNewPriority('');
        }
        setShowPriorityAddInput(false);
    };

    // priorityEditHandler
    const handleEditPriority = (priority) => {
        setShowPriorityAddInput(false);
        if (priority && priority.id) {
            setNewPriority(priority.name);
            setNewPriorityColor(priority.color_code);
            setShowPriorityEditInput(true);
            setPriorityId(priority.id);
            setTimeout(() => {
                if (priorityInputRef.current) {
                    priorityInputRef.current.focus();
                }
            }, 0);
        }

    }

    const handleDeletePriority = (priority) =>
        modals.openConfirmModal({
            title: (
                <Title order={5}>You are parmanently deleting this priority</Title>
            ),
            size: 'sm',
            radius: 'md',
            withCloseButton: false,
            centered: true,
            children: (
                <Text size="sm">
                    Are you sure you want to delete this priority?
                </Text>
            ),
            labels: { confirm: 'Confirm', cancel: 'Cancel' },
            onCancel: () => console.log('Cancel'),
            onConfirm: () => {
                if (priority && project_id) {

                    dispatch(deleteProjectPriority({ data: { id: priority.id, project_id: project_id } })).then((response) => {

                        if (response.payload && response.payload.status === 200) {

                            // setSelectedPriority
                            // const newPriorities = response.payload.data;

                            // map through the priorities and update the selected priority
                            // const priority = newPriorities.find(priority => priority.id === selectedPriority);

                            // setSelectedPriority(priority ? priority.id : '');

                            notifications.show({
                                color: "green",
                                title: response.payload.message,
                                icon: <IconCheck />,
                                autoClose: 5000,
                                // withCloseButton: true,
                            });


                        } else {
                            modals.open({
                                withCloseButton: false,
                                centered: true,
                                children: (
                                    <Fragment>
                                        <Text size="sm">
                                            {response.payload.message}
                                        </Text>
                                        <div className="!grid w-full !justify-items-center">
                                            <Button justify="center" onClick={() => modals.closeAll()} mt="md">
                                                Ok
                                            </Button>
                                        </div>
                                    </Fragment>
                                ),
                            });

                        }
                    });

                }
            },
        });

    const handleUpdatePriority = () => {
        if (newPriority.trim() !== '' && newPriority !== 'Type name here') {
            const submitData = {
                id: priorityId,
                name: newPriority,
                project_id: project_id,
                color_code: newPriorityColor,
                created_by: loggedInUser ? loggedInUser.loggedUserId : loggedUserId
            }
            dispatch(createProjectPriority(submitData)).then((response) => {

                if (response.payload && response.payload.data) {
                    // const newPriorities = response.payload.data;
                    // map through the priorities and update the selected priority
                    // const priority = newPriorities.find(priority => priority.id === selectedPriority);

                    // setSelectedPriority(priority ? priority.id : '');
                    // setSelectedPriorityName(priority ? priority.name : '');
                    // setSelectedPriorityColor(priority && priority.color_code ? priority.color_code : '#000000');
                    setNewPriority('');
                    setShowPriorityEditInput(false);

                    notifications.show({
                        color: "green",
                        title: response.payload.message,
                        icon: <IconCheck />,
                        autoClose: 5000,
                        // withCloseButton: true,
                    });

                }

            })
        }
    };

    const handleCreateStatus = () => {
        setNewStatus('');
        setShowStatusAddInput(true);
        setShowStatusEditInput(false);
        setNewStatusColor('#346A80');
        setTimeout(() => {
            if (statusInputRef.current) {
                statusInputRef.current.focus();
            }
        }, 0);
    };

    const handleAddStatus = () => {
        if (newStatus.trim() !== '' && newStatus !== 'Type name here') {
            const submitData = {
                name: newStatus,
                project_id: project_id,
                color_code: newStatusColor,
                created_by: loggedInUser ? loggedInUser.loggedUserId : loggedUserId
            }
            dispatch(createProjectStatus(submitData))
            setNewStatus('');
        }
        setShowStatusAddInput(false);
    };

    const handleCancelAddStatus = () => {
        setNewStatus('');
        setShowStatusAddInput(false);
        setShowStatusEditInput(false);
    }

    const handleEditStatus = (status) => {
        setShowStatusAddInput(false);
        if (status && status.id) {
            setNewStatus(status.name);
            setNewStatusColor(status.color_code);
            setShowStatusEditInput(true);
            setStatusId(status.id);
            setTimeout(() => {
                if (statusInputRef.current) {
                    statusInputRef.current.focus();
                }
            }, 0);
        }
    }

    const handleUpdateStatus = () => {
        if (newStatus.trim() !== '' && newStatus !== 'Type name here') {
            const submitData = {
                id: statusId,
                name: newStatus,
                project_id: project_id,
                color_code: newStatusColor,
                created_by: loggedInUser ? loggedInUser.loggedUserId : loggedUserId
            }
            dispatch(createProjectStatus(submitData)).then((response) => {

                if (response.payload && response.payload.data) {

                    setNewStatus('');
                    setShowStatusEditInput(false);

                    notifications.show({
                        color: "green",
                        title: response.payload.message,
                        icon: <IconCheck />,
                        autoClose: 5000,
                    });
                }

            })
        }
    };

    const handleDeleteStatus = (status) =>
        modals.openConfirmModal({
            title: (
                <Title order={5}>You are parmanently deleting this status</Title>
            ),
            size: 'sm',
            radius: 'md',
            withCloseButton: false,
            centered: true,
            children: (
                <Text size="sm">
                    Are you sure you want to delete this status?
                </Text>
            ),
            labels: { confirm: 'Confirm', cancel: 'Cancel' },
            onCancel: () => console.log('Cancel'),
            onConfirm: () => {
                if (status && project_id) {

                    dispatch(deleteProjectStatus({ data: { id: status.id, project_id: project_id } })).then((response) => {

                        if (response.payload && response.payload.status === 200) {

                            notifications.show({
                                color: "green",
                                title: response.payload.message,
                                icon: <IconCheck />,
                                autoClose: 5000,
                            });


                        } else {
                            modals.open({
                                withCloseButton: false,
                                centered: true,
                                children: (
                                    <Fragment>
                                        <Text size="sm">
                                            {response.payload.message}
                                        </Text>
                                        <div className="!grid w-full !justify-items-center">
                                            <Button justify="center" onClick={() => modals.closeAll()} mt="md">
                                                Ok
                                            </Button>
                                        </div>
                                    </Fragment>
                                ),
                            });

                        }
                    });

                }
            },
        });

    const handleKeyPressForPriority = (e) => {
        if (e.key === 'Enter') {
            if (showPriorityAddInput) {
                handleAddPriority();
            } else if (showPriorityEditInput) {
                handleUpdatePriority();
            }
        } else if (e.key === 'Escape') {
            handleCancelAddPriority();
        }
    };

    const handleKeyPressForStatus = (e) => {
        if (e.key === 'Enter') {
            if (showStatusAddInput) {
                handleAddStatus();
            } else if (showStatusEditInput) {
                handleUpdateStatus();
            }
        } else if (e.key === 'Escape') {
            handleCancelAddStatus();
        }
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
                                <IconSettings2 size={24} />
                            </ThemeIcon>
                            <Text size="md" weight={500}>
                                {translate('Project Settings')}
                            </Text>
                        </Group>
                    </>
                }
                size={appLocalizer?.is_admin ? '90%' : '100%'}
                centered
                closeOnEscape={false}
            >
                <Divider size="xs" my={0} className='!-ml-4 w-[calc(100%+2rem)]' />

                <Grid columns={12} mt={6} mb={8}>
                    {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['configure-project-tabs']) ? (
                        <Grid.Col span={{ base: 12, sm: 4, md: 4, lg: 4, xl: 4 }}>
                            <Card withBorder padding="md" mt={10} radius="md" w={"100%"} h={"100%"}>
                                <Card.Section withBorder inheritPadding py="xs" className="mb-2">
                                    <Group justify='space-between' align='center'>
                                        <Text fw={500} size='md'>{translate('Configure Project Tabs')}</Text>
                                    </Group>
                                </Card.Section>
                                {tabs.map((tab) => (
                                    <Stack spacing="sm" pb={10} align='center'>
                                        <Group
                                            key={tab.name}
                                            position="apart"
                                            spacing="xs"
                                            justify='space-between'
                                            style={{
                                                padding: '8px 16px',
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
                                    </Stack>
                                ))}
                                <Group position="right" justify='flex-end' mb={-20}>
                                    <Button variant="filled" color='orange'
                                        onClick={handleSaveChanges}
                                        disabled={loading}
                                        loading={loading}
                                        loaderProps={{ type: 'dots' }}
                                        size='xs'
                                    >
                                        {translate('Save Changes')}
                                    </Button>
                                </Group>
                            </Card>
                        </Grid.Col>
                    ) : (
                        <Grid.Col span={{ base: 12, sm: 4, md: 4, lg: 4, xl: 4 }}>
                            <Card withBorder padding="md" mt={10} radius="md" w={"100%"} h={"100%"} style={{ textAlign: 'center' }}>
                                <Text size="sm" color="dimmed">{translate('You do not have permission to configure project tabs.')}</Text>
                            </Card>
                        </Grid.Col>
                    )}
                    {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['add-remove-priority']) ? (
                        <Grid.Col span={{ base: 12, sm: 4, md: 4, lg: 4, xl: 4 }}>
                            <Card withBorder padding="md" mt={10} radius="md" w={"100%"} h={"100%"}>
                                <Card.Section withBorder inheritPadding py="xs" className="mb-2">
                                    <Group justify='space-between' align='center'>
                                        <Text fw={500} size='md'>{translate('Priority')}</Text>

                                    </Group>
                                </Card.Section>
                                <DragDropContext
                                    onDragEnd={(priorityResult) => {
                                        handlePriorityDragEnd(priorityResult);
                                    }}
                                >
                                    <Droppable droppableId="priorityList" type="priority">
                                        {(provided, snapshot) => (
                                            <Box
                                                {...provided.droppableProps}
                                                ref={provided.innerRef}
                                                style={{
                                                    position: 'relative',
                                                    overflow: 'visible',
                                                }}
                                            >
                                                <Button variant="outline" color="orange" size="md" mb={10}
                                                    leftSection={<IconPlus size={18} />}
                                                    onClick={handleCreatePriority}
                                                    fullWidth
                                                >
                                                    {translate('Add New Priority')}
                                                </Button>

                                                <ScrollArea h={380} scrollbarSize={4}>
                                                    {projectPriorities &&
                                                        projectPriorities.map((priority, index) => (
                                                            <Draggable key={priority.id} draggableId={priority.id.toString()} index={index}>
                                                                {(provided, snapshot) => (
                                                                    <Box
                                                                        ref={provided.innerRef}
                                                                        {...provided.draggableProps}
                                                                        {...provided.dragHandleProps}
                                                                        className={`dnd-item ${snapshot.isDragging ? 'dragging' : ''}`}
                                                                        style={{
                                                                            ...provided.draggableProps.style,
                                                                            ...(snapshot.isDragging && {
                                                                                position: 'fixed',
                                                                                top: snapshot.draggingOver ? snapshot.draggingOver.clientY : provided.draggableProps.style?.top,
                                                                                left: snapshot.draggingOver ? snapshot.draggingOver.clientX : provided.draggableProps.style?.left,
                                                                                zIndex: 1000,
                                                                            }),
                                                                        }}
                                                                    >

                                                                        <Stack spacing="sm" pb={10} align='flex-start'>
                                                                            <Group
                                                                                key={priority.name}
                                                                                position="apart"
                                                                                spacing="xs"
                                                                                justify='space-between'
                                                                                style={{
                                                                                    padding: '12px 16px',
                                                                                    border: '1px solid #E0E0E0',
                                                                                    borderRadius: 8,
                                                                                    backgroundColor: '#FFFFFF',
                                                                                    width: '100%',
                                                                                }}
                                                                            >
                                                                                <Group spacing="sm" justify='flex-start'>
                                                                                    <ThemeIcon color='#BABABA' radius="xl" size="md" variant="transparent">
                                                                                        <IconGripHorizontal size={20} />
                                                                                    </ThemeIcon>
                                                                                    <Box
                                                                                        className="w-5 h-5 rounded-full"
                                                                                        style={{ backgroundColor: priority.color_code }}
                                                                                    />
                                                                                    <Text size="md" lineClamp={1} weight={700}
                                                                                        style={{
                                                                                            overflow: 'hidden',
                                                                                            textOverflow: 'ellipsis',
                                                                                            whiteSpace: 'nowrap',
                                                                                            maxWidth: '150px', // Adjust the width as needed
                                                                                        }}
                                                                                    >
                                                                                        {translate(priority.name)}
                                                                                    </Text>
                                                                                </Group>

                                                                                <Group spacing="sm" justify='flex-start'>
                                                                                    <ActionIcon color="orange" variant="light" radius="xl" onClick={() => handleEditPriority(priority)}>
                                                                                        <IconPencil size={16} color='orange' />
                                                                                    </ActionIcon>
                                                                                    <ActionIcon color="red" variant="light" radius="xl" onClick={() => handleDeletePriority(priority)}>
                                                                                        <IconTrash size={16} color='red' />
                                                                                    </ActionIcon>
                                                                                </Group>

                                                                            </Group>
                                                                        </Stack>

                                                                    </Box>
                                                                )}
                                                            </Draggable>
                                                        ))}
                                                    {provided.placeholder}
                                                    <Box>
                                                        {showPriorityAddInput && (
                                                            <Group
                                                                position="apart"
                                                                spacing="xs"
                                                                justify='space-between'
                                                                style={{
                                                                    padding: '7px 14px',
                                                                    border: '1px solid #E0E0E0',
                                                                    borderRadius: 8,
                                                                    backgroundColor: '#FFFFFF',
                                                                    width: '100%',
                                                                }}
                                                            >
                                                                <Group spacing="sm" justify='flex-start'>
                                                                    <input
                                                                        className="w-[35px] h-[35px] rounded-sm text-[12px]"
                                                                        type="color"
                                                                        value={newPriorityColor}
                                                                        onChange={handleColorInputChange}
                                                                        placeholder="Color"
                                                                    />
                                                                    <TextInput
                                                                        ref={priorityInputRef}
                                                                        size="sm"
                                                                        className="text-[14px]"
                                                                        defaultValue={newPriority}
                                                                        onChange={handleInputChange}
                                                                        onKeyDown={handleKeyPressForPriority}
                                                                        placeholder={'Type name here'}
                                                                        style={{ flex: 1, width: '300px' }}
                                                                    />
                                                                </Group>

                                                                <Group spacing="sm" justify='flex-start'>
                                                                    <ActionIcon onClick={handleAddPriority} radius="xl" color="#ED7D31" variant="filled">
                                                                        <IconDeviceFloppy size={16} stroke={1.5} />
                                                                    </ActionIcon>
                                                                    <ActionIcon onClick={handleCancelAddPriority} radius="xl" color="#EBF1F4" variant="filled">
                                                                        <IconX size={16} stroke={1.5} color="#000000" />
                                                                    </ActionIcon>
                                                                </Group>
                                                            </Group>
                                                        )}
                                                        {showPriorityEditInput && (
                                                            <Group
                                                                position="apart"
                                                                spacing="xs"
                                                                justify='space-between'
                                                                style={{
                                                                    padding: '7px 14px',
                                                                    border: '1px solid #E0E0E0',
                                                                    borderRadius: 8,
                                                                    backgroundColor: '#FFFFFF',
                                                                    width: '100%',
                                                                }}
                                                            >
                                                                <Group spacing="sm" justify='flex-start'>
                                                                    <input
                                                                        className="w-[35px] h-[35px] rounded-sm text-[12px]"
                                                                        type="color"
                                                                        value={newPriorityColor}
                                                                        onChange={handleColorInputChange}
                                                                        placeholder="Color"
                                                                    />
                                                                    <TextInput
                                                                        ref={priorityInputRef}
                                                                        size="sm"
                                                                        className="text-[14px]"
                                                                        defaultValue={newPriority}
                                                                        onChange={handleInputChange}
                                                                        onKeyDown={handleKeyPressForPriority}
                                                                        placeholder={'Type name here'}
                                                                        style={{ flex: 1, width: '300px' }}
                                                                    />
                                                                </Group>

                                                                <Group spacing="sm" justify='flex-start'>
                                                                    <ActionIcon onClick={handleUpdatePriority} size={30} radius="xl" color="#ED7D31" variant="filled">
                                                                        <IconDeviceFloppy style={{ width: '22px', height: '22px' }} stroke={1.5} />
                                                                    </ActionIcon>
                                                                    <ActionIcon onClick={handleCancelAddPriority} size={30} radius="xl" color="#EBF1F4" variant="filled">
                                                                        <IconX style={{ width: '22px', height: '22px' }} stroke={1.5} color="#000000" />
                                                                    </ActionIcon>
                                                                </Group>
                                                            </Group>
                                                        )}
                                                    </Box>
                                                </ScrollArea>

                                            </Box>
                                        )}
                                    </Droppable>
                                </DragDropContext>

                            </Card>
                        </Grid.Col>
                    ) : (
                        <Grid.Col span={{ base: 12, sm: 4, md: 4, lg: 4, xl: 4 }}>
                            <Card withBorder padding="md" mt={10} radius="md" w={"100%"} h={"100%"} style={{ textAlign: 'center' }}>
                                <Text size="sm" color="dimmed">{translate('You do not have permission to manage priorities.')}</Text>
                            </Card>
                        </Grid.Col>
                    )}
                    {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['add-remove-status']) ? (
                        <Grid.Col span={{ base: 12, sm: 4, md: 4, lg: 4, xl: 4 }}>
                            <Card withBorder padding="md" mt={10} radius="md" w={"100%"} h={"100%"}>
                                <Card.Section withBorder inheritPadding py="xs" className="mb-2">
                                    <Group justify='space-between' align='center'>
                                        <Text fw={500} size='md'>{translate('Status')}</Text>

                                    </Group>
                                </Card.Section>
                                <DragDropContext
                                    onDragEnd={(statusResult) => {
                                        handleStatusDragEnd(statusResult);
                                    }}
                                >
                                    <Droppable droppableId="priorityList" type="status">
                                        {(provided) => (
                                            <Box
                                                {...provided.droppableProps}
                                                ref={provided.innerRef}
                                            >
                                                <Button variant="outline" color="orange" size="md" mb={10}
                                                    leftSection={<IconPlus size={18} />}
                                                    onClick={handleCreateStatus}
                                                    fullWidth
                                                >
                                                    {translate('Add New Status')}
                                                </Button>
                                                <ScrollArea h={380} scrollbarSize={4}>
                                                    {projectStatuses &&
                                                        projectStatuses.map((status, index) => (
                                                            <Draggable key={status.id} draggableId={status.id.toString()} index={index}>
                                                                {(provided, snapshot) => (
                                                                    <Box
                                                                        ref={provided.innerRef}
                                                                        {...provided.draggableProps}
                                                                        {...provided.dragHandleProps}
                                                                        className={`dnd-item ${snapshot.isDragging ? 'dragging' : ''}`}
                                                                        style={{
                                                                            ...provided.draggableProps.style,
                                                                            ...(snapshot.isDragging && {
                                                                                position: 'fixed',
                                                                                top: snapshot.draggingOver ? snapshot.draggingOver.clientY : provided.draggableProps.style?.top,
                                                                                left: snapshot.draggingOver ? snapshot.draggingOver.clientX : provided.draggableProps.style?.left,
                                                                                zIndex: 1000,
                                                                            }),
                                                                        }}
                                                                    >

                                                                        <Stack spacing="sm" pb={10} align='flex-start'>
                                                                            <Group
                                                                                key={status.name}
                                                                                position="apart"
                                                                                spacing="xs"
                                                                                justify='space-between'
                                                                                style={{
                                                                                    padding: '12px 16px',
                                                                                    border: '1px solid #E0E0E0',
                                                                                    borderRadius: 8,
                                                                                    backgroundColor: '#FFFFFF',
                                                                                    width: '100%',
                                                                                }}
                                                                            >
                                                                                <Group spacing="sm" justify='flex-start'>
                                                                                    <ThemeIcon color='#BABABA' radius="xl" size="md" variant="transparent">
                                                                                        <IconGripHorizontal size={20} />
                                                                                    </ThemeIcon>
                                                                                    <Box
                                                                                        className="w-5 h-5 rounded-full"
                                                                                        style={{ backgroundColor: status.color_code }}
                                                                                    />
                                                                                    <Text size="md" weight={700} lineClamp={1}
                                                                                        style={{
                                                                                            overflow: 'hidden',
                                                                                            textOverflow: 'ellipsis',
                                                                                            whiteSpace: 'nowrap',
                                                                                            maxWidth: '150px', // Adjust the width as needed
                                                                                        }}
                                                                                    >
                                                                                        {translate(status.name)}
                                                                                    </Text>
                                                                                </Group>

                                                                                <Group spacing="sm" justify='flex-start'>
                                                                                    <ActionIcon color="orange" variant="light" radius="xl" onClick={() => handleEditStatus(status)}>
                                                                                        <IconPencil size={16} color='orange' />
                                                                                    </ActionIcon>
                                                                                    <ActionIcon color="red" variant="light" radius="xl" onClick={() => handleDeleteStatus(status)}>
                                                                                        <IconTrash size={16} color='red' />
                                                                                    </ActionIcon>
                                                                                </Group>

                                                                            </Group>
                                                                        </Stack>

                                                                    </Box>
                                                                )}
                                                            </Draggable>
                                                        ))}
                                                    {provided.placeholder}
                                                    <Box>
                                                        {showStatusAddInput && (
                                                            <Group
                                                                position="apart"
                                                                spacing="xs"
                                                                justify='space-between'
                                                                style={{
                                                                    padding: '7px 14px',
                                                                    border: '1px solid #E0E0E0',
                                                                    borderRadius: 8,
                                                                    backgroundColor: '#FFFFFF',
                                                                    width: '100%',
                                                                }}
                                                            >
                                                                <Group spacing="sm" justify='flex-start'>
                                                                    <input
                                                                        className="w-[35px] h-[35px] rounded-sm text-[12px]"
                                                                        type="color"
                                                                        value={newStatusColor}
                                                                        onChange={handleStatusColorInputChange}
                                                                        placeholder="Color"
                                                                    />
                                                                    <TextInput
                                                                        ref={statusInputRef}
                                                                        size="sm"
                                                                        className="text-[14px]"
                                                                        defaultValue={newStatus}
                                                                        onChange={handleStatusInputChange}
                                                                        onKeyDown={handleKeyPressForStatus}
                                                                        placeholder={'Type name here'}
                                                                        style={{ flex: 1, width: '300px' }}
                                                                    />
                                                                </Group>

                                                                <Group spacing="sm" justify='flex-start'>
                                                                    <ActionIcon onClick={handleAddStatus} radius="xl" color="#ED7D31" variant="filled">
                                                                        <IconDeviceFloppy size={16} stroke={1.5} />
                                                                    </ActionIcon>
                                                                    <ActionIcon onClick={handleCancelAddStatus} radius="xl" color="#EBF1F4" variant="filled">
                                                                        <IconX size={16} stroke={1.5} color="#000000" />
                                                                    </ActionIcon>
                                                                </Group>
                                                            </Group>
                                                        )}
                                                        {showStatusEditInput && (
                                                            <Group
                                                                position="apart"
                                                                spacing="xs"
                                                                justify='space-between'
                                                                style={{
                                                                    padding: '7px 14px',
                                                                    border: '1px solid #E0E0E0',
                                                                    borderRadius: 8,
                                                                    backgroundColor: '#FFFFFF',
                                                                    width: '100%',
                                                                }}
                                                            >
                                                                <Group spacing="sm" justify='flex-start'>
                                                                    <input
                                                                        className="w-[35px] h-[35px] rounded-sm text-[12px]"
                                                                        type="color"
                                                                        value={newStatusColor}
                                                                        onChange={handleStatusColorInputChange}
                                                                        placeholder="Color"
                                                                    />
                                                                    <TextInput
                                                                        ref={statusInputRef}
                                                                        size="sm"
                                                                        className="text-[14px]"
                                                                        defaultValue={newStatus}
                                                                        onChange={handleStatusInputChange}
                                                                        onKeyDown={handleKeyPressForStatus}
                                                                        placeholder={'Type name here'}
                                                                        style={{ flex: 1, width: '300px' }}
                                                                    />
                                                                </Group>

                                                                <Group spacing="sm" justify='flex-start'>
                                                                    <ActionIcon onClick={handleUpdateStatus} radius="xl" color="#ED7D31" variant="filled">
                                                                        <IconDeviceFloppy size={16} stroke={1.5} />
                                                                    </ActionIcon>
                                                                    <ActionIcon onClick={handleCancelAddStatus} radius="xl" color="#EBF1F4" variant="filled">
                                                                        <IconX size={16} stroke={1.5} color="#000000" />
                                                                    </ActionIcon>
                                                                </Group>
                                                            </Group>
                                                        )}
                                                    </Box>
                                                </ScrollArea>
                                            </Box>
                                        )}
                                    </Droppable>
                                </DragDropContext>
                            </Card>
                        </Grid.Col>
                    ) : (
                        <Grid.Col span={{ base: 12, sm: 4, md: 4, lg: 4, xl: 4 }}>
                            <Card withBorder padding="md" mt={10} radius="md" w={"100%"} h={"100%"} style={{ textAlign: 'center' }}>
                                <Text size="sm" color="dimmed">{translate('You do not have permission to manage statuses.')}</Text>
                            </Card>
                        </Grid.Col>
                    )}
                </Grid>

            </Modal>
        </>
    );
};

export default ProjectSettingsModal;