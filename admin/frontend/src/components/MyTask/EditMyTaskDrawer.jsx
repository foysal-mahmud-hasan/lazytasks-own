import React, { useEffect, useRef, useState } from 'react';
import { useDisclosure } from '@mantine/hooks';
import {
    Drawer,
    Button,
    FileInput,
    rem,
    Textarea,
    Text,
    ScrollArea,
    Select,
    Anchor, Box, Popover, Flex, Avatar,
    LoadingOverlay, ActionIcon, useMantineTheme,
    Accordion,
    Pill,
    Grid
} from '@mantine/core';
import { IconCheck, IconChevronDown, IconFile, IconPaperclip, IconTrash, IconTrashX } from '@tabler/icons-react';
import ContentEditable from 'react-contenteditable';
import TaskAssignTo from './Task/TaskAssignTo';
import TaskFollower from './Task/TaskFollower';
import TaskDueDate from './Task/TaskDueDate';
import TaskPriority from './Task/TaskPriority';
import TaskTag from './Task/TaskTag';
import TaskComment from './Task/TaskComment';
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import TaskActivity from "./Task/TaskActivity";
import { useEditor, EditorContent } from '@tiptap/react';
import { Link, RichTextEditor } from '@mantine/tiptap';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import Mention from '@tiptap/extension-mention';
import TextAlign from '@tiptap/extension-text-align';
import {
    createMyTaskAttachment,
    deleteMyTaskAttachment,
    editMyTask,
    setEditableMyTask
} from "../Settings/store/myTaskSlice";
import { fetchTask, createTask } from "../Settings/store/taskSlice";
import { notifications } from "@mantine/notifications";
import TaskCommentAndActivity from "./Task/TaskCommentAndActivity";
import TaskStatus from './Task/TaskStatus';
import { translate } from '../../utils/i18n';
import TaskName from './Task/TaskName';
import TaskActionsMenu from './Task/TaskActionsMenu';
import { hasPermission } from '../ui/permissions';

const EditMyTaskDrawer = ({ taskObj, taskId, taskEditDrawerOpen, openTaskEditDrawer, closeTaskEditDrawer }) => {
    const dispatch = useDispatch();
    const theme = useMantineTheme();

    const { loggedUserId } = useSelector((state) => state.auth.user);
    const { loggedInUser } = useSelector((state) => state.auth.session);
    const { task } = useSelector((state) => state.settings.task);
    const [subTask, setSubTask] = useState(taskObj.children && taskObj.children.length > 0 ? taskObj.children : []);
    const [selectedValue, setSelectedValue] = useState('Comments & Activities');
    const rawMembers = taskObj && taskObj.project && taskObj.project.members;

    const [mentionPopoverOpened, setMentionPopoverOpened] = useState(false);
    const [popoverTarget, setPopoverTarget] = useState(null);
    const [mentionItems, setMentionItems] = useState([]);
    const [mentionCommand, setMentionCommand] = useState(() => () => { });
    const mentionAnchorRef = useRef(null);

    useEffect(() => {
        if (taskId) {
            dispatch(fetchTask({ id: taskId }))
        }
    }, [dispatch, taskId, selectedValue])

    const icon = <IconPaperclip style={{ width: rem(18), height: rem(18) }} stroke={1.5} />;

    const [taskName, setTaskName] = useState(task && task.name ? task.name : 'Untitled Task');
    const [taskDescription, setTaskDescription] = useState(task && task.description ? task.description : '');
    const contentEditableRef = useRef('');
    const [visible, setVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);


    const [attachments, setAttachments] = useState(task && task.attachments && task.attachments.length > 0 ? task.attachments : []);

    const handleDrawerClose = () => {
        handleTaskDescription(taskDescription);
        dispatch(setEditableMyTask(task));
    }

    const handleFileUpload = (files) => {
        const formData = new FormData();
        files.forEach((file, index) => {
            // formData.append(`attachments[${index}]`, file);
            formData.append(`attachments${index}`, file);
        });
        formData.append('task_id', task.id);
        formData.append('user_id', loggedUserId);
        dispatch(createMyTaskAttachment({ data: formData })).then((response) => {
            if (response.payload && response.payload.status === 200) {

                setAttachments(response.payload.data);

                notifications.show({
                    color: theme.primaryColor,
                    title: response.payload.message,
                    icon: <IconCheck />,
                    autoClose: 2000,
                });
            }
        });
    };


    const handleAttachmentDelete = (id) => {
        const deletedTaskAttachment = {
            task_id: task && task.id,
            deleted_by: loggedUserId
        }
        dispatch(deleteMyTaskAttachment({ id: id, data: deletedTaskAttachment })).then((response) => {
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
        if (taskEditDrawerOpen === true) {
            setVisible(true);
        }
        setAttachments(task.attachments && task.attachments.length > 0 ? task.attachments : [])
        setTimeout(() => {
            setVisible(false);
        }, 1000);
    }, [taskEditDrawerOpen]);

    const [commentDropdownOpened, { toggle }] = useDisclosure();

    const handleSelect = (value) => {
        setSelectedValue(value);
        toggle();
    };

    const handleTaskDescription = (description) => {
        // console.log(description);
        if (description && description !== '' && description !== task.description) {
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
                updated_by: loggedUserId
            }
            dispatch(editMyTask({ id: task.id, data: updatedTask }))
            setTaskDescription(description);
        }
    }

    const handlerBlur = () => {
        const taskEditableName = contentEditableRef.current.innerHTML;
        if (task && task.id && task.id !== 'undefined' && taskEditableName !== taskName) {
            dispatch(editMyTask({ id: task.id, data: { name: taskEditableName, 'updated_by': loggedUserId } }))
            setTaskName(taskEditableName);
        }
    };

    useEffect(() => {
        setTaskName(task && task.name ? task.name : 'Type task name here')
        setTaskDescription(task && task.description ? task.description : '')
        setAttachments(task.attachments && task.attachments.length > 0 ? task.attachments : [])
    }, [task]);

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

    const editor = useEditor({
        extensions: [
            StarterKit,
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
            Placeholder.configure({ placeholder: 'What is the task about...' }),
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
                        ),
                    render: () => {
                        return {
                            onStart: (props) => {
                                setMentionProps(props);
                                setMentionItems(props.items);
                                setMentionCommand(() => props.command);
                                setMentionPopoverOpened(true);
                            },
                            onUpdate: (props) => {
                                setMentionProps(props);
                                setMentionItems(props.items);
                                setMentionCommand(() => props.command);
                            },
                            onExit: () => {
                                setMentionProps(null);
                                setMentionPopoverOpened(false);
                                setPopoverTarget(null);
                                setMentionItems([]);
                            },
                        }
                    },
                },
            }),
        ],
        content: task?.description || '',
        onUpdate: ({ editor }) => {
            setTaskDescription(editor.getHTML());
        },
    });

    useEffect(() => {
        if (editor && task?.description) {
            editor.commands.setContent(task.description);
        }
    }, [editor, task?.description]);

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

    return (
        <>
            <div className="drawer">


                <div className="mt-2">

                    <LoadingOverlay
                        visible={visible}
                        zIndex={1000}
                        overlayProps={{ radius: 'sm', blur: 4 }}
                    />

                    <Drawer.Body>
                        <div className="drawer-head flex w-full items-center mb-4">
                            <div className="w-[80%]">
                                <ContentEditable
                                    innerRef={contentEditableRef}
                                    onChange={(e) => setTaskName(e.target.value)}
                                    onBlur={handlerBlur} // Handle changes
                                    html={taskName}
                                    className="inline-block w-full text-[#4d4d4d] font-bold text-[16px] !min-h-[36px]"
                                />
                            </div>
                            <div className="dh-btn flex w-[20%]">
                                <Drawer.CloseButton onClick={handleDrawerClose} size={`lg`} icon={translate('Update')} className={`!ml-2 !h-[36px] !border-0 !w-[70px] !bg-[#ED7D31] !text-white`} />

                                {/* {(
                                    hasPermission(loggedInUser?.llc_permissions, ['delete-task', 'archive-task', 'edit-task', 'delete-subtask']) ||
                                    (task && task.createdBy_id === loggedInUser?.loggedUserId)
                                ) && task && (
                                        task.parent === null ? (
                                            <TaskActionsMenu
                                                actions={['complete', 'changeSection', 'archive', 'delete', 'changeVisibility', 'duplicateTask']}
                                                isDrawer
                                                taskData={task}
                                            />
                                        ) : (
                                            <TaskActionsMenu
                                                actions={['convert', 'delete']}
                                                isSubtask
                                                isDrawer
                                                taskData={task}
                                            />
                                        )
                                    )} */}

                            </div>
                        </div>
                        <ScrollArea className="h-[calc(100vh-95px)]" scrollbarSize={4}>
                            <div className="tasks-body flex flex-col gap-4 relative">
                                <div className="flex z-[104]">
                                    <div className="w-1/4">
                                        <Text fw={700} fz={14} c="#202020">{translate('Created By')}</Text>
                                    </div>
                                    <div className={`relative w-3/4`}>
                                        <Text fw={400} fz={14} c="#202020">{task.createdBy_name}</Text>
                                    </div>
                                </div>
                                <div className="flex z-[104]">
                                    <div className="w-1/4">
                                        <Text fw={700} fz={14} c="#202020">{translate('Assigned')}</Text>
                                    </div>
                                    <TaskAssignTo task={task} assigned={task.assigned_to} />
                                </div>
                                <div className="flex z-[103]">
                                    <div className="w-1/4">
                                        <Text fw={700} fz={14} c="#202020">{translate('Following')}</Text>
                                    </div>
                                    <TaskFollower task={task} followers={task.members} />
                                </div>
                                <div className="flex z-[102]">
                                    <div className="w-1/4">
                                        <Text fw={700} fz={14} c="#202020">{translate('Due Date')}</Text>
                                    </div>
                                    <TaskDueDate taskId={task.id} dueDate={task.end_date} />
                                </div>
                                <div className="flex z-[101]">
                                    <div className="w-1/4">
                                        <Text fw={700} fz={14} c="#202020">{translate('Priority')}</Text>
                                    </div>
                                    {/* <div className="border border-solid border-grey rounded-md"> */}
                                    <TaskPriority task={task} priority={task.priority} />
                                    {/* </div> */}
                                </div>
                                <div className="flex items-center z-[100]">
                                    <div className="w-1/4">
                                        <Text fw={700} fz={14} c="#202020">{translate('Status')}</Text>
                                    </div>
                                    <TaskStatus task={task} status={task.internal_status} />
                                </div>
                                <div className="flex z-[99]">
                                    <div className="w-1/4">
                                        <Text fw={700} fz={14} c="#202020">{translate('Tags')}</Text>
                                    </div>
                                    <TaskTag task={task} taskTags={task.tags} />
                                </div>
                                <div className="flex z-[98]">
                                    <div className="w-1/4">
                                        <Text fw={700} fz={14} c="#202020">{translate('Attachments')}</Text>
                                    </div>
                                    <div className='flex flex-wrap gap-3 w-3/4'>
                                        {attachments && attachments.length > 0 && attachments.map((attachment, index) => (
                                            <div key={index} className='bg-[#EBF1F4] rounded-[20px] px-2 py-1 flex gap-2 items-center'>
                                                <IconFile size={14} />

                                                <Anchor href={attachment.file_path} download underline="not-hover">
                                                    <Text size="xs" lineClamp={1} fw={300} fz={14} c="#202020">{attachment.name}</Text>
                                                </Anchor>

                                                <ActionIcon onClick={() => handleAttachmentDelete(attachment.id)} variant="transparent" aria-label="Delete">
                                                    <IconTrash size={20} stroke={1} color="red" />
                                                </ActionIcon>

                                            </div>
                                        ))}
                                        <div className="attachment w-[35px]">
                                            <FileInput
                                                multiple
                                                variant="unstyled"
                                                rightSection={icon}
                                                rightSectionPointerEvents="none"
                                                clearable
                                                onChange={handleFileUpload}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="z-0" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                    <RichTextEditor editor={editor} >
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
                                                <RichTextEditor.AlignLeft />
                                                <RichTextEditor.AlignRight />
                                                <RichTextEditor.AlignCenter />
                                                <RichTextEditor.AlignJustify />
                                                <RichTextEditor.BulletList />
                                                <RichTextEditor.OrderedList />
                                            </RichTextEditor.ControlsGroup>
                                        </RichTextEditor.Toolbar>

                                        <RichTextEditor.Content
                                            className="prose prose-sm"
                                            spellCheck={false}
                                        />
                                    </RichTextEditor>
                                    <div ref={mentionAnchorRef} />

                                </div>
                                {/* <Popover
                                    opened={mentionPopoverOpened}
                                    trapFocus={false}
                                    withinPortal={false}
                                    width={200}
                                    position="bottom-start"
                                >
                                    <Popover.Target>
                                        <div ref={mentionAnchorRef} />
                                    </Popover.Target>
                                    <Popover.Dropdown>

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

                                    </Popover.Dropdown>
                                </Popover> */}
                                {mentionProps && mentionProps.clientRect && ReactDOM.createPortal(
                                    <Box
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}
                                        style={{
                                            position: 'absolute',
                                            top: mentionProps.clientRect().bottom + window.scrollY,
                                            left: mentionProps.clientRect().left + window.scrollX,
                                            background: 'white',
                                            border: '1px solid #ddd',
                                            borderRadius: 4,
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                            zIndex: 9999,
                                        }}
                                    >
                                        {mentionProps.items.map(item => (
                                            <Flex
                                                key={item.id}
                                                align="center"
                                                px="sm"
                                                py="xs"
                                                style={{ cursor: 'pointer' }}
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    mentionProps.command({ id: item.id, label: item.label });
                                                    setTimeout(() => {
                                                        editor?.commands.focus();
                                                    }, 0);
                                                }}
                                            >
                                                <Avatar src={item.avatar} size={24} radius="xl" mr={8} />
                                                <Text>{item.label}</Text>
                                            </Flex>
                                        ))}
                                    </Box>,
                                    document.body
                                )}
                                <div className="flex">
                                    <button className="mt-1">
                                        {/*<span className="text-sm font-medium text-[#ED7D31]">+ Add sub task</span>*/}
                                    </button>
                                </div>

                                {taskObj && taskObj.parent === null &&
                                    <Accordion variant="contained"
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
                                                    <Grid onDoubleClickCapture={() => handlerTaskOpen(subtask)} key={index} columns={12} className="flex w-full single-task-content sub-task items-center gap-2 justify-between py-1 !pr-2.5">
                                                        <Grid.Col span={9}>
                                                            <Box className='ml-5'>
                                                                <TaskName task={subtask && subtask} taskId={subtask && subtask.id} view='cardView' isSubtask nameOfTask={subtask && subtask.name ? subtask.name : "Untitled Subtask"} />
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
                                                                />
                                                                <TaskAssignTo
                                                                    taskId={subtask && subtask.id}
                                                                    task={subtask && subtask}
                                                                    view='cardView'
                                                                    assigned={subtask && subtask.assigned_to ? subtask.assigned_to : null}
                                                                    assignedMember={(props) => {
                                                                        console.log('')
                                                                    }} />

                                                            </div>
                                                        </Grid.Col>
                                                    </Grid>
                                                ))}
                                                {/* {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['add-subtask']) &&
                                                    <button
                                                        className="rounded-md border border-dashed border-[#ED7D31] px-4 py-1 w-[95.5%] my-2 mx-4 bg-white justify-center flex items-center"
                                                        onClick={() => {
                                                            addSubtask();
                                                        }}
                                                    >
                                                        <span className="text-sm font-bold text-[#ED7D31]">{translate('+ Add Subtask')}</span>
                                                    </button>
                                                } */}
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
                    </Drawer.Body>
                </div>
            </div>
        </>
    );
};


export default EditMyTaskDrawer;