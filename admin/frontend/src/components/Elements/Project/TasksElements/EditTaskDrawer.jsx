import React, { Fragment, useEffect, useRef, useState } from 'react';
import { useDisclosure } from '@mantine/hooks';
import {
    Box,
    FileInput,
    rem,
    Text,
    ScrollArea,
    Select,
    Avatar, Popover,
    LoadingOverlay, Anchor, ActionIcon, useMantineTheme, Accordion, Pill, Flex, Grid, Switch, CloseButton
} from '@mantine/core';
import {
    IconCheck,
    IconChevronDown,
    IconFile,
    IconPaperclip,
    IconTrash
} from '@tabler/icons-react';
import ContentEditable from 'react-contenteditable';
import TaskAssignTo from './Task/TaskAssignTo';
import TaskFollower from './Task/TaskFollower';
import TaskDueDate from './Task/TaskDueDate';
import TaskPriority from './Task/TaskPriority';
import TaskStatus from './Task/TaskStatus';
import TaskTag from './Task/TaskTag';
import TaskComment from './TaskComment';
import { useDispatch, useSelector } from "react-redux";

import { useEditor, EditorContent } from '@tiptap/react';
import { Link, RichTextEditor } from '@mantine/tiptap';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import Mention from '@tiptap/extension-mention';
import TextAlign from '@tiptap/extension-text-align';

import {
    closeTaskEditDrawer,
    createAttachment,
    createTask,
    deleteAttachment, deleteTask,
    editTask, fetchTask,
    setEditableTask
} from "../../../Settings/store/taskSlice";
import TaskActivity from "./TaskActivity";
import { hasPermission } from "../../../ui/permissions";
import { notifications } from "@mantine/notifications";
import TaskCommentAndActivity from "./TaskCommentAndActivity";
import TaskName from "./Task/TaskName";
import TaskActionsMenu from './Task/TaskActionsMenu';
import { translate } from '../../../../utils/i18n';

const EditTaskDrawer = (props) => {
    const { taskObj, taskId, taskEditDrawerOpen, isCalendar, submit } = props;
    const rawMembers = taskObj && taskObj.project && taskObj.project.members;
    const dispatch = useDispatch();
    const theme = useMantineTheme();

    const { loggedUserId } = useSelector((state) => state.auth.user)
    const { loggedInUser } = useSelector((state) => state.auth.session)
    const { task } = useSelector((state) => state.settings.task);
    const [selectedValue, setSelectedValue] = useState('Comments & Activities');
    const [visible, setVisible] = useState(false);
    const [subTask, setSubTask] = useState(task.children && task.children.length > 0 ? task.children : []);
    const [isLoading, setIsLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [isVisibleGantt, setIsVisibleGantt] = useState(!!(task && task.ganttIsVisible === 1));

    const [mentionPopoverOpened, setMentionPopoverOpened] = useState(false);
    const [popoverTarget, setPopoverTarget] = useState(null);
    const [mentionItems, setMentionItems] = useState([]);
    const [mentionCommand, setMentionCommand] = useState(() => () => { });
    const mentionAnchorRef = useRef(null);

    const isCompleted = taskObj && taskObj.parent && taskObj.status === 'COMPLETED';

    useEffect(() => {
        if (taskId) {
            dispatch(fetchTask({ id: taskId })).then((response) => {
                if (response.payload && response.payload.status === 200) {
                    setVisible(false);
                    setSubTask(response.payload.data.children && response.payload.data.children.length > 0 ? response.payload.data.children : []);
                }
            });
        }
    }, [taskId, selectedValue])

    useEffect(() => {
        if (taskId && isLoading === true) {
            dispatch(fetchTask({ id: taskId })).then((response) => {
                if (response.payload && response.payload.status === 200) {
                    console.log('joon')
                    setSubTask(response.payload.data.children && response.payload.data.children.length > 0 ? response.payload.data.children : []);
                }
            });
        }
    }, [taskId, isLoading])

    const contentEditableRef = useRef('');

    const icon = <IconPaperclip style={{ width: rem(18), height: rem(18) }} stroke={1.5} />;
    // const [taskEditDrawerOpen, { open: openTaskEditDrawer, close: closeTaskEditDrawer }] = useDisclosure(false);

    const [taskName, setTaskName] = useState(task && task.name ? task.name : 'Type task name here');
    const [taskDescription, setTaskDescription] = useState(task && task.description ? task.description : '');


    const [attachments, setAttachments] = useState(task.attachments && task.attachments.length > 0 ? task.attachments : []);

    const handleDrawerClose = () => {
        /*if(isCalendar){
            submit(taskObj);
        }else {
            dispatch(setEditableTask(taskObj))
        }*/
        handleTaskDescription(taskDescription);
        dispatch(closeTaskEditDrawer());
    }

    const handleFileUpload = (files) => {
        const MAX_FILE_SIZE = 1.9 * 1024 * 1024; // 2 MB in bytes
        const oversizedFiles = files.filter(file => file.size > MAX_FILE_SIZE);

        if (oversizedFiles.length > 0) {
            notifications.show({
                color: 'red',
                title: 'File size error',
                message: `Some files exceed the maximum size of 2 MB.`,
                autoClose: 3000,
            });
            return; // Stop further execution if there are oversized files
        }
        setUploading(true);
        const formData = new FormData();
        files.forEach((file, index) => {
            // formData.append(`attachments[${index}]`, file);
            formData.append(`attachments${index}`, file);
        });
        formData.append('task_id', task.id);
        formData.append('user_id', loggedInUser ? loggedInUser.loggedUserId : loggedUserId);
        dispatch(createAttachment({ data: formData })).then((response) => {
            setUploading(false);
            if (response.payload && response.payload.status === 200) {

                setAttachments(response.payload.data);

                notifications.show({
                    color: theme.primaryColor,
                    title: response.payload.message,
                    icon: <IconCheck />,
                    autoClose: 2000,
                });
            }else{
                notifications.show({
                    color: 'red',
                    title: 'Upload Failed',
                    message: response.payload ? response.payload.message : 'An error occurred during upload.',
                    autoClose: 3000,
                });
            }
        });
    };
    useEffect(() => {
        if (taskEditDrawerOpen === true) {
            setVisible(true);
            setTaskDescription(task && task.description ? task.description : '')
        }
        setAttachments(task.attachments && task.attachments.length > 0 ? task.attachments : [])
        setSubTask(task.children && task.children.length > 0 ? task.children : [])

        /*setTimeout(() => {
            setVisible(false);
        }, 1000);*/

    }, [taskEditDrawerOpen]);

    const [commentDropdownOpened, { toggle }] = useDisclosure();

    const handleSelect = (value) => {
        setSelectedValue(value);
        toggle();
    };


    const handlerBlur = () => {
        const taskEditableName = contentEditableRef.current.innerHTML;
        if (task && task.id && task.id !== 'undefined' && taskEditableName !== taskName) {
            dispatch(editTask({ id: task.id, data: { name: taskEditableName, 'updated_by': loggedInUser ? loggedInUser.loggedUserId : loggedUserId } }))
            setTaskName(taskEditableName);
            dispatch(setEditableTask({ ...task, name: taskEditableName }))
        }
    };

    const handleFocusSubtask = () => {

        // Clear the task name the default placeholder
        if (taskName === 'Type task name here') {
            setTaskName('');
        }
    };

    const handleTaskDescription = (description) => {
        // console.log(description);
        if (description && description !== '' && description !== task.description && hasPermission(loggedInUser && loggedInUser.llc_permissions, ['edit-task'])) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = description;

            // Find all mention elements
            const mentions = tempDiv.querySelectorAll('.mention');
            const mentionedUsers = Array.from(mentions).map(mention => ({
                id: mention.getAttribute('data-id'),
                name: mention.getAttribute('data-label')
            }));
            const updatedTask = {
                description: description,
                mention_users: mentionedUsers,
                updated_by: loggedInUser ? loggedInUser.loggedUserId : loggedUserId
            }
            dispatch(editTask({ id: task.id, data: updatedTask }))
            setTaskDescription(description);
            dispatch(setEditableTask({ ...task, description: description }))
        }
    }
    const handleAttachmentDelete = (id) => {
        setUploading(true);
        const deletedTaskAttachment = {
            task_id: task && task.id,
            deleted_by: loggedInUser ? loggedInUser.loggedUserId : loggedUserId
        }
        dispatch(deleteAttachment({ id: id, data: deletedTaskAttachment })).then((response) => {
            setUploading(false);
            if (response.payload && response.payload.status === 200) {

                setAttachments(response.payload.data);

                notifications.show({
                    color: theme.primaryColor,
                    title: response.payload.message,
                    icon: <IconCheck />,
                    autoClose: 2000,
                    // withCloseButton: true,
                });
            }
        });
    }

    useEffect(() => {
        setTaskName(task && task.name ? task.name : 'Type task name here')
        setTaskDescription(task && task.description ? task.description : '')
        setAttachments(task.attachments && task.attachments.length > 0 ? task.attachments : [])
        setSubTask(task.children && task.children.length > 0 ? task.children : [])
        setIsVisibleGantt(!!(task && task.ganttIsVisible === 1));
    }, [task]);

    const addSubtask = () => {

        dispatch(fetchTask({ id: taskId })).then((response) => {
            if (response.payload && response.payload.status === 200) {
                setSubTask(response.payload.data.children && response.payload.data.children.length > 0 ? response.payload.data.children : []);
                if (response.payload.data.children && response.payload.data.children.length > 0 && response.payload.data.children.some(subtask => subtask.name === 'Type task name here')) {
                    // /how to get the index of the first element that matches the condition
                    const index = response.payload.data.children.findIndex(subtask => subtask.name === 'Type task name here');

                    //index element tag editable
                    const subtask = response.payload.data.children[index];

                    if (subtask !== undefined) {
                        //drawerElement inner data-id
                        const subtaskElement = document.querySelector('.drawer-subtask').querySelector(`[data-id="${subtask.id}"]`);
                        // Replace with the actual class or ID of the drawer
                        if (subtaskElement) {
                            subtaskElement.focus(); // Perform actions like focusing the element
                        }
                    }

                    return false;
                } else {
                    const newTaskData = {
                        name: 'Type task name here',
                        parent: task,
                        task_section_id: task.task_section_id,
                        project_id: task.project_id,
                        type: 'sub-task',
                        created_by: loggedInUser ? loggedInUser.loggedUserId : loggedUserId,
                        status: 'ACTIVE'
                    }
                    dispatch(createTask(newTaskData)).then((response) => {
                        if (response.payload && response.payload.status === 200) {

                            setIsLoading(true)

                            if (response.payload.data.name !== 'Type task name here') {
                                notifications.show({
                                    color: theme.primaryColor,
                                    title: response.payload.message,
                                    icon: <IconCheck />,
                                    autoClose: 2000,
                                });
                            }
                            //settimeout to isLoading false
                            setTimeout(() => {
                                setIsLoading(false);
                            }, 0);
                        }
                    });
                }

            }
        });

    };

    //handleGanttIsVisible
    const handleGanttIsVisible = (isVisible) => {
        const updatedTask = {
            is_visible: isVisible ? 1 : 0,
        }
        dispatch(editTask({ id: task.id, data: updatedTask }))
        setIsVisibleGantt(isVisible);
        dispatch(setEditableTask({ ...task, ganttIsVisible: isVisible ? 1 : 0 }))
    }
    //handlerTaskOpen
    const handlerTaskOpen = (subtask) => {
        dispatch(setEditableTask(subtask))
    }

    // Add useRef for drawer
    const drawerRef = useRef(null);

    const [mentionProps, setMentionProps] = useState(null);
    const membersRef = useRef([]);
    useEffect(() => {
        if (rawMembers && rawMembers.length) {
            membersRef.current = rawMembers.map(user => ({
                id: user.id,
                label: user.name,
                avatar: user.avatar
            }));
        }
    }, [rawMembers]);

    const canEditDescription =
        !isCompleted && (
            hasPermission(loggedInUser && loggedInUser.llc_permissions, ['edit-task']) ||
            (task && task.createdBy_id == loggedInUser?.loggedUserId));

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3, 4, 5],
                },
            }),
            Link.configure({
                autolink: true,
                linkOnPaste: true,
                openOnClick: true,
                HTMLAttributes: {
                    target: '_blank',
                    rel: 'noopener noreferrer'
                }
            }),
            Underline,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Placeholder.configure({ placeholder: translate('What is the task about...') }),
            Mention.configure({
                HTMLAttributes: {
                    class: 'mention',
                    'data-id': 'id',
                    'data-label': 'label'
                },
                renderText: ({ node }) => `@${node.attrs.label}`,
                suggestion: {
                    char: '@',
                    items: ({ query }) =>
                        membersRef.current.filter(u =>
                            u.label.toLowerCase().startsWith(query.toLowerCase())
                        )
                        .sort((a, b) => a.label.localeCompare(b.label)),
                    render: () => {
                        return {
                            onStart: (props) => {
                                setMentionItems(props.items);
                                setMentionCommand(() => props.command);

                                // Use clientRect from props - this is the correct way
                                if (props.clientRect) {
                                    const rect = props.clientRect();
                                    if (rect && mentionAnchorRef.current) {
                                        mentionAnchorRef.current.style.top = `${rect.top}px`;
                                        mentionAnchorRef.current.style.left = '0px'; // Align to left edge
                                    }
                                }

                                setMentionPopoverOpened(true);
                            },
                            onUpdate: (props) => {
                                setMentionItems(props.items);
                                setMentionCommand(() => props.command);

                                // Update position on update
                                if (props.clientRect) {
                                    const rect = props.clientRect();
                                    if (rect && mentionAnchorRef.current) {
                                        mentionAnchorRef.current.style.top = `${rect.top}px`;
                                        mentionAnchorRef.current.style.left = `0px`;
                                    }
                                }
                            },
                            onExit: () => {
                                setMentionPopoverOpened(false);
                                setMentionItems([]);
                            },
                        }
                    },
                },
            }),
        ],
        content: taskDescription,
        editable: canEditDescription,
        onUpdate: ({ editor }) => {
            setTaskDescription(editor.getHTML());
        },
    });

    const formatSerialNumber = (number) => {
        if (number !== null && number !== undefined) {
            return number.toString().padStart(4, '0');
        }
        return '';
    };

    return (
        <Fragment>
            <div className="drawer" ref={drawerRef}>

                <div className="mt-2">
                    <LoadingOverlay
                        visible={visible}
                        zIndex={1000}
                        overlayProps={{ radius: 'sm', blur: 5 }}
                    />

                    <div className={`drawer-head flex w-full items-center mb-4 ${appLocalizer?.is_admin ? 'mt-8' : ''}`}>

                        <div className="w-[80%]">
                            {!isCompleted && (hasPermission(loggedInUser && loggedInUser.llc_permissions, ['edit-task']) || (task && task.createdBy_id == loggedInUser?.loggedUserId)) ?
                                <ContentEditable
                                    innerRef={contentEditableRef}
                                    onChange={(e) => setTaskName(e.target.value)}
                                    onBlur={handlerBlur} // Handle changes
                                    onFocus={handleFocusSubtask}
                                    html={taskName}
                                    className="inline-block w-full text-[#4d4d4d] font-bold text-[16px] !min-h-[36px]"
                                />
                                :
                                <Text size="sm" className="text-[#000000] font-semibold text-[14px] px-0 !outline-none pr-1">{taskName}</Text>
                            }
                        </div>
                        <div className="dh-btn flex w-[20%]">
                            <div className="flex w-full gap-3 items-center justify-center">

                                <CloseButton onClick={handleDrawerClose} size={`lg`} icon={translate("Update")} className={`!ml-2 !h-[36px] !border-0 !w-[70px] !bg-[#ED7D31] !text-white`} />

                                {task && (
                                        task.parent === null ? (
                                            <TaskActionsMenu
                                                actions={['complete', 'changeSection', 'archive', 'delete', 'changeVisibility', 'duplicateTask', 'ganttTask']}
                                                isDrawer
                                                taskData={task}
                                            />
                                        ) : (
                                            <TaskActionsMenu
                                                actions={['convert', 'subtask-complete', 'ganttTask', 'delete']}
                                                isSubtask
                                                isDrawer
                                                taskData={task}
                                            />
                                        )
                                    )}

                            </div>
                        </div>
                    </div>
                    <ScrollArea className="h-[calc(100vh-95px)]" scrollbarSize={4}>
                        <div className="tasks-body flex flex-col gap-4 relative w-full">
                            {taskObj && taskObj.parent == null && (
                                <div className="flex items-center" style={{ position: 'relative', zIndex: 8 }}>
                                    <div className="w-1/4">
                                        <Text fw={700} fz={14} c="#202020">{translate('Ref.#')}</Text>
                                    </div>
                                    <div className={`relative w-3/4`}>
                                        <Pill className="!bg-[#EBF1F4] !color-[#4d4d4d] !px-2 text-base">{formatSerialNumber(task.task_serial_no)}</Pill>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center" style={{ position: 'relative', zIndex: 7 }}>
                                <div className="w-1/4">
                                    <Text fw={700} fz={14} c="#202020">{translate('Created By')}</Text>
                                </div>
                                <div className={`relative w-3/4`}>
                                    <Text fw={400} fz={14} c="#202020">{task.createdBy_name}</Text>
                                </div>
                            </div>
                            <div className="flex items-center" style={{ position: 'relative', zIndex: 7 }}>
                                <div className="w-1/4">
                                    <Text fw={700} fz={14} c="#202020">{translate('Assigned')}</Text>
                                </div>
                                <div className={`relative`}>
                                    <TaskAssignTo taskId={task.id} assigned={task.assigned_to} assignedMember={(props) => {
                                        console.log('')
                                    }} disabled={isCompleted} />
                                </div>
                            </div>
                            <div className="flex items-center" style={{ position: 'relative', zIndex: 6 }}>
                                <div className="w-1/4">
                                    <Text fw={700} fz={14} c="#202020">{translate('Following')}</Text>
                                </div>
                                <div className={`relative`}>
                                    <TaskFollower taskId={task.id} followers={task.members} editHandler={(props) => {
                                        console.log('')
                                    }} disabled={isCompleted} />
                                </div>
                            </div>
                            <div className="flex items-center" style={{ position: 'relative', zIndex: 5 }}>
                                <div className="w-1/4">
                                    <Text fw={700} fz={14} c="#202020">
                                        {task.start_date && task.start_date_is_visible ? translate('Date') : translate('Due Date')}
                                    </Text>
                                </div>
                                <TaskDueDate taskId={task.id} startDate={task.start_date} dueDate={task.end_date} startDateIsVisible={task.start_date_is_visible}
                                    dueDateIsVisible={task.end_date_is_visible} isDrawer={true}
                                    disabled={isCompleted}
                                />
                            </div>
                            <div className="flex items-center" style={{ position: 'relative', zIndex: 4 }}>
                                <div className="w-1/4">
                                    <Text fw={700} fz={14} c="#202020">{translate('Priority')}</Text>
                                </div>
                                <TaskPriority taskId={task.id} priority={task.priority} disabled={isCompleted} />
                            </div>
                            <div className="flex items-center" style={{ position: 'relative', zIndex: 3 }}>
                                <div className="w-1/4">
                                    <Text fw={700} fz={14} c="#202020">{translate('Status')}</Text>
                                </div>
                                <TaskStatus taskId={task.id} status={task.internal_status} disabled={isCompleted} />
                            </div>

                            <div className="flex items-center" style={{ position: 'relative', zIndex: 2 }}>
                                <div className="w-1/4">
                                    <Text fw={700} fz={14} c="#202020">{translate('Tags')}</Text>
                                </div>
                                <div className={`relative`}>
                                    <TaskTag taskId={task.id} taskTags={task.tags} disabled={isCompleted} />
                                </div>
                            </div>
                            <div className="flex" style={{ position: 'relative', zIndex: 1 }}>

                                <LoadingOverlay visible={uploading} overlayProps={{ radius: "sm", blur: 2 }} />

                                <div className="w-1/4">
                                    <Text fw={700} fz={14} c="#202020">{translate('Attachments')}</Text>
                                </div>

                                <div className='flex flex-wrap gap-3 w-3/4'>
                                    {attachments && attachments.length > 0 && attachments.map((attachment, index) => (
                                        <div key={index}
                                            className='bg-[#EBF1F4] rounded-[20px] px-2 py-1 flex gap-2 items-center'>
                                            <IconFile size={14} />
                                            <a href={attachment.file_path} target='_blank' rel="noopener noreferrer" download
                                                style={{ textDecoration: "underline" }}
                                            >
                                                <Text size="xs" lineClamp={1} fw={300} fz={14} c="#202020">{attachment.name}</Text>
                                            </a>
                                            {(
                                                hasPermission(loggedInUser && loggedInUser.llc_permissions, ['delete-attachments']) ||
                                                (attachment && attachment.user_id == loggedInUser?.loggedUserId)
                                            ) && (
                                                    <ActionIcon onClick={() => handleAttachmentDelete(attachment.id)} variant="transparent" aria-label="Delete">
                                                        <IconTrash size={20} stroke={1} color="red" />
                                                    </ActionIcon>
                                                )}
                                        </div>
                                    ))}
                                    {!isCompleted && hasPermission(loggedInUser && loggedInUser.llc_permissions, ['add-attachments']) &&
                                        <div className="attachment w-[30px] h-[30px]">
                                            <FileInput
                                                multiple
                                                variant="unstyled"
                                                rightSection={icon}
                                                rightSectionPointerEvents="none"
                                                clearable
                                                onChange={handleFileUpload}
                                            />
                                        </div>
                                    }
                                </div>
                            </div>
                            {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['edit-task']) &&
                                <div className="flex items-center" style={{ position: 'relative', zIndex: 3 }}>
                                    <div className="w-1/4">
                                        <Text fw={700} fz={14} c="#202020">{translate('Display on gantt')}</Text>
                                    </div>

                                    <Switch
                                        color="orange"
                                        size="md"
                                        onLabel="ON"
                                        offLabel="OFF"
                                        checked={isVisibleGantt}
                                        onChange={(event) => {
                                            handleGanttIsVisible(event.currentTarget.checked)
                                        }}
                                        disabled={isCompleted}
                                    />

                                </div>
                            }
                            <div className="editor-container" style={{ maxHeight: '250px', overflowY: 'auto' }}>

                                <RichTextEditor editor={editor}>
                                    <RichTextEditor.Toolbar>
                                        <RichTextEditor.ControlsGroup>
                                            <RichTextEditor.Bold />
                                            <RichTextEditor.Italic />
                                            <RichTextEditor.Underline />
                                            <RichTextEditor.Strikethrough />
                                        </RichTextEditor.ControlsGroup>

                                        <RichTextEditor.ControlsGroup>
                                            <RichTextEditor.H1 />
                                            <RichTextEditor.H2 />
                                            <RichTextEditor.H3 />
                                            <RichTextEditor.H4 />
                                            <RichTextEditor.H5 />
                                        </RichTextEditor.ControlsGroup>

                                        <RichTextEditor.ControlsGroup>
                                            <RichTextEditor.AlignLeft />
                                            <RichTextEditor.AlignRight />
                                            <RichTextEditor.AlignCenter />
                                            <RichTextEditor.AlignJustify />
                                        </RichTextEditor.ControlsGroup>

                                        <RichTextEditor.ControlsGroup>
                                            <RichTextEditor.BulletList />
                                            <RichTextEditor.OrderedList />
                                        </RichTextEditor.ControlsGroup>
                                    </RichTextEditor.Toolbar>

                                    <RichTextEditor.Content
                                        className="prose prose-sm"
                                        spellCheck={false}
                                    />
                                </RichTextEditor>


                            </div>
                            <Popover
                                opened={mentionPopoverOpened}
                                trapFocus={false}
                                withinPortal={false}
                                width={300}
                                position="top-start"
                            >
                                <Popover.Target>
                                    <div
                                        ref={mentionAnchorRef}
                                        style={{
                                            position: "fixed",
                                            pointerEvents: "none"
                                        }}
                                    />
                                </Popover.Target>
                                <Popover.Dropdown>
                                    <ScrollArea.Autosize mah={250} scrollbarSize={4}>
                                        {mentionItems.map((item) => (
                                            <Flex
                                                key={item.id}
                                                align="center"
                                                px="sm"
                                                py="xs"
                                                style={{ cursor: 'pointer' }}
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    mentionCommand({ id: item.id, label: item.label });
                                                    setTimeout(() => {
                                                        editor?.commands.focus();
                                                    }, 0);
                                                    setMentionPopoverOpened(false);
                                                }}
                                            >
                                                <Avatar src={item.avatar} size={24} radius="xl" mr={8} />
                                                <Text>{item.label}</Text>
                                            </Flex>
                                        ))}
                                    </ScrollArea.Autosize>
                                </Popover.Dropdown>
                            </Popover>
                            {task && task.parent === null &&
                                <Accordion variant="contained"
                                    defaultValue="sub_tasks_accordion"
                                    classNames={{
                                        control: '',
                                        content: '!p-1 drawer-subtask',
                                        label: '!py-2',
                                        chevron: ''
                                        // chevron: classes.chevron
                                    }}
                                    styles={{
                                        panel: {
                                            padding: '12px 0',
                                            backgroundColor: '#F0F8FF',
                                        }
                                    }}
                                >
                                    <Accordion.Item value="sub_tasks_accordion">
                                        <Accordion.Control>
                                            <Pill className="!bg-[#ED7D31] !text-white !px-2">{subTask && subTask.length > 0 ? subTask.length : 0}</Pill> Subtasks
                                        </Accordion.Control>
                                        <Accordion.Panel>
                                            {subTask && subTask.length > 0 && subTask.map((subtask, index) => (
                                                <Grid onDoubleClickCapture={() => handlerTaskOpen(subtask)} key={index} columns={12} className="flex w-full single-task-content sub-task items-center gap-2 justify-between py-1 !pr-2.5"
                                                    style={{ backgroundColor: (subtask.status === 'COMPLETED' ? '#c9f7d6' : '') }}
                                                >
                                                    <Grid.Col span={9}>
                                                        <Box className='ml-5'>
                                                            <TaskName task={subtask && subtask} taskId={subtask && subtask.id} view='cardView' isSubtask nameOfTask={subtask && subtask.name ? subtask.name : "Untitled Subtask"}
                                                                disabled={subtask.status === 'COMPLETED'}
                                                            />
                                                        </Box>
                                                    </Grid.Col>
                                                    <Grid.Col span={3}>
                                                        <div className="flex items-center justify-end gap-2">
                                                            <TaskDueDate
                                                                taskId={subtask && subtask.id}
                                                                startDate={subtask && subtask.start_date ? subtask.start_date : null}
                                                                dueDate={subtask && subtask.end_date ? subtask.end_date : null}
                                                                startDateIsVisible={subtask && subtask.start_date_is_visible}
                                                                dueDateIsVisible={subtask && subtask.end_date_is_visible}
                                                                isSubtask={true}
                                                                isDrawer={true}
                                                                disabled={subtask.status === 'COMPLETED'}
                                                            />
                                                            <TaskAssignTo
                                                                taskId={subtask && subtask.id}
                                                                view='cardView'
                                                                assigned={subtask && subtask.assigned_to ? subtask.assigned_to : null}
                                                                assignedMember={(props) => {
                                                                    console.log('')
                                                                }}
                                                                disabled={subtask.status === 'COMPLETED'}
                                                            />

                                                        </div>
                                                    </Grid.Col>
                                                </Grid>
                                            ))}
                                            {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['add-subtask']) &&
                                                <button
                                                    className="rounded-md border border-dashed border-[#ED7D31] px-4 py-1 w-[95.5%] my-2 mx-4 bg-white justify-center flex items-center"
                                                    onClick={() => {
                                                        addSubtask();
                                                    }}
                                                >
                                                    <span className="text-sm font-bold text-[#ED7D31]">{translate('+ Add Subtask')}</span>
                                                </button>
                                            }
                                        </Accordion.Panel>
                                    </Accordion.Item>
                                </Accordion>
                            }

                            <div className="commentbox">
                                <div className="border border-solid border-[#e9e9e9] rounded-md bg-[#ebebeb] p-4">
                                    <div className="mb-4">
                                        {!commentDropdownOpened ? (
                                            <div className="cursor-pointer flex items-center gap-2 text-[#39758D]"
                                                onClick={toggle}>
                                                <Text fw={500} fz={14} c="#39758D">
                                                    {selectedValue ? selectedValue : 'Comments'}
                                                </Text>
                                                <IconChevronDown size={18} />
                                            </div>
                                        ) : null}

                                        {commentDropdownOpened && (
                                            <Select
                                                className="mantine-Select-root"
                                                variant="unstyled"
                                                placeholder="Comments"
                                                data={[translate('Only Comments'), translate('Only Activities'), translate('Comments & Activities'),]}
                                                style={{ width: '200px', color: '#f00' }}
                                                comboboxProps={{ transitionProps: { transition: 'pop', duration: 200 } }}
                                                dropdownOpened={commentDropdownOpened}
                                                onChange={handleSelect}
                                            />
                                        )}
                                    </div>
                                    {selectedValue === 'Only Comments' &&
                                        <TaskComment task={task} selectedValue={selectedValue} />
                                    }
                                    {selectedValue === 'Only Activities' &&
                                        <TaskActivity task={task} selectedValue={selectedValue} />
                                    }
                                    {selectedValue === 'Comments & Activities' &&
                                        <TaskCommentAndActivity task={task} selectedValue={selectedValue} />
                                    }
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                </div>

            </div>
        </Fragment>
    );
};


export default EditTaskDrawer;