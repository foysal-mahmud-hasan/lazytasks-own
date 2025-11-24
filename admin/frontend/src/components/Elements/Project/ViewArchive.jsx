import React, { Fragment, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Avatar,
    LoadingOverlay, Card,
    ScrollArea,
    Text, TextInput,
    Title, Drawer,
    Tooltip, Tabs, useMantineTheme,
} from '@mantine/core';
import { showNotification, updateNotification } from "@mantine/notifications";
import { notifications } from "@mantine/notifications";
import { IconUserCircle, IconArchiveOff, IconTrash, IconCheck, IconSearch } from '@tabler/icons-react';
import { fetchArchiveTasks, unarchiveTask, deleteTask, removeSuccessMessage } from "../../../components/Settings/store/taskSlice";
import acronym from "../../../components/ui/acronym";
import useTwColorByName from "../../../components/ui/useTwColorByName";
import { modals } from '@mantine/modals';
import { translate } from '../../../utils/i18n';

const ViewArchive = ({ onCloseDrawer }) => {
    const theme = useMantineTheme();
    const dispatch = useDispatch();
    const bgColor = useTwColorByName();

    const { archivedTasks, archivedSections, isLoading, isError, error } = useSelector((state) => state.settings.task);
    const { loggedInUser } = useSelector((state) => state.auth.session);
    const { loggedUserId } = useSelector((state) => state.auth.user);

    // Add local loading state
    const [localLoading, setLocalLoading] = useState(false);
    const [searchQueryTasks, setSearchQueryTasks] = useState('');
    const [searchQuerySections, setSearchQuerySections] = useState('');

    useEffect(() => {
        setLocalLoading(true);
        dispatch(fetchArchiveTasks())
            .then(() => {
                setLocalLoading(false);
            })
            .catch(() => {
                setLocalLoading(false);
            });
    }, [dispatch]);

    const filteredTasks = archivedTasks.filter(task =>
        task.taskName.toLowerCase().includes(searchQueryTasks.toLowerCase())
    );

    const filteredSections = archivedSections.filter(section =>
        section.sectionName.toLowerCase().includes(searchQuerySections.toLowerCase())
    );

    const unarchiveTaskHandler = (taskSectionId, taskId) => {
        if (onCloseDrawer) onCloseDrawer();
        modals.openConfirmModal({
            title: 'Unarchive Task',
            centered: true,
            children: (
                <Text size="sm">
                    Are you sure you want to unarchive this task?
                </Text>
            ),
            labels: { confirm: 'Unarchive', cancel: 'Cancel' },
            confirmProps: { color: 'orange' },
            onConfirm: () => {
                showNotification({
                    id: 'load-data',
                    loading: true,
                    title: 'Task',
                    message: "Unarchiving The Task...",
                    disallowClose: true,
                    color: 'green',
                });
                dispatch(unarchiveTask({
                    id: taskSectionId,
                    data: {
                        task_id: taskId,
                        updated_by: loggedInUser?.loggedUserId ?? loggedUserId,
                    }
                }))
                    .then((response) => {
                        if (response.payload && response.payload.status === 200) {
                            updateNotification({
                                id: 'load-data',
                                loading: true,
                                title: 'Task',
                                message: response.payload?.message,
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
            }
        });
    };

    const deleteTaskHandler = (taskId) => {
        if (onCloseDrawer) onCloseDrawer();
        modals.openConfirmModal({
            title: 'Delete Task',
            centered: true,
            children: (
                <Text size="sm" c="red">
                    Are you sure you want to permanently delete this task? This action cannot be undone.
                </Text>
            ),
            labels: { confirm: 'Delete', cancel: 'Cancel' },
            confirmProps: { color: 'red' },
            onConfirm: () => {
                showNotification({
                    id: 'load-data',
                    loading: true,
                    title: 'Task',
                    message: "Deleting The Task...",
                    disallowClose: true,
                    color: 'green',
                });
                const taskType = 'task';
                dispatch(deleteTask({
                    id: taskId,
                    data: {
                        deleted_by: loggedInUser?.loggedUserId ?? loggedUserId,
                        type: taskType
                    }
                }))
                    .then((response) => {
                        if (response.payload.status === 200) {
                            updateNotification({
                                id: 'load-data',
                                loading: true,
                                title: 'Task',
                                message: response.payload && response.payload.message && response.payload.message,
                                disallowClose: true,
                                color: 'green',
                            });
                            // notifications.show({
                            //     color: theme.primaryColor,
                            //     title: response.payload.message,
                            //     icon: <IconCheck />,
                            //     autoClose: 3000,
                            // });

                            // const timer = setTimeout(() => {
                            //     dispatch(removeSuccessMessage());
                            // }, 2000);

                            setLocalLoading(true);
                            dispatch(fetchArchiveTasks())
                                .then(() => setLocalLoading(false))
                                .catch(() => setLocalLoading(false));

                            // return () => clearTimeout(timer);
                        }
                    });
            }
        });
    };


    const unarchiveSectionHandler = (taskSectionId) => {
        if (onCloseDrawer) onCloseDrawer();
        modals.openConfirmModal({
            title: 'Unarchive Task',
            centered: true,
            children: (
                <Text size="sm">
                    Are you sure you want to unarchive this task?
                </Text>
            ),
            labels: { confirm: 'Unarchive', cancel: 'Cancel' },
            confirmProps: { color: 'orange' },
            onConfirm: () => {
                showNotification({
                    id: 'load-data',
                    loading: true,
                    title: 'Task',
                    message: "Unarchiving Section...",
                    disallowClose: true,
                    color: 'green',
                });
                dispatch(unarchiveTask({
                    id: taskSectionId,
                    data: {
                        task_id: null,
                        unarchive_section: true,
                        updated_by: loggedInUser?.loggedUserId ?? loggedUserId,
                    }
                }))
                    .then((response) => {

                        if (response.payload && response.payload.status && response.payload.status === 200) {
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
            }
        });

    };
    return (
        <>
            <ScrollArea className="h-[calc(100vh-120px)] pr-1" scrollbarSize={4} offsetScrollbars={true}>
                <Card size="md" radius="sm">

                    <Tabs variant="pills" radius="sm" defaultValue="tasks" className='my-tabs'
                        styles={{
                            tab: { color: '#202020', backgroundColor: '#F5F8F9' },
                        }}
                    >
                        <Tabs.List className="mb-3" grow>
                            <Tabs.Tab value="tasks" className="font-bold">
                                {translate('Archived Tasks')}
                            </Tabs.Tab>
                            <Tabs.Tab value="sections" className="font-bold">
                                {translate('Archived Sections')}
                            </Tabs.Tab>
                        </Tabs.List>
                        <Tabs.Panel value="tasks">
                            <TextInput
                                leftSection={<IconSearch size={18} />}
                                placeholder={translate('Search archived tasks...')}
                                value={searchQueryTasks}
                                onChange={(e) => setSearchQueryTasks(e.target.value)}
                                className="mb-3"
                            />

                            <LoadingOverlay visible={localLoading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />

                            {filteredTasks && filteredTasks.length > 0 ? filteredTasks.map((task) => (

                                <Card withBorder size="xs" radius="sm" padding="xs" className='mb-2' key={task.taskId}>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <Text size='sm'>{task.taskName}</Text>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {task.assignedToUsername ? (
                                                <Tooltip label={task.assignedToUsername} position="top" withArrow>
                                                    <Avatar
                                                        size='30'
                                                        src={task && task.avatar ? task.avatar : null}
                                                        stroke='1.25'
                                                    >
                                                        {task && task.avatar ? '' : <Text style={{ "lineHeight": "14px" }} size="xs">{task && task.assignedToUsername ? acronym(task.assignedToUsername) : ""}</Text>}
                                                    </Avatar>
                                                </Tooltip>
                                            ) : (
                                                <div className="h-[30px] w-[30px] border border-dashed border-[#202020] rounded-full flex items-center justify-center">
                                                    <Tooltip label="Assign to" position="top" withArrow>
                                                        <IconUserCircle color="#4d4d4d" size={20} stroke={1.25} />
                                                    </Tooltip>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <Tooltip label="Unarchive" position="top" withArrow>
                                                    <IconArchiveOff
                                                        className="cursor-pointer"
                                                        color="var(--mantine-color-orange-filled)"
                                                        size={22}
                                                        stroke={1.25}
                                                        onClick={() => unarchiveTaskHandler(task.sectionId, task.taskId)}
                                                    />
                                                </Tooltip>
                                                {!task.has_child && (
                                                    <IconTrash
                                                        className="cursor-pointer"
                                                        color="var(--mantine-color-red-filled)"
                                                        size={22}
                                                        stroke={1.25}
                                                        onClick={() => deleteTaskHandler(task.taskId)}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                            )) : (
                                <Card withBorder size="xs" radius="sm" padding="xs" className='mb-2'>
                                    <Text size='sm' ta='center'>{translate('No archived tasks')}</Text>
                                </Card>
                            )}

                        </Tabs.Panel>
                        <Tabs.Panel value="sections">
                            <TextInput
                                leftSection={<IconSearch size={18}/>}
                                placeholder={translate('Search archived sections...')}
                                value={searchQuerySections}
                                onChange={(e) => setSearchQuerySections(e.target.value)}
                                className="mb-3"
                            />

                            {filteredSections && filteredSections.length > 0 ? filteredSections.map((section, index) => (
                                <Card withBorder size="xs" radius="sm" padding="xs" className='mb-2' key={section.sectionId}>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <Text size='sm'>{section.sectionName}</Text>
                                        </div>
                                        <div className="flex justify-end items-center gap-3">
                                            <div className="flex items-center gap-2">
                                                <Tooltip label="Unarchive" position="top" withArrow>
                                                    <IconArchiveOff
                                                        className="cursor-pointer"
                                                        color="var(--mantine-color-orange-filled)"
                                                        size={22}
                                                        stroke={1.25}
                                                        onClick={() => unarchiveSectionHandler(section.sectionId)}
                                                    />
                                                </Tooltip>

                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            )) :
                                (
                                    <Card withBorder size="xs" radius="sm" padding="xs" className='mb-2'>
                                        <Text size='sm' ta='center'>{translate('No archived sections')}</Text>
                                    </Card>
                                )}

                        </Tabs.Panel>
                    </Tabs>
                </Card>
            </ScrollArea>
        </>
    );
}
export default ViewArchive;