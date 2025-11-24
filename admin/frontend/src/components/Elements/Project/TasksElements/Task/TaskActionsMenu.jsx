import React, { useState, useCallback, } from 'react';
import { IconArrowsExchange, IconDotsVertical, IconEye, IconArchive, IconCircleCheck, IconLock, IconLockOpen, IconCopy, IconCheck, IconCircleX, IconCirclePlus, IconCircleMinus } from '@tabler/icons-react';
import { useSelector, useDispatch } from 'react-redux';
import { hasPermission } from "../../../../ui/permissions";
import { Text, Menu, Group, ThemeIcon, Divider } from "@mantine/core";
import { modals } from "@mantine/modals";
import TaskDelete from "./TaskDelete";
import { showNotification, updateNotification } from "@mantine/notifications";
import ChangeTaskSection from "./ChangeTaskSection";
import {
    convertTask,
    archiveTask,
    completeTask,
    openTaskEditDrawer, setEditableTask, closeTaskEditDrawer, changeTaskVisibility, duplicateTask,
    inCompleteTask,
    editTask
} from "../../../../Settings/store/taskSlice";
import { translate } from '../../../../../utils/i18n';
import { addTask, removeTask } from '../../../../../services/TaskService';

const TaskActionsMenu = ({ actions = [], taskData, isSubtask, isDrawer }) => {
    const dispatch = useDispatch();
    const { loggedInUser } = useSelector((state) => state.auth.session);
    const { loggedUserId } = useSelector((state) => state.auth.user);
    const [opened, setOpened] = useState(false);

    const openPopover = useCallback(() => setOpened(true), []);
    const closePopover = useCallback(() => setOpened(false), []);

    // const [task, setTask] = useState(taskData);

    // useEffect(() => { setTask(taskData); }, [taskData]);

    const handleEditTaskDrawerOpen = () => {
        closePopover();
        dispatch(openTaskEditDrawer());
        dispatch(setEditableTask(taskData && taskData));
    };
    const handleEditSubTaskDrawerOpen = () => {
        closePopover();
        dispatch(openTaskEditDrawer());
        dispatch(setEditableTask(taskData && taskData));
    };

    const [selectedAccordion, setSelectedAccordion] = useState('');
    const toggleSection = (section) => {
        setSelectedAccordion(section);
    };

    const archiveTaskHandler = () => {
        const taskSectionId = taskData?.task_section_id;
        const taskId = taskData?.id;
        showNotification({
            id: 'load-data',
            loading: true,
            title: 'Task',
            message: "Archiving The Task...",
            disallowClose: true,
            color: 'green',
            styles: () => ({
                root: {
                    zIndex: 3000,
                },
            }),
        });
        dispatch(archiveTask({
            id: taskSectionId,
            data: {
                project_id: null,
                task_id: taskId,
                updated_by: loggedInUser?.loggedUserId ?? loggedUserId,
            }
        }))
            .then((response) => {
                if (response.payload && response.payload.status && response.payload.status === 200) {
                    if (isDrawer) {
                        dispatch(closeTaskEditDrawer())
                    }
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
    };

    const handleCompleteTask = () => {
        closePopover();
        modals.openConfirmModal({
            title: (
                <>
                    <Group spacing="xs">
                        <ThemeIcon color="orange" radius="xl" size="lg" variant="filled">
                            <IconCheck size={24} />
                        </ThemeIcon>
                        <Text size="md" weight={500}>
                            {translate('Complete Task')}
                        </Text>
                    </Group>
                </>
            ),
            centered: true,
            children: (
                <>
                    <Divider size="xs" mb={24} className='!-ml-4 w-[calc(100%+2rem)]' />
                    <Text size="md" mb={30}>
                        Are you sure you want to complete this task?
                    </Text>
                </>
            ),
            labels: { confirm: 'Yes, complete it', cancel: 'cancel' },
            confirmProps: { color: 'orange' },
            onConfirm: () => {
                showNotification({
                    id: 'load-data',
                    loading: true,
                    title: 'Task',
                    message: "Completing The Task...",
                    disallowClose: true,
                    color: 'green',
                    styles: () => ({
                        root: {
                            zIndex: 3000,
                        },
                    }),
                });
                dispatch(completeTask({
                    id: taskData.id,
                    data: {
                        project_id: taskData.project_id,
                        type: 'task',
                        updated_by: loggedInUser?.loggedUserId ?? loggedUserId,
                    }
                }))
                    .then((response) => {
                        if (response.payload && response.payload.status && response.payload.status === 200) {
                            if (isDrawer) {
                                dispatch(closeTaskEditDrawer())
                            }
                            updateNotification({
                                id: 'load-data',
                                loading: true,
                                title: 'Task',
                                message: response.payload && response.payload.message && response.payload.message,
                                autoClose: 2000,
                                disallowClose: true,
                                color: 'green',
                            });
                        } else {
                            updateNotification({
                                id: 'load-data',
                                loading: false,
                                title: 'Task',
                                message: response.payload && response.payload.message && response.payload.message,
                                autoClose: 2000,
                                disallowClose: true,
                                color: 'red',
                            });
                        }
                    })
                    .catch((error) => {
                        console.error('Error completing task:', error);
                        alert('Failed to complete task.');
                    });
            },
        });
    }

    const handleConvertTask = () => {
        closePopover();
        modals.openConfirmModal({
            title: 'Convert Task',
            centered: true,
            children: (
                <Text size="sm">
                    Are you sure you want to convert this subtask as task?
                </Text>
            ),
            labels: { confirm: 'Yes, convert it', cancel: 'cancel' },
            confirmProps: { color: 'orange' },
            onConfirm: () => {
                showNotification({
                    id: 'load-data',
                    loading: true,
                    title: 'Task',
                    message: "Converting The Subtask...",
                    disallowClose: true,
                    color: 'green',
                    styles: () => ({
                        root: {
                            zIndex: 3000,
                        },
                    }),
                });
                dispatch(convertTask({
                    id: taskData.id,
                    data: {
                        updated_by: loggedInUser?.loggedUserId ?? loggedUserId,
                    }
                }))
                    .then((response) => {
                        if (response.payload && response.payload.status && response.payload.status === 200) {
                            if (isDrawer) {
                                dispatch(closeTaskEditDrawer())
                            }
                            updateNotification({
                                id: 'load-data',
                                loading: false,
                                title: 'Task',
                                message: response.payload && response.payload.message && response.payload.message,
                                autoClose: 2000,
                                disallowClose: true,
                                color: 'green',
                            });
                        } else {
                            updateNotification({
                                id: 'load-data',
                                loading: false,
                                title: 'Task',
                                message: response.payload && response.payload.message && response.payload.message,
                                autoClose: 2000,
                                disallowClose: true,
                                color: 'red',
                            });
                        }
                    })
                    .catch((error) => {
                        console.error('Error converting task:', error);
                        alert('Failed to convert task.');
                    });
            },
        });
    }

    const changeVisibilityHandler = () => {
        closePopover();
        modals.openConfirmModal({
            title: (
                <Group spacing="xs">
                    <ThemeIcon color="orange" radius="xl" size="lg" variant="filled">
                        {taskData.taskPrivacy === 'public' ?
                            <IconLock size={24} /> :
                            <IconLockOpen size={24} />
                        }
                    </ThemeIcon>
                    <Text size="md" weight={500}>
                        {translate('Change Task Visibility')}
                    </Text>
                </Group>
            ),
            centered: true,
            children: (
                <>
                    <Divider size="xs" mb={14} className='!-ml-4 w-[calc(100%+2rem)]' />
                    <Text size="md" mb={30}>
                        Are you sure you want to change task visibility?
                    </Text>
                </>
            ),
            labels: { confirm: translate('Yes'), cancel: translate('Cancel') },
            confirmProps: { color: 'orange' },
            onConfirm: () => {
                showNotification({
                    id: 'load-data',
                    loading: true,
                    title: 'Task',
                    message: "Changing Visibility...",
                    disallowClose: true,
                    color: 'green',
                    styles: () => ({
                        root: {
                            zIndex: 3000,
                        },
                    }),
                });
                dispatch(changeTaskVisibility({
                    id: taskData.id,
                    data: {
                        taskPrivacy: taskData.taskPrivacy === 'public' ? 'private' : 'public',
                        updated_by: loggedInUser?.loggedUserId ?? loggedUserId,
                    }
                }))
                    .then((response) => {
                        if (response.payload && response.payload.status && response.payload.status === 200) {
                            if (isDrawer) {
                                dispatch(closeTaskEditDrawer())
                            }
                            updateNotification({
                                id: 'load-data',
                                loading: false,
                                title: 'Task',
                                message: response.payload && response.payload.message && response.payload.message,
                                autoClose: 2000,
                                disallowClose: true,
                                color: 'green',
                            });
                        } else {
                            updateNotification({
                                id: 'load-data',
                                loading: false,
                                title: 'Task',
                                message: response.payload && response.payload.message && response.payload.message,
                                autoClose: 2000,
                                disallowClose: true,
                                color: 'red',
                            });
                        }
                    })
                    .catch((error) => {
                        console.error('Error changing visibility task:', error);
                        alert('Failed to changing visibility task.');
                    });
            },
        });
    };

    const duplicateTaskHandler = () => {
        closePopover();
        modals.openConfirmModal({
            title: (
                <Group spacing="xs">
                    <ThemeIcon color="orange" radius="xl" size="lg" variant="filled">
                        <IconCopy size={24} />
                    </ThemeIcon>
                    <Text size="md" weight={500}>
                        {translate('Duplicate Task')}
                    </Text>
                </Group>
            ),
            centered: true,
            children: (
                <>
                    <Divider size="xs" mb={14} className='!-ml-4 w-[calc(100%+2rem)]' />
                    <Text size="md" mb={30}>
                        Are you sure you want to duplicate the task?
                    </Text>
                </>
            ),
            labels: { confirm: translate('Yes'), cancel: translate('Cancel') },
            confirmProps: { color: 'orange' },
            onConfirm: () => {
                showNotification({
                    id: 'load-data',
                    loading: true,
                    title: 'Task',
                    message: "Duplicating the task...",
                    disallowClose: true,
                    color: 'green',
                    styles: () => ({
                        root: {
                            zIndex: 3000,
                        },
                    }),
                });
                dispatch(duplicateTask({
                    id: taskData.id,
                    data: {
                        created_by: loggedInUser?.loggedUserId ?? loggedUserId,
                    }
                }))
                    .then((response) => {
                        if (response.payload && response.payload.status && response.payload.status === 200) {
                            if (isDrawer) {
                                dispatch(closeTaskEditDrawer())
                            }
                            updateNotification({
                                id: 'load-data',
                                loading: false,
                                title: 'Task',
                                message: response.payload && response.payload.message && response.payload.message,
                                autoClose: 2000,
                                disallowClose: true,
                                color: 'green',
                            });
                        } else {
                            updateNotification({
                                id: 'load-data',
                                loading: false,
                                title: 'Task',
                                message: response.payload && response.payload.message && response.payload.message,
                                autoClose: 2000,
                                disallowClose: true,
                                color: 'red',
                            });
                        }
                    })
                    .catch((error) => {
                        console.error('Error changing visibility task:', error);
                        alert('Failed to changing visibility task.');
                    });
            },
        });
    };

    const handleCompleteSubTask = () => {
        closePopover();
        modals.openConfirmModal({
            title: (
                <Group spacing="xs">
                    <ThemeIcon color="orange" radius="xl" size="lg" variant="filled">
                        <IconCheck size={24} />
                    </ThemeIcon>
                    <Text size="md" weight={500}>
                        {translate('Complete Subtask')}
                    </Text>
                </Group>
            ),
            centered: true,
            children: (
                <>
                    <Divider size="xs" mb={24} className='!-ml-4 w-[calc(100%+2rem)]' />
                    <Text size="md" mb={30}>
                        {translate('Are you sure you want to complete this subtask?')}
                    </Text>
                </>
            ),
            labels: { confirm: 'Yes, complete it', cancel: 'cancel' },
            confirmProps: { color: 'orange' },
            onConfirm: () => {
                showNotification({
                    id: 'load-data',
                    loading: true,
                    title: 'Subtask',
                    message: "Completing The Subtask...",
                    disallowClose: true,
                    color: 'green',
                    styles: () => ({
                        root: {
                            zIndex: 3000,
                        },
                    }),
                });
                dispatch(completeTask({
                    id: taskData.id,
                    data: {
                        project_id: taskData.project_id,
                        type: 'subtask',
                        updated_by: loggedInUser?.loggedUserId ?? loggedUserId,
                    }
                }))
                    .then((response) => {
                        if (response.payload && response.payload.status && response.payload.status === 200) {
                            if (isDrawer) {
                                dispatch(closeTaskEditDrawer())
                            }
                            updateNotification({
                                id: 'load-data',
                                loading: true,
                                title: 'Subtask',
                                message: response.payload && response.payload.message && response.payload.message,
                                autoClose: 2000,
                                disallowClose: true,
                                color: 'green',
                            });
                        } else {
                            updateNotification({
                                id: 'load-data',
                                loading: false,
                                title: 'Subtask',
                                message: response.payload && response.payload.message && response.payload.message,
                                autoClose: 2000,
                                disallowClose: true,
                                color: 'red',
                            });
                        }
                    })
                    .catch((error) => {
                        console.error('Error completing subtask:', error);
                        alert('Failed to complete subtask.');
                    });
            },
        });
    }

    const handleInCompleteSubTask = () => {
        closePopover();
        modals.openConfirmModal({
            title: (
                <Group spacing="xs">
                    <ThemeIcon color="orange" radius="xl" size="lg" variant="filled">
                        <IconCircleX size={24} />
                    </ThemeIcon>
                    <Text size="md" weight={500}>
                        {translate('Incomplete Subtask')}
                    </Text>
                </Group>
            ),
            centered: true,
            children: (
                <>
                    <Divider size="xs" mb={24} className='!-ml-4 w-[calc(100%+2rem)]' />
                    <Text size="md" mb={30}>
                        {translate('Are you sure you want to incomplete this subtask?')}
                    </Text>
                </>
            ),
            labels: { confirm: 'Yes', cancel: 'Cancel' },
            confirmProps: { color: 'orange' },
            onConfirm: () => {
                showNotification({
                    id: 'load-data',
                    loading: true,
                    title: 'Subtask',
                    message: "Incompleting The Subtask...",
                    disallowClose: true,
                    color: 'green',
                    styles: () => ({
                        root: {
                            zIndex: 3000,
                        },
                    }),
                });
                dispatch(inCompleteTask({
                    id: taskData.id,
                    data: {
                        project_id: taskData.project_id,
                        type: 'subtask',
                        updated_by: loggedInUser?.loggedUserId ?? loggedUserId,
                    }
                }))
                    .then((response) => {
                        if (response.payload && response.payload.status && response.payload.status === 200) {
                            if (isDrawer) {
                                dispatch(closeTaskEditDrawer())
                            }
                            updateNotification({
                                id: 'load-data',
                                loading: true,
                                title: 'Subtask',
                                message: response.payload && response.payload.message && response.payload.message,
                                autoClose: 2000,
                                disallowClose: true,
                                color: 'green',
                            });
                        } else {
                            updateNotification({
                                id: 'load-data',
                                loading: false,
                                title: 'Subtask',
                                message: response.payload && response.payload.message && response.payload.message,
                                autoClose: 2000,
                                disallowClose: true,
                                color: 'red',
                            });
                        }
                    })
                    .catch((error) => {
                        console.error('Error completing subtask:', error);
                    });
            },
        });
    }

    const addTaskToGanttHandler = () => {
        modals.openConfirmModal({
            title: (
                <Group spacing="xs">
                    <ThemeIcon color="orange" radius="xl" size="lg" variant="filled">
                        <IconCirclePlus size={24} />
                    </ThemeIcon>
                    <Text size="md" weight={500}>
                        {translate('Add Task to Gantt Chart')}
                    </Text>
                </Group>
            ),
            centered: true,
            children: (
                <>
                    <Divider size="xs" mb={14} className='!-ml-4 w-[calc(100%+2rem)]' />
                    <Text size="md" mb={30}>
                        {translate('Are you sure you want to Add Task to Gantt Chart ?')}
                    </Text>
                </>
            ),
            labels: { confirm: translate('Yes'), cancel: translate('Cancel') },
            confirmProps: { color: 'orange' },
            onConfirm: () => {
                showNotification({
                    id: 'load-data',
                    loading: true,
                    title: 'Task',
                    message: "Adding Task to Gantt...",
                    disallowClose: true,
                    color: 'green',
                    styles: () => ({
                        root: {
                            zIndex: 3000,
                        },
                    }),
                });
                const updatedTask = {
                    is_visible: 1
                }
                dispatch(editTask({
                    id: taskData.id,
                    data: updatedTask
                }))
                    .then((response) => {
                        if (response.payload && response.payload.status && response.payload.status === 200) {
                            if (isDrawer) {
                                dispatch(closeTaskEditDrawer())
                            }
                            updateNotification({
                                id: 'load-data',
                                loading: false,
                                title: 'Task',
                                message: response.payload && response.payload.message && response.payload.message,
                                autoClose: 2000,
                                disallowClose: true,
                                color: 'green',
                            });
                        } else {
                            updateNotification({
                                id: 'load-data',
                                loading: false,
                                title: 'Task',
                                message: response.payload && response.payload.message && response.payload.message,
                                autoClose: 2000,
                                disallowClose: true,
                                color: 'red',
                            });
                        }
                    })
                    .catch((error) => {
                        console.error('Error adding task on gantt:', error);
                        alert('Failed to Add Task to Gantt Chart.');
                    });
            },
        });

    }

    const removeTaskFromGanttHandler = () => {
        modals.openConfirmModal({
            title: (
                <Group spacing="xs">
                    <ThemeIcon color="orange" radius="xl" size="lg" variant="filled">
                        <IconCircleMinus size={24} />
                    </ThemeIcon>
                    <Text size="md" weight={500}>
                        {translate('Remove Task From Gantt Chart')}
                    </Text>
                </Group>
            ),
            centered: true,
            children: (
                <>
                    <Divider size="xs" mb={14} className='!-ml-4 w-[calc(100%+2rem)]' />
                    <Text size="md" mb={30}>
                        {translate('Are you sure you want to remove task from gantt chart ?')}
                    </Text>
                </>
            ),
            labels: { confirm: translate('Yes'), cancel: translate('Cancel') },
            confirmProps: { color: 'orange' },
            onConfirm: () => {
                showNotification({
                    id: 'load-data',
                    loading: true,
                    title: 'Task',
                    message: "Removing Task From Gantt...",
                    disallowClose: true,
                    color: 'green',
                });
                const updatedTask = {
                    is_visible: 0
                }
                dispatch(editTask({
                    id: taskData.id,
                    data: updatedTask
                }))
                    .then((response) => {
                        if (response.payload && response.payload.status && response.payload.status === 200) {
                            if (isDrawer) {
                                dispatch(closeTaskEditDrawer())
                            }
                            updateNotification({
                                id: 'load-data',
                                loading: false,
                                title: 'Task',
                                message: response.payload && response.payload.message && response.payload.message,
                                autoClose: 2000,
                                disallowClose: true,
                                color: 'green',
                            });
                        } else {
                            updateNotification({
                                id: 'load-data',
                                loading: false,
                                title: 'Task',
                                message: response.payload && response.payload.message && response.payload.message,
                                autoClose: 2000,
                                disallowClose: true,
                                color: 'red',
                            });
                        }
                    })
                    .catch((error) => {
                        console.error('Error adding task on gantt:', error);
                        alert('Failed to Add Task to Gantt Chart.');
                    });
            },
        });
    }

    return (
        <>
            <Menu width={200} position="bottom-end" withArrow shadow="md" opened={opened} onChange={setOpened}>
                <Menu.Target>
                    {isSubtask ? (
                        <div
                            onClick={openPopover}
                            className='h-[24px] w-[24px] border border-[#E9E9E9] bg-white rounded-full p-[3px] mr-[14px] cursor-pointer'
                        >
                            <IconDotsVertical size={16} stroke={1.25} />
                        </div>
                    ) : (
                        <div
                            onClick={openPopover}
                            className='h-[24px] w-[24px] border border-[#E9E9E9] bg-white rounded-full p-[3px] ml-[5px] cursor-pointer'
                        >
                            <IconDotsVertical size={16} stroke={1.25} />
                        </div>
                    )}
                </Menu.Target>

                {isSubtask ? (
                    <Menu.Dropdown>
                        {actions.includes('view') && (
                            <Menu.Item leftSection={
                                <IconEye
                                    className="cursor-pointer"
                                    size={20}
                                    stroke={1.50}
                                    color="#4d4d4d"
                                />
                            }
                                onClick={handleEditSubTaskDrawerOpen}
                            >
                                {translate('View Subtask')}
                            </Menu.Item>
                        )}
                        {actions.includes('convert') && (taskData && taskData.status !== 'COMPLETED') &&
                            hasPermission(loggedInUser && loggedInUser.llc_permissions, ['convert-task']) && (
                                <Menu.Item leftSection={
                                    <IconArrowsExchange
                                        className="cursor-pointer"
                                        size={20}
                                        stroke={1.50}
                                        color="#4d4d4d"
                                    />
                                }
                                    onClick={handleConvertTask}
                                >
                                    {translate('Convert to Task')}
                                </Menu.Item>
                            )}
                        {actions.includes('subtask-complete') && (taskData && taskData.status !== 'COMPLETED') &&
                            hasPermission(loggedInUser && loggedInUser.llc_permissions, ['subtask-complete-incomplete']) && (
                                <Menu.Item leftSection={
                                    <IconCircleCheck
                                        className="cursor-pointer"
                                        size={20}
                                        stroke={1.50}
                                        color="#4d4d4d"
                                    />
                                }
                                    onClick={handleCompleteSubTask}
                                >
                                    {translate('Complete Subtask')}
                                </Menu.Item>
                            )}
                        {actions.includes('subtask-complete') && (taskData && taskData.status === 'COMPLETED') &&
                            hasPermission(loggedInUser && loggedInUser.llc_permissions, ['subtask-complete-incomplete']) && (
                                <Menu.Item leftSection={
                                    <IconCircleX
                                        className="cursor-pointer"
                                        size={20}
                                        stroke={1.50}
                                        color="#4d4d4d"
                                    />
                                }
                                    onClick={handleInCompleteSubTask}
                                >
                                    {translate('Incomplete Subtask')}
                                </Menu.Item>
                            )}
                        {actions.includes('ganttTask') && hasPermission(loggedInUser && loggedInUser.llc_permissions, ['add-remove-task-to-gantt']) && (
                            <>
                                {(taskData && taskData.status !== 'COMPLETED') && taskData.ganttIsVisible === 1 && (
                                    <Menu.Item leftSection={
                                        <IconCircleMinus
                                            className="cursor-pointer"
                                            size={20}
                                            stroke={1.50}
                                            color="#4d4d4d"
                                        />
                                    }
                                        onClick={removeTaskFromGanttHandler}
                                    >
                                        {translate('Remove from Gantt')}
                                    </Menu.Item>
                                )}
                                {(taskData && taskData.status !== 'COMPLETED') && taskData.ganttIsVisible === 0 && (
                                    <Menu.Item leftSection={
                                        <IconCirclePlus
                                            className="cursor-pointer"
                                            size={20}
                                            stroke={1.50}
                                            color="#4d4d4d"
                                        />
                                    }
                                        onClick={addTaskToGanttHandler}
                                    >
                                        {translate('Add to Gantt')}
                                    </Menu.Item>
                                )}
                            </>
                        )}
                        {actions.includes('delete') && (
                            hasPermission(loggedInUser && loggedInUser.llc_permissions, ['delete-subtask']) ||
                            (taskData && taskData.createdBy_id == loggedInUser?.loggedUserId)
                        ) && (
                                <Menu.Item
                                >
                                    <TaskDelete task={taskData} taskId={taskData && taskData.id} isSubtask isDrawer />
                                </Menu.Item>
                            )}
                    </Menu.Dropdown>

                ) : (
                    <Menu.Dropdown>
                        {actions.includes('view') && (
                            <Menu.Item leftSection={
                                <IconEye
                                    className="cursor-pointer"
                                    size={20}
                                    stroke={1.50}
                                    color="#4d4d4d"
                                />
                            }
                                onClick={handleEditTaskDrawerOpen}
                            >
                                {translate('View Task')}
                            </Menu.Item>
                        )}
                        {actions.includes('complete') && hasPermission(loggedInUser && loggedInUser.llc_permissions, ['complete-task']) && (
                            <Menu.Item leftSection={
                                <IconCircleCheck
                                    className="cursor-pointer"
                                    size={20}
                                    stroke={1.50}
                                    color="#4d4d4d"
                                />
                            }
                                onClick={handleCompleteTask}
                            >
                                {translate('Complete Task')}
                            </Menu.Item>
                        )}
                        {actions.includes('changeSection') && hasPermission(loggedInUser && loggedInUser.llc_permissions, ['change-section']) && (
                            <Menu.Item
                            >
                                <ChangeTaskSection task={taskData} taskId={taskData && taskData.id} isDrawer />
                            </Menu.Item>
                        )}
                        {actions.includes('archive') && hasPermission(loggedInUser && loggedInUser.llc_permissions, ['archive-task']) && (
                            <Menu.Item leftSection={
                                <IconArchive
                                    className="cursor-pointer"
                                    size={20}
                                    stroke={1.50}
                                    color="#4d4d4d"
                                />
                            }
                                onClick={archiveTaskHandler}
                            >
                                {translate('Archive Task')}
                            </Menu.Item>
                        )}
                        {actions.includes('changeVisibility') && taskData && taskData.createdBy_id == loggedInUser?.loggedUserId && (
                            <>
                                {taskData.taskPrivacy === 'public' && (
                                    <Menu.Item leftSection={
                                        <IconLock
                                            className="cursor-pointer"
                                            size={20}
                                            stroke={1.50}
                                            color="#4d4d4d"
                                        />
                                    }
                                        onClick={changeVisibilityHandler}
                                    >
                                        {translate('Make Private')}
                                    </Menu.Item>
                                )}
                                {taskData.taskPrivacy === 'private' && (
                                    <Menu.Item leftSection={
                                        <IconLockOpen
                                            className="cursor-pointer"
                                            size={20}
                                            stroke={1.50}
                                            color="#4d4d4d"
                                        />
                                    }
                                        onClick={changeVisibilityHandler}
                                    >
                                        {translate('Make Public')}
                                    </Menu.Item>
                                )}
                            </>
                        )}
                        {actions.includes('duplicateTask') && hasPermission(loggedInUser && loggedInUser.llc_permissions, ['duplicate-task']) && (
                            <Menu.Item leftSection={
                                <IconCopy
                                    className="cursor-pointer"
                                    size={20}
                                    stroke={1.50}
                                    color="#4d4d4d"
                                />
                            }
                                onClick={duplicateTaskHandler}
                            >
                                {translate('Duplicate Task')}
                            </Menu.Item>
                        )}
                        {actions.includes('ganttTask') && (taskData && taskData.status !== 'COMPLETED') && hasPermission(loggedInUser && loggedInUser.llc_permissions, ['add-remove-task-to-gantt']) && (
                            <>
                                {taskData.ganttIsVisible === 1 ? (
                                    <Menu.Item leftSection={
                                        <IconCircleMinus
                                            className="cursor-pointer"
                                            size={20}
                                            stroke={1.50}
                                            color="#4d4d4d"
                                        />
                                    }
                                        onClick={removeTaskFromGanttHandler}
                                    >
                                        {translate('Remove from Gantt')}
                                    </Menu.Item>
                                ) : (
                                    <Menu.Item leftSection={
                                        <IconCirclePlus
                                            className="cursor-pointer"
                                            size={20}
                                            stroke={1.50}
                                            color="#4d4d4d"
                                        />
                                    }
                                        onClick={addTaskToGanttHandler}
                                    >
                                        {translate('Add to Gantt')}
                                    </Menu.Item>
                                )}
                            </>
                        )}
                        {actions.includes('delete') && (
                            hasPermission(loggedInUser && loggedInUser.llc_permissions, ['delete-task']) ||
                            (taskData && taskData.createdBy_id == loggedInUser?.loggedUserId)
                        ) && (
                                <Menu.Item
                                >
                                    <TaskDelete task={taskData} taskId={taskData?.id} isDrawer />
                                </Menu.Item>
                            )}
                    </Menu.Dropdown>
                )}
            </Menu>
        </>


    );
};

export default TaskActionsMenu;
