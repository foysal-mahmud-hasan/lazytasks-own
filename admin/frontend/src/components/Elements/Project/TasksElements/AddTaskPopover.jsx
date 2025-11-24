import React, { useEffect, useRef, useState } from 'react';
import {
    Button,
    rem,
    useMantineTheme,
    TextInput, Tooltip, Avatar, Popover, Flex
} from '@mantine/core';
import { IconCheck, IconPaperclip, IconPlus, IconSubtask } from '@tabler/icons-react';

import { useDispatch, useSelector } from "react-redux";
import {
    createTask,
    removeSuccessMessage,
} from "../../../Settings/store/taskSlice";
import { notifications } from "@mantine/notifications";
import { useForm } from "@mantine/form";
import { translate } from '../../../../utils/i18n';

const AddTaskPopover = (props) => {
    const { projectId, taskSectionId, isSubtask, parent, openOnHotkey } = props;

    const dispatch = useDispatch();
    const theme = useMantineTheme();
    const { loggedUserId } = useSelector((state) => state.auth.user)
    const { loggedInUser } = useSelector((state) => state.auth.session)

    const icon = <IconPaperclip style={{ width: rem(18), height: rem(18) }} stroke={1.5} />;
    const [openedAddTaskPopover, setOpenedAddTaskPopover] = useState(false);
    // const [openedAddTaskPopover, { closeAddTaskPopover, openAddTaskPopover }] = useDisclosure(false);

    useEffect(() => {
        if (openOnHotkey) setOpenedAddTaskPopover(true);
    }, [openOnHotkey]);

    const form = useForm({
        mode: 'uncontrolled',
        initialValues: {
            name: '',
        },

        // validate required name
        validate: {
            name: (value) => (value.length < 1 ? 'Name is required' : null),
        }
    });

    const inputRef = useRef(null);
    useEffect(() => {
        if (openedAddTaskPopover) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [openedAddTaskPopover]);

    const handleTaskCreation = (newTaskData) => {

        newTaskData['project_id'] = projectId;
        newTaskData['task_section_id'] = taskSectionId;
        newTaskData['created_by'] = loggedInUser ? loggedInUser.loggedUserId : loggedUserId;
        newTaskData['type'] = 'task';
        newTaskData['status'] = 'ACTIVE';
        newTaskData['is_visible'] = true;
        if (isSubtask && parent) {
            newTaskData['parent'] = parent;
            newTaskData['type'] = 'sub-task';
        }

        

        if (newTaskData.name !== '' && newTaskData.name !== 'Type task name here') {
            dispatch(createTask(newTaskData)).then((response) => {
                if (response.payload.status === 200) {

                    setOpenedAddTaskPopover(false)
                    //form reset
                    form.reset();
                    notifications.show({
                        color: theme.primaryColor,
                        title: response.payload.message || 'Task created successfully',
                        icon: <IconCheck />,
                        autoClose: 5000,
                    });
                    const timer = setTimeout(() => {
                        dispatch(removeSuccessMessage());
                    }, 5000); // Clear notification after 3 seconds

                    return () => clearTimeout(timer);

                }
            });


        }
    };

    return (
        <Popover
            width="310"
            position="bottom-end"
            offset={isSubtask ? { mainAxis: 7, crossAxis: 40 } : { mainAxis: 7, crossAxis: 10 }}
            withArrow
            arrowOffset={isSubtask ? 50 : 20}
            shadow="md"
            opened={openedAddTaskPopover}
            onChange={setOpenedAddTaskPopover}
            withinPortal={false}
        >
            <Popover.Target>
            {isSubtask ? (
                <Tooltip label={isSubtask ? translate('Add Subtask') : translate('Add Task')} position="top" withArrow withinPortal={false}>
                <div onClick={() => setOpenedAddTaskPopover(!openedAddTaskPopover)}
                    className="h-[24px] w-[24px] border border-solid border-[#4d4d4d] rounded-full p-[2px] create-subtask">
                    <IconPlus color="#4d4d4d" size="18" className="cursor-pointer" />
                </div>
                </Tooltip>
            ) : (
                <Tooltip label={isSubtask ? translate('Add Subtask') : translate('Add Task')} position="top" withArrow withinPortal={false}>
                    <Avatar
                        className={`cursor-pointer`}
                        // onClick={()=> openAddTaskPopover()}
                        onClick={() => setOpenedAddTaskPopover(!openedAddTaskPopover)}
                        // onClick={handleAddTaskDrawerOpen}
                        size={`sm`}
                        bg="#ED7D31"
                        color="#fff"
                    >
                        {/* {isSubtask ? (
                            <IconSubtask className=' hover:scale-110' size={18} />
                        ) : (
                            <IconPlus className=' hover:scale-110' size={18} />
                        )} */}
                        <IconPlus className=' hover:scale-110' size={18} />
                    </Avatar>
                </Tooltip>
            )}
                
            </Popover.Target>
            <Popover.Dropdown>

                <form onReset={form.onReset} onSubmit={form.onSubmit((values) => {
                    handleTaskCreation(values)
                })}>
                    <TextInput
                        withAsterisk
                        placeholder="Type task name here"
                        key={form.key('name')}
                        {...form.getInputProps('name')}
                        ref={inputRef}
                    />

                    <Flex
                        gap="md"
                        justify="flex-start"
                        align="center"
                        direction="row"
                        wrap="wrap"
                        className={`mt-3`}
                    >
                        <Button type="submit" variant="filled" color="orange">Add</Button>
                        {/*input field clear*/}

                        <Button type={`reset`} variant="white" color="rgba(0, 0, 0, 1)" onClick={() => {
                            setTimeout(() => {
                            inputRef.current?.focus();
                            }, 50);
                        }}>Clear</Button>
                    </Flex>

                </form>

            </Popover.Dropdown>
        </Popover>
    );
};


export default AddTaskPopover;