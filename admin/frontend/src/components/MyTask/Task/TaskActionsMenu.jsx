import React, { Fragment, useEffect, useState } from 'react';
import { IconPlus, IconSubtask, IconDotsVertical, IconTrash, IconEye, IconArchiveFilled, IconArchive, IconCircleCheck } from '@tabler/icons-react';
import EditMyTaskDrawer from "../EditMyTaskDrawer";
import { useDisclosure } from "@mantine/hooks";
import { useSelector, useDispatch } from 'react-redux';
import { hasPermission } from "../../ui/permissions";
import { Accordion, ActionIcon, Box, Grid, Pill, Tooltip, Avatar, Popover, List, Flex, Text, Drawer } from "@mantine/core";
import { modals } from "@mantine/modals";
import TaskDelete from "../../Elements/Project/TasksElements/Task/TaskDelete";
import { showNotification } from "@mantine/notifications";
import ChangeTaskSection from "../../Elements/Project/TasksElements/Task/ChangeTaskSection";
import { createTask, deleteTask, archiveTask, completeTask } from "../../Settings/store/taskSlice";

const TaskActionsMenu = ({ component, taskData }) => {
    console.log(component);
    console.log(taskData);
    const dispatch = useDispatch();
    const { loggedInUser } = useSelector((state) => state.auth.session);
    const { loggedUserId } = useSelector((state) => state.auth.user);
    const { childColumns } = useSelector((state) => state.settings.task);
    const [taskEditDrawerOpen, { open: openTaskEditDrawer, close: closeTaskEditDrawer }] = useDisclosure(false);

    const [task, setTask] = useState(taskData);

    useEffect(() => { setTask(taskData); }, [taskData]);

    const handleEditTaskDrawerOpen = () => {
        openTaskEditDrawer();
    };

    const [selectedAccordion, setSelectedAccordion] = useState('');
    const toggleSection = (section) => {
        setSelectedAccordion(section);
    };

    const archiveTaskHandler = (taskSectionId, taskId) => {
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
                    showNotification({
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

    const handleCompleteTask = (taskData) => {
        modals.openConfirmModal({
            title: 'Complete Task',
            centered: true,
            children: (
                <Text size="sm">
                    Are you sure you want to complete this task?
                </Text>
            ),
            labels: { confirm: 'Yes, complete it', cancel: 'cancel' },
            onConfirm: () => {
                dispatch(completeTask({
                    id: taskData.id,
                    data: {
                        project_id: taskData.project_id,
                        updated_by: loggedInUser?.loggedUserId ?? loggedUserId,
                    }
                }))
                    .then((response) => {
                        if (response.payload && response.payload.status && response.payload.status === 200) {
                            showNotification({
                                id: 'load-data',
                                loading: true,
                                title: 'Task',
                                message: response.payload && response.payload.message && response.payload.message,
                                autoClose: 2000,
                                disallowClose: true,
                                color: 'green',
                            });
                        } else {
                            showNotification({
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

    return (
        <>
            <Popover width={200} position="bottom-end" withArrow shadow="md">
                <Popover.Target>
                    <IconDotsVertical size={20} stroke={1.25} />
                </Popover.Target>
                <Popover.Dropdown>


                    <List
                        spacing="xs"
                        size="sm">

                        <List.Item>
                            <Flex className={`cursor-pointer`} align='center' onClick={() => {

                                handleEditTaskDrawerOpen(taskData)
                            }}
                                gap={`sm`}>
                                <IconEye
                                    className="cursor-pointer"
                                    size={20}
                                    stroke={1.50}
                                    color="#4d4d4d"
                                /> <Text size='sm'>View Task</Text>
                            </Flex>
                        </List.Item>
                        <List.Item>
                            <Flex className={`cursor-pointer`} align='center' onClick={() => {

                                handleCompleteTask(taskData)
                            }}
                                gap={`sm`}>
                                <IconCircleCheck
                                    className="cursor-pointer"
                                    size={20}
                                    stroke={1.50}
                                    color="#4d4d4d"
                                /> <Text size='sm'>Complete Task</Text>
                            </Flex>
                        </List.Item>
                        <List.Item>
                            <ChangeTaskSection task={taskData} taskId={taskData && taskData.id} />
                        </List.Item>

                        {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['archive-task']) &&
                            <List.Item>
                                <Flex className={`cursor-pointer`} align='center' onClick={() => {

                                    archiveTaskHandler(taskData?.task_section_id, taskData?.id)
                                }}
                                    gap={`sm`}>
                                    <IconArchiveFilled
                                        className="cursor-pointer"
                                        size={20}
                                        stroke={1.50}
                                        color="#4d4d4d"
                                    /> <Text size='sm'>Archive Task</Text>
                                </Flex>
                            </List.Item>
                        }
                        {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['delete-task']) || (taskData && taskData.createdBy_id == loggedInUser?.loggedUserId) &&
                            <List.Item>
                                <TaskDelete task={taskData} taskId={taskData?.id} />
                            </List.Item>
                        }
                    </List>

                </Popover.Dropdown>
            </Popover>

            {/* {taskEditDrawerOpen && <EditMyTaskDrawer taskObj={task} taskId={task && task.id} taskEditDrawerOpen={taskEditDrawerOpen} openTaskEditDrawer={openTaskEditDrawer} closeTaskEditDrawer={closeTaskEditDrawer} />} */}

            {taskEditDrawerOpen && (
                <Drawer
                    opened={taskEditDrawerOpen}
                    onClose={closeTaskEditDrawer}
                    position="right"
                    withCloseButton={false}
                    size="lg"
                    closeOnClickOutside={true}
                    overlayProps={{ backgroundOpacity: 0, blur: 0 }}
                    lockScroll={true}
                >
                    <EditMyTaskDrawer
                        taskObj={task}
                        taskId={task && task.id}
                        taskEditDrawerOpen={taskEditDrawerOpen}
                        openTaskEditDrawer={openTaskEditDrawer}
                        closeTaskEditDrawer={closeTaskEditDrawer}
                    />
                </Drawer>
            )}
        </>


    );
};

export default TaskActionsMenu;
