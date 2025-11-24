import { IconTrash } from '@tabler/icons-react';
import React, { Fragment } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { deleteTask, removeSuccessMessage, closeTaskEditDrawer } from "../../../../Settings/store/taskSlice";
import { Button, Text, useMantineTheme, Flex, Group, ThemeIcon, Divider } from '@mantine/core';
import { modals } from "@mantine/modals";
import { hasPermission } from "../../../../ui/permissions";
import { showNotification, updateNotification } from '@mantine/notifications';
import { translate } from '../../../../../utils/i18n';
const TaskDelete = ({ task, taskId, isSubtask, isDrawer }) => {
    const theme = useMantineTheme();
    const dispatch = useDispatch();
    const { loggedUserId } = useSelector((state) => state.auth.user)
    const { loggedInUser } = useSelector((state) => state.auth.session)

    //taskDeleteHandler
    const taskDeleteHandler = () => modals.openConfirmModal({
        title: (
            <>
                <Group spacing="xs">
                    <ThemeIcon color="red" radius="xl" size="lg" variant="filled">
                        <IconTrash size={24} />
                    </ThemeIcon>
                    <Text size="md" weight={500}>
                        You are parmanently deleting this {isSubtask ? 'subtask' : 'task'}
                    </Text>
                </Group>
                <Divider size="xs" mt={14} className= {isSubtask ? '!-ml-4 w-[calc(100%+6rem)]' : '!-ml-4 w-[calc(100%+7.7rem)]'} />
            </>
        ),
        size: 'md',
        radius: 'md',
        withCloseButton: false,
        children: (
            <Text size="md" mb='lg'>
                Are you Sure to delete this {isSubtask ? 'subtask' : 'task'} ?
            </Text>
        ),
        labels: { confirm: 'Yes', cancel: 'No' },
        centered: true,
        confirmProps: { color: 'red' },
        onCancel: () => console.log('Cancel'),
        onConfirm: () => {
            if (taskId && taskId !== 'undefined') {
                if (task && (task.children && task.children.length > 0 || task.attachments && task.attachments.length > 0)) {
                    modals.open({
                        withCloseButton: false,
                        centered: true,
                        children: (
                            <Fragment>
                                {task.children && task.children.length > 0 &&
                                    <Text size="sm">
                                        This task has {task.children.length} sub-tasks. Please delete all sub-tasks before deleting this task.
                                    </Text>
                                }
                                {task.attachments && task.attachments.length > 0 &&
                                    <Text size="sm">
                                        This task has {task.attachments.length} attachments. Please delete all attachments before deleting this task.
                                    </Text>
                                }
                                <div className="!grid w-full !justify-items-center">
                                    <Button justify="center" onClick={() => modals.closeAll()} mt="md">
                                        Ok
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
                        message: "Deleting The Task...",
                        disallowClose: true,
                        color: 'green',
                    });
                    const taskType = isSubtask ? 'sub-task' : 'task';
                    dispatch(deleteTask({ id: taskId, data: { 'deleted_by': loggedInUser ? loggedInUser.loggedUserId : loggedUserId, 'type': taskType } })).then((response) => {
                        //status 200
                        if (response.payload.status === 200) {
                            if (isDrawer) {
                                dispatch(closeTaskEditDrawer())
                            }
                            // dispatch(invalidateCompaniesCache(true));
                            updateNotification({
                                id: 'load-data',
                                loading: true,
                                title: 'Task',
                                message: response.payload && response.payload.message && response.payload.message,
                                disallowClose: true,
                                color: 'green',
                            });
                        }

                    });

                }

            }
        },
    });

    return (
        <>
            {(
                hasPermission(
                    loggedInUser && loggedInUser.llc_permissions,
                    ['delete-task', 'delete-subtask']
                ) || (task && task.createdBy_id == loggedInUser?.loggedUserId)
            ) && (
                    <Flex className="cursor-pointer items-center" gap="sm" onClick={taskDeleteHandler}>
                        <IconTrash
                            className="cursor-pointer"
                            size={20}
                            stroke={1}
                            color="red"
                        />
                        <Text size='sm' fw={400}>{translate('Delete')}</Text>
                    </Flex>
                )}


        </>
    );
};

export default TaskDelete;
