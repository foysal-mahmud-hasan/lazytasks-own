import React, { useState, useEffect, Fragment, useCallback } from 'react';
import {
    Box,
    Button,
    Checkbox,
    Divider,
    Group,
    Menu,
    Text,
    ThemeIcon,
    Title,
    Tooltip,
    useMantineTheme,
} from '@mantine/core';
import {
    IconDotsVertical,
    IconTrash, IconX, IconArchiveFilled,
    IconArchive,
    IconCopy,
    IconCirclePlus,
    IconCircleMinus
} from '@tabler/icons-react';
import { useSelector, useDispatch } from 'react-redux';
import {
    deleteTaskSection,
    markIsCompletedTaskSection,
    archiveSectionTask,
    duplicateTaskSection,
    fetchProjectOverview,
    fetchTasksBySection,
    toggoleAllTaskToGantt
} from "../../../Settings/store/taskSlice";
import { useParams } from 'react-router-dom';
import { modals } from "@mantine/modals";
import { hasPermission } from "../../../ui/permissions";
import { notifications } from "@mantine/notifications";
import { showNotification, updateNotification } from "@mantine/notifications";
import { translate } from '../../../../utils/i18n';

const SectionHeaderActions = ({ taskSection, taskListSection }) => {
    const theme = useMantineTheme();
    // const tasks = useSelector(state => state.task);
    const dispatch = useDispatch();
    const { loggedUserId } = useSelector((state) => state.auth.user);
    const { loggedInUser } = useSelector((state) => state.auth.session);
    const [opened, setOpened] = useState(false);
    const userId = loggedInUser ? loggedInUser.loggedUserId : loggedUserId;

    const { id } = useParams();

    const openPopover = useCallback(() => setOpened(true), []);
    const closePopover = useCallback(() => setOpened(false), []);

    const { projectInfo, tasks, columns, ordered, taskListSections, childColumns, isLoading, taskEditDrawerOpen, task } = useSelector((state) => state.settings.task);

    //taskDeleteHandler
    const taskSectionDeleteHandler = (taskSectionId, noOfTasks) => modals.openConfirmModal({
        title: (
            <Title order={5}>{translate('You are parmanently deleting this section')}</Title>
        ),
        centered: true,
        size: 'sm',
        radius: 'md',
        withCloseButton: false,
        children: (
            <Text size="sm">
                {translate('Are you sure you want to delete this section?')}
            </Text>
        ),
        labels: { confirm: translate('Confirm'), cancel: translate('Cancel') },
        confirmProps: { color: 'orange' },
        onCancel: () => console.log('Cancel'),
        onConfirm: () => {
            if (taskSectionId && taskSectionId !== 'undefined') {
                if (noOfTasks > 0) {
                    modals.open({
                        withCloseButton: false,
                        centered: true,
                        children: (
                            <Fragment>
                                <Text size="sm">
                                    This section has {noOfTasks} tasks. Please delete all tasks before deleting this section.
                                </Text>
                                <div className="!grid w-full !justify-items-center">
                                    <Button justify="center" onClick={() => modals.closeAll()} mt="md">
                                        {translate('Okay')}
                                    </Button>
                                </div>
                            </Fragment>
                        ),
                    });
                } else {
                    showNotification({
                        id: 'load-data',
                        loading: true,
                        title: 'Task',
                        message: "Deleting The Section...",
                        disallowClose: true,
                        color: 'green',
                        styles: () => ({
                            root: {
                                zIndex: 3000,
                            },
                        }),
                    });
                    dispatch(deleteTaskSection({
                        id: taskSectionId,
                        data: {
                            'deleted_by': loggedInUser ? loggedInUser.loggedUserId : loggedUserId
                        }
                    }))
                        .then((response) => {
                            if (response.payload?.status === 200) {
                                updateNotification({
                                    id: 'load-data',
                                    title: 'Task',
                                    message:
                                        response.payload?.message || 'Section deleted successfully.',
                                    color: 'green',
                                    icon: <IconTrash size={18} />,
                                    autoClose: 2000,
                                    styles: () => ({
                                        root: { zIndex: 3000 },
                                    }),
                                });
                            } else {
                                throw new Error('Something went wrong.');
                            }
                        })
                        .catch((error) => {
                            console.error('Delete failed:', error);
                            updateNotification({
                                id: 'load-data',
                                title: 'Error',
                                message: 'Failed to delete section.',
                                color: 'red',
                                icon: <IconX size={18} />,
                                autoClose: 4000,
                                styles: () => ({
                                    root: { zIndex: 3000 },
                                }),
                            });
                        });
                }
            }
        },
    });


    const [disableOthers, setDisableOthers] = useState(false);
    const [selectedMarkSectionName, setSelectedMarkSectionName] = useState('One');

    useEffect(() => {
        //selectedMarkSectionName
        const selectedMarkSection = Object.entries(taskListSections).filter(([key, value]) => value.mark_is_complete === 'complete');
        setSelectedMarkSectionName(selectedMarkSection.length > 0 ? selectedMarkSection[0][1].name : '');
        const isAnyComplete = Object.values(taskListSections).some(task => task.mark_is_complete === 'complete');
        setDisableOthers(isAnyComplete);
    }, [taskListSections]);

    // checkbox handler
    const markIsCompleteHandler = (event, markIsComplete) => {
        console.log(markIsComplete)
        if (markIsComplete === 'disable') {
            notifications.show({
                color: theme.errorColor,
                title: 'Already ' + selectedMarkSectionName + ' section is marked as complete',
                icon: <IconX />,
                autoClose: 5000,
            });
            //event target unchecked
            event.target.checked = false;
        } else {
            dispatch(markIsCompletedTaskSection({ id: event.target.value, data: { project_id: projectInfo ? projectInfo.id : null, markIsChecked: event.target.checked, updated_by: loggedInUser && loggedInUser.loggedUserId ? loggedInUser.loggedUserId : loggedUserId } }))
        }
    }

    // archive section handler
    const archiveSectionHandler = (taskSectionId, taskSection) => {
        const isComplete = taskSection.mark_is_complete;
        modals.openConfirmModal({
            title: (
                isComplete === 'complete' ?
                    <Title order={5}>{translate('This section is currently marked as complete')}</Title>
                    :
                    <Title order={5}>{translate('You are archiving this section')}</Title>
            ),
            centered: true,
            size: '400px',
            radius: 'md',
            withCloseButton: false,
            children: (
                isComplete === 'complete' ?
                    <Text size="sm" weight={600}>
                        {translate('If you archive and later unarchive it, it will be restored as a regular section. Do you want to continue?')}
                    </Text>
                    :
                    <Text size="sm">
                        {translate('Are you sure you want to archive this section?')}
                    </Text>
            ),
            labels: { confirm: translate('Confirm'), cancel: translate('Cancel') },
            onCancel: () => console.log('Cancel'),
            onConfirm: () => {
                showNotification({
                    id: 'load-data',
                    loading: true,
                    title: 'Task',
                    message: "Archiving The Section...",
                    disallowClose: true,
                    color: 'green',
                    styles: () => ({
                        root: {
                            zIndex: 3000,
                        },
                    }),
                });
                dispatch(archiveSectionTask({
                    id: taskSectionId,
                    data: {
                        project_id: projectInfo ? projectInfo.id : null,
                        task_id: null,
                        archive_section: true,
                        updated_by: loggedInUser?.loggedUserId ?? loggedUserId,
                    }
                }))
                    .then((response) => {
                        if (response.payload && response.payload.status && response.payload.status === 200) {
                            dispatch(fetchProjectOverview(id));
                            updateNotification({
                                id: 'load-data',
                                loading: true,
                                title: 'Task',
                                message: response.payload && response.payload.message && response.payload.message,
                                autoClose: 2000,
                                disallowClose: true,
                                color: 'green',
                                styles: () => ({
                                    root: {
                                        zIndex: 3000,
                                    },
                                }),
                            });
                        }
                    })
                    .catch((error) => {
                        console.error('Error archiving task:', error);
                        alert('Failed to archive task.');

                    });
            },
        });
    }

    // archive section task handler
    const archiveSectionTaskHandler = (taskSectionId, taskSection) => {
        const sectionSlug = taskSection?.slug;
        modals.openConfirmModal({
            title: (
                <Title order={5}>{translate('You are archiving this section all task')}</Title>
            ),
            centered: true,
            size: 'sm',
            radius: 'md',
            withCloseButton: false,
            children: (
                <Text size="sm">
                    {translate('Are you sure you want to archive this section all task?')}
                </Text>
            ),
            labels: { confirm: 'Confirm', cancel: 'Cancel' },
            onCancel: () => console.log('Cancel'),
            onConfirm: () => {
                showNotification({
                    id: 'load-data',
                    loading: true,
                    title: 'Task',
                    message: "Archiving Section All Task ...",
                    disallowClose: true,
                    color: 'green',
                    styles: () => ({
                        root: {
                            zIndex: 3000,
                        },
                    }),
                });
                dispatch(archiveSectionTask({
                    id: taskSectionId,
                    data: {
                        project_id: projectInfo ? projectInfo.id : null,
                        task_id: null,
                        updated_by: loggedInUser?.loggedUserId ?? loggedUserId,
                    }
                }))
                    .then((response) => {
                        if (response.payload && response.payload.status && response.payload.status === 200) {
                            dispatch(fetchTasksBySection({
                                projectId: projectInfo ? projectInfo.id : null,
                                sectionSlug,
                                limit: 14,
                                offset: 0,
                                append: false,
                                userId: loggedInUser?.loggedUserId ?? loggedUserId
                            }));
                            updateNotification({
                                id: 'load-data',
                                loading: true,
                                title: 'Task',
                                message: response.payload && response.payload.message && response.payload.message,
                                autoClose: 2000,
                                disallowClose: true,
                                color: 'green',
                            });
                        }
                    })
                    .catch((error) => {
                        console.error('Error archiving task:', error);
                        alert('Failed to archive task.');

                    });
            },
        });
    }

    // task section duplicate handler
    //taskDeleteHandler
    const taskSectionDuplicateHandler = (taskSectionId) => {
        closePopover();
        modals.openConfirmModal({
            title: (
                <Title order={5}>{translate('Duplicate Section')}</Title>
            ),
            centered: true,
            size: 'sm',
            radius: 'md',
            withCloseButton: false,
            children: (
                <Text size="sm">
                    {translate('Do you want to duplicate this section?')}
                </Text>
            ),
            labels: { confirm: translate('Confirm'), cancel: translate('Cancel') },
            confirmProps: { color: 'orange' },
            onCancel: () => console.log('Cancel'),
            onConfirm: () => {
                if (taskSectionId && taskSectionId !== 'undefined') {
                    showNotification({
                        id: 'load-data',
                        loading: true,
                        title: 'Task',
                        message: "Duplicate The Section...",
                        disallowClose: true,
                        color: 'green',
                        styles: () => ({
                            root: {
                                zIndex: 3000,
                            },
                        }),
                    });
                    dispatch(duplicateTaskSection({
                        id: taskSectionId,
                        data: {
                            'created_by': loggedInUser ? loggedInUser.loggedUserId : loggedUserId
                        }
                    }))
                        .then((response) => {
                            if (response.payload?.status === 200) {
                                dispatch(fetchProjectOverview(id));
                                updateNotification({
                                    id: 'load-data',
                                    title: 'Task Section',
                                    message:
                                        response.payload?.message || 'Section duplicated successfully.',
                                    color: 'green',
                                    autoClose: 2000,
                                    styles: () => ({
                                        root: { zIndex: 3000 },
                                    }),
                                });
                            } else {
                                throw new Error('Something went wrong.');
                            }
                        })
                        .catch((error) => {
                            console.error('Duplicate failed:', error);
                            updateNotification({
                                id: 'load-data',
                                title: 'Error',
                                message: 'Failed to delete section.',
                                color: 'red',
                                icon: <IconX size={18} />,
                                autoClose: 4000,
                                styles: () => ({
                                    root: { zIndex: 3000 },
                                }),
                            });
                        });
                }
            },
        });
    }

    const addAllTaskToGantt = (taskSectionId) => {
        modals.openConfirmModal({
            title: (
                <Group spacing="xs">
                    <ThemeIcon color="orange" radius="xl" size="lg" variant="filled">
                        <IconCirclePlus size={24} />
                    </ThemeIcon>
                    <Text size="md" weight={500}>
                        {translate('Add All to Gantt')}
                    </Text>
                </Group>
            ),
            centered: true,
            size: 'sm',
            radius: 'md',
            withCloseButton: false,
            children: (
                <>
                    <Divider size="xs" mb={14} className='!-ml-4 w-[calc(100%+2rem)]' />
                    <Text size="sm">
                        {translate('Do you want to add all tasks to Gantt?')}
                    </Text>
                </>
            ),
            labels: { confirm: translate('Confirm'), cancel: translate('Cancel') },
            confirmProps: { color: 'orange' },
            onCancel: () => console.log('Cancel'),
            onConfirm: () => {
                if (taskSectionId && taskSectionId !== 'undefined') {
                    showNotification({
                        id: 'load-data',
                        loading: true,
                        title: 'Task',
                        message: "Adding All Task to Gantt...",
                        disallowClose: true,
                        color: 'green',
                        styles: () => ({
                            root: {
                                zIndex: 3000,
                            },
                        }),
                    });
                    dispatch(toggoleAllTaskToGantt({
                        id: taskSectionId,
                        data: {
                            'type': 'add',
                            'project_id': projectInfo ? projectInfo.id : null,
                            'created_by': loggedInUser ? loggedInUser.loggedUserId : loggedUserId
                        }
                    }))
                        .then((response) => {
                            if (response.payload?.status === 200) {
                                dispatch(fetchProjectOverview(projectInfo.id));
                                updateNotification({
                                    id: 'load-data',
                                    title: 'Task Section',
                                    message:
                                        response.payload?.message || 'All Tasks Added to Gantt.',
                                    color: 'green',
                                    autoClose: 2000,
                                });
                            } else {
                                throw new Error('Something went wrong.');
                            }
                        })
                        .catch((error) => {
                            console.error('Add failed:', error);
                            updateNotification({
                                id: 'load-data',
                                title: 'Error',
                                message: 'Failed to add.',
                                color: 'red',
                                icon: <IconX size={18} />,
                                autoClose: 4000,
                                styles: () => ({
                                    root: { zIndex: 3000 },
                                }),
                            });
                        });
                }
            },
        });
    }

    const removeAllTaskToGantt = (taskSectionId) => {
        modals.openConfirmModal({
            title: (
                <Group spacing="xs">
                    <ThemeIcon color="orange" radius="xl" size="lg" variant="filled">
                        <IconCirclePlus size={24} />
                    </ThemeIcon>
                    <Text size="md" weight={500}>
                        {translate('Remove All from Gantt')}
                    </Text>
                </Group>
            ),
            centered: true,
            size: 'sm',
            radius: 'md',
            withCloseButton: false,
            children: (
                <>
                    <Divider size="xs" mb={14} className='!-ml-4 w-[calc(100%+2rem)]' />
                    <Text size="sm">
                        {translate('Do you want to remove all tasks from Gantt?')}
                    </Text>
                </>
            ),
            labels: { confirm: translate('Confirm'), cancel: translate('Cancel') },
            confirmProps: { color: 'orange' },
            onCancel: () => console.log('Cancel'),
            onConfirm: () => {
                if (taskSectionId && taskSectionId !== 'undefined') {
                    showNotification({
                        id: 'load-data',
                        loading: true,
                        title: 'Task',
                        message: "Removing All Task from Gantt...",
                        disallowClose: true,
                        color: 'green',
                        styles: () => ({
                            root: {
                                zIndex: 3000,
                            },
                        }),
                    });
                    dispatch(toggoleAllTaskToGantt({
                        id: taskSectionId,
                        data: {
                            'type': 'remove',
                            'project_id': projectInfo ? projectInfo.id : null,
                            'created_by': loggedInUser ? loggedInUser.loggedUserId : loggedUserId
                        }
                    }))
                        .then((response) => {
                            if (response.payload?.status === 200) {
                                dispatch(fetchProjectOverview(projectInfo.id));
                                updateNotification({
                                    id: 'load-data',
                                    title: 'Task Section',
                                    message:
                                        response.payload?.message || 'Remove All Task from Gantt.',
                                    color: 'green',
                                    autoClose: 2000,
                                });
                            } else {
                                throw new Error('Something went wrong.');
                            }
                        })
                        .catch((error) => {
                            console.error('Remove failed:', error);
                            updateNotification({
                                id: 'load-data',
                                title: 'Error',
                                message: 'Failed to remove.',
                                color: 'red',
                                icon: <IconX size={18} />,
                                autoClose: 4000,
                                styles: () => ({
                                    root: { zIndex: 3000 },
                                }),
                            });
                        });
                }
            },
        });
    }

    return (
        <>
            <Menu width={200} position="bottom-end" withArrow shadow="md" opened={opened} onChange={setOpened}>
                <Menu.Target>
                    <Box
                        onClick={openPopover}
                        className='h-[26px] w-[26px] border border-[#E9E9E9] bg-white rounded-full p-[3.5px] ml-[5px] cursor-pointer'
                    >
                        <IconDotsVertical className='hover:scale-110' stroke={1.25} size={16} />
                    </Box>
                </Menu.Target>
                <Menu.Dropdown>
                    {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['mark-as-complete']) &&
                        <Menu.Item>
                            <Tooltip label={translate('Mark as complete')} position="top" withArrow>
                                <Checkbox
                                    label={<Text size="sm" fw={400}>{translate('Mark as complete')}</Text>}
                                    defaultChecked={!!(taskSection && taskSection.mark_is_complete === 'complete')}
                                    onChange={(event) => {
                                        const markIsComplete = disableOthers && taskSection.mark_is_complete !== 'complete' ? 'disable' : 'enable';
                                        markIsCompleteHandler(event, markIsComplete)
                                    }}
                                    color="orange"
                                    value={taskSection && taskSection.id}
                                />
                            </Tooltip>
                        </Menu.Item>
                    }
                    {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['archive-section']) &&
                        <Menu.Item
                            leftSection={
                                <IconArchiveFilled
                                    className="cursor-pointer"
                                    size={20}
                                    stroke={1.50}
                                    color="#4d4d4d"
                                />
                            }
                            onClick={() => {
                                archiveSectionHandler(taskSection && taskSection.id, taskSection)
                            }}
                        >
                            {translate('Archive Section')}
                        </Menu.Item>
                    }
                    {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['archive-all-tasks']) &&
                        <Menu.Item
                            leftSection={
                                <IconArchive
                                    className="cursor-pointer"
                                    color="#4d4d4d"
                                    size={20}
                                    stroke={1.50}
                                />
                            }
                            onClick={() => {
                                archiveSectionTaskHandler(taskSection && taskSection.id, taskSection)
                            }}
                        >
                            {translate('Archive all task')}
                        </Menu.Item>
                    }
                    {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['duplicate-section']) &&
                        <Menu.Item
                            leftSection={
                                <IconCopy
                                    className="cursor-pointer"
                                    color="#4d4d4d"
                                    size={20}
                                    stroke={1.50}
                                />
                            }
                            onClick={() => {
                                taskSectionDuplicateHandler(taskSection && taskSection.id)
                            }}
                        >
                            {translate('Duplicate Section')}
                        </Menu.Item>
                    }
                    {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['add-remove-section-to-gantt']) && (

                        <>
                            {taskSection.is_visible_on_gantt === true ? (
                                <Menu.Item leftSection={
                                    <IconCircleMinus
                                        className="cursor-pointer"
                                        size={20}
                                        stroke={1.50}
                                        color="#4d4d4d"
                                    />
                                }
                                    onClick={() => {
                                        removeAllTaskToGantt(taskSection && taskSection.id)
                                    }}
                                >
                                    {translate('Remove from Gantt')}
                                </Menu.Item>
                            ) : (
                                <Menu.Item
                                    leftSection={
                                        <IconCirclePlus
                                            className="cursor-pointer"
                                            color="#4d4d4d"
                                            size={20}
                                            stroke={1.50}
                                        />
                                    }
                                    onClick={() => {
                                        addAllTaskToGantt(taskSection && taskSection.id)
                                    }}
                                >
                                    {translate('Add All Tasks to Gantt')}
                                </Menu.Item>
                            )}
                        </>
                    )}
                    {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['create-manage-section']) &&
                        <Menu.Item
                            leftSection={
                                <IconTrash
                                    className="cursor-pointer"
                                    color="red"
                                    size={20}
                                    stroke={1.50}
                                />
                            }
                            onClick={() => {
                                taskSectionDeleteHandler(taskSection && taskSection.id, columns && columns && columns[taskListSection] ? columns[taskListSection].length : 0)
                            }}
                        >
                            {translate('Delete')}
                        </Menu.Item>
                    }
                </Menu.Dropdown>
            </Menu>
        </>
    );
};

export default SectionHeaderActions;
