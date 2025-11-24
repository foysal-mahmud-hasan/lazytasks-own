import React, { useState } from 'react';
import {
    ActionIcon,
    Flex,
    ScrollArea,
    TextInput,
    Text, Tooltip,
    Card, Group, Divider,
    Box,
    ThemeIcon
} from '@mantine/core';
import { useSelector, useDispatch } from 'react-redux';
import { createQuickTask, deleteQuickTask } from "../Settings/store/quickTaskSlice";
import { IconDeviceFloppy, IconExchange, IconTrash, IconInfoCircle } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import AddTaskFromQuickTaskDrawer from "../QuickTask/AddTaskFromQuickTaskDrawer";
import AddTaskDrawer from '../Elements/Project/TasksElements/AddTaskDrawer';
import { showNotification } from "@mantine/notifications";
import { translate } from "../../utils/i18n";

const QuickTaskList = () => {

    const dispatch = useDispatch();
    const [newQuickTask, setNewQuickTask] = useState('');
    const { loggedUserId } = useSelector((state) => state.auth.user);
    const { tasks } = useSelector((state) => state.settings.quickTask);
    const handleInputChange = (e) => {
        setNewQuickTask(e.target.value);
    };
    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            if (newQuickTask.trim() !== '') {
                const submitData = {
                    name: newQuickTask,
                    user_id: loggedUserId
                }
                dispatch(createQuickTask(submitData))
                setNewQuickTask('');
            }

        }
    };

    const handleInputClick = () => {
        if (newQuickTask.trim() !== '') {
            const submitData = {
                name: newQuickTask,
                user_id: loggedUserId
            }
            dispatch(createQuickTask(submitData)).then((res) => {
                if (res.payload && res.payload.status && res.payload.status === 200) {
                    showNotification({
                        id: 'load-data',
                        loading: true,
                        title: 'Quick Task',
                        message: res.payload && res.payload.message && res.payload.message,
                        autoClose: 2000,
                        disallowClose: true,
                        color: 'green',
                    });
                }
            });
            setNewQuickTask('');
        }
    };


    const [selectedTask, setSelectedTask] = useState(null);

    const [taskEditDrawerOpen, { open: openTaskEditDrawer, close: closeTaskEditDrawer }] = useDisclosure(false);
    const handleEditTaskDrawerOpen = (task) => {
        setSelectedTask(task)
        openTaskEditDrawer();
    };

    const handleDeleteQuickTask = (taskId) => modals.openConfirmModal({
        title: (
            <>
                <Group spacing="xs">
                    <ThemeIcon color="red" radius="xl" size="lg" variant="filled">
                        <IconTrash size={24} />
                    </ThemeIcon>
                    <Text size="md" weight={500}>
                        {translate('You are parmanently deleting this quick task')}
                    </Text>
                </Group>
                <Divider size="xs" mt={10} style={{
                    marginLeft: '-16px',
                    width: 'calc(100% + 82px)'
                }} />
            </>
        ),
        size: 'md',
        radius: 'md',
        withCloseButton: false,
        centered: true,
        children: (
            <Text size="md" mb='lg'>
                {translate('Are you Sure to delete this quick task ?')}
            </Text>
        ),
        labels: { confirm: translate('Yes'), cancel: translate('No') },
        confirmProps: { color: 'orange' },
        onCancel: () => console.log('Cancel'),
        onConfirm: () => {
            if (taskId && taskId !== 'undefined') {

                dispatch(deleteQuickTask(taskId)).then((response) => {
                    //status 200
                    if (response.payload.status === 200) {
                        showNotification({
                            title: 'Success',
                            message: response.payload.message,
                            color: 'green',
                        });
                    }

                })
                    .catch((error) => {
                        showNotification({
                            title: 'Error',
                            message: error.message || 'Failed to delete quick task',
                            color: 'red',
                        });
                    });

            }
        },
    });

    return (
        <>
            <Card withBorder radius="sm" h={"100%"}>
                <Card.Section withBorder inheritPadding py="xs" className="bg-[#EBF1F4] mb-2">
                    <Group justify="space-between">
                        <Text fw={600} size='md'>{translate('Quick Tasks')}</Text>
                        <Tooltip size="xs"
                            label={
                                <>
                                    <Text size="sm" fw={700} mb={5}>
                                        {translate('Have something in mind? Thinking of something?')}
                                    </Text>
                                    <br />
                                    <Text size="sm">
                                        {translate('Jot it down here quickly before you forget.')}
                                    </Text>
                                    <Text size="sm">
                                        {translate('Ensure every task, note, or idea is safely recorded!')}
                                    </Text>
                                    <br />
                                    <Text size="sm">
                                        {translate('Convert it to a full blown task later at your convenience.')}
                                    </Text>
                                    <Text size="sm">
                                        {translate('Happy Tasking 🚀')}
                                    </Text>
                                </>
                            }
                            position="top-start"
                            multiline
                            withArrow
                            width={220}
                            transitionProps={{ duration: 200 }}
                        >
                            <IconInfoCircle
                                size={20}
                                color="#4D4D4D"
                                style={{ cursor: 'pointer', marginRight: '5px' }}
                            />
                        </Tooltip>
                    </Group>
                </Card.Section>
                <Box p="sm" bg="#FBFCFD" h={"100%"}>
                    <TextInput
                        radius="sm"
                        size="sm"
                        placeholder={translate('Add Quick Tasks')}
                        onKeyDown={handleKeyDown}
                        onChange={handleInputChange}
                        value={newQuickTask}
                        rightSectionWidth={42}
                        rightSection={
                            <ActionIcon onClick={handleInputClick} size={24} radius="xl" color="#ED7D31" variant="filled">
                                <IconDeviceFloppy style={{ width: '18px', height: '18px' }} stroke={1.5} />
                            </ActionIcon>
                        }
                        mb={5}
                    />
                    <ScrollArea h={267} className="relative pb-[2px]" scrollbarSize={4}>
                        <Box>
                            {tasks && tasks.length > 0 ? tasks.map((task, index) => (
                                //odd and even calculated index value
                                <Box className={`${index % 2 === 0 ? 'bg-[#FFFFFF]' : ''}`}>
                                    <Box onDoubleClickCapture={() => { handleEditTaskDrawerOpen(task) }} className="content px-2 py-2 flex items-center justify-between">
                                        <Text size='sm'>{task.name}</Text>
                                        <Flex justify="flex-end" gap="xs">
                                            <Tooltip label={translate('Convert to Task')} position="top" withArrow withinPortal={false}>
                                                <ActionIcon variant="light" color="orange" aria-label="Convert" onClick={() => { handleEditTaskDrawerOpen(task) }}>
                                                    <IconExchange size={18} stroke={1.5} />
                                                </ActionIcon>
                                            </Tooltip>
                                            <Tooltip label={translate('Delete Quick Task')} position="top" withArrow withinPortal={false}>
                                                <ActionIcon variant="transparent" color="red" aria-label="Convert" onClick={() => { handleDeleteQuickTask(task.id) }}>
                                                    <IconTrash size={22} stroke={1.5} color='red' style={{ marginTop: '2px', marginRight: '3px' }} />
                                                </ActionIcon>
                                            </Tooltip>
                                        </Flex>
                                    </Box>
                                </Box>
                            )
                            ) : <Box className="text-center pt-4 text-sm">
                                {translate('You have no quick tasks at the moment.')} <br />
                                {translate('Let\'s create one and become more efficient.')} <br />
                                <span style={{ color: "#ED7D31", paddingTop: "5px", display: "inline-block" }}>
                                    {translate('Never forget a task however small it is!')}
                                </span>
                            </Box>
                            }

                        </Box>
                        {/* {tasks && tasks.length > 4 &&
                            <div className="absolute bottom-0 right-1 bg-white">
                                <Link to={`/my-task`}>
                                    <Button color="#ED7D31" radius="xl" size="compact-xs">
                                        {translate('More...')}
                                    </Button>
                                </Link>
                            </div>
                        } */}

                    </ScrollArea>


                </Box>

            </Card>
            {
                selectedTask && (<AddTaskFromQuickTaskDrawer task={selectedTask} taskEditDrawerOpen={taskEditDrawerOpen} openTaskEditDrawer={openTaskEditDrawer} closeTaskEditDrawer={closeTaskEditDrawer} />)
            }
        </>
    );
};

export default QuickTaskList;
