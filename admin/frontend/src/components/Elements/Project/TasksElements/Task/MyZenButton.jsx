import {IconCheck, IconTrash} from '@tabler/icons-react';
import React, {Fragment, useEffect, useRef, useState} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {Avatar, Button, Text, Title, useMantineTheme} from '@mantine/core';
import {modals} from "@mantine/modals";
import {hasPermission} from "../../../../ui/permissions";
import {notifications} from "@mantine/notifications";
import my_zen from "../../../../../img/my-zen-black.svg";
import {createMyZen} from "../../../../MyZen/store/myZenSlice";
const MyZenButton = ({ task, taskId, isSubtask }) => {
    const dispatch = useDispatch()
    const {loggedUserId} = useSelector((state) => state.auth.user)
    const {loggedInUser} = useSelector((state) => state.auth.session)


    //myZenHandler
    const myZenHandler = () => modals.openConfirmModal({
        title: (
            <Title order={5}>Are you sure this task my zen?</Title>
        ),
        size: 'sm',
        radius: 'md',
        centered: true,
        withCloseButton: false,
        children: (
            <Text size="sm">
                This action is so important that you are required to confirm it with a modal. Please click
                one of these buttons to proceed.
            </Text>
        ),
        labels: { confirm: 'Confirm', cancel: 'Cancel' },
        onCancel: () => console.log('Cancel'),
        onConfirm: () => {
            if(taskId && taskId!=='undefined'){
                const submitData = {
                    project_id: task && task.project_id,
                    task_id:  task ? task.id : taskId,
                    user_id: loggedInUser ? loggedInUser.loggedUserId : loggedUserId,
                    name:  task && task.name,
                    slug:  task && task.slug
                }

                dispatch(createMyZen(submitData))

            }
        },
    });

    return (
        <>
            {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['superadmin', 'admin', 'director', 'manager', 'line_manager', 'employee', 'task-delete']) &&
                <Avatar
                    //cusor pointer class
                    className={`cursor-pointer`}
                    onClick={()=> {myZenHandler()}}
                    src={my_zen}
                    stroke={1.25}
                    size={24} />
            }
        </>
    );
};

export default MyZenButton;
