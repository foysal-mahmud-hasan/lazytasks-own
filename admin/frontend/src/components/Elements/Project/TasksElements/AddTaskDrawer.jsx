import React, { useEffect, useRef, useState } from 'react';
import { useDisclosure } from '@mantine/hooks';
import {
    FileInput,
    rem,
    Text,
    Flex,
    ScrollArea,
    useMantineTheme,
    Box,
    TextInput, Avatar, Switch, CloseButton,
    ActionIcon
} from '@mantine/core';
import { IconCheck, IconFile, IconPaperclip, IconPlus, IconTrash } from '@tabler/icons-react';
import ContentEditable from 'react-contenteditable';
import TaskAssignTo from './Task/TaskAssignTo';
import TaskFollower from './Task/TaskFollower';
import TaskDueDate from './Task/TaskDueDate';
import TaskPriority from './Task/TaskPriority';
import TaskStatus from './Task/TaskStatus';
import TaskTag from './Task/TaskTag';
// import TaskComment from './TaskComment';
import { useDispatch, useSelector } from "react-redux";
import { useEditor, EditorContent } from '@tiptap/react';
import { Link, RichTextEditor } from '@mantine/tiptap';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import Mention from '@tiptap/extension-mention';
import TextAlign from '@tiptap/extension-text-align';
import {
    createTask,
    deleteAttachment,
    editTask,
    removeSuccessMessage,
    uploadAttachments, wpDeleteAttachment, closeAddTaskDrawer
} from "../../../Settings/store/taskSlice";
import { hasPermission } from "../../../ui/permissions";
import DueDate from "./Task/DueDate";
import dayjs from "dayjs";
import Priority from "./Task/Priority";
import Status from './Task/Status';
import TaskTagForTaskAdd from "./Task/TaskTagForTaskAdd";
import { showNotification, updateNotification, notifications } from "@mantine/notifications";
import { translate } from '../../../../utils/i18n';

const AddTaskDrawer = ({ view, projectId, projectInfo, taskSectionId, addTaskDrawerOpen }) => {

    const dispatch = useDispatch();
    const theme = useMantineTheme();
    const { loggedUserId } = useSelector((state) => state.auth.user)
    const { loggedInUser } = useSelector((state) => state.auth.session)

    const icon = <IconPaperclip style={{ width: rem(18), height: rem(18) }} stroke={1.5} />;
    const [taskCreateDrawerOpen, { open: openTaskCreateDrawer, close: closeTaskCreateDrawer }] = useDisclosure(false);

    const [taskName, setTaskName] = useState('Type task name here');
    const [taskDescription, setTaskDescription] = useState('');
    const [selectedMember, setSelectedMember] = useState(null);
    const [selectedFollower, setSelectedFollower] = useState(null);
    const [selectedPriority, setSelectedPriority] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState(null);
    const [selectedTags, setSelectedTags] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [selectedStartDate, setSelectedStartDate] = useState(null);
    const [selectedDueDate, setSelectedDueDate] = useState(null);
    const [startDateIsVisible, setStartDateIsVisible] = useState(false);
    const [dueDateIsVisible, setDueDateIsVisible] = useState(true);
    const [uploading, setUploading] = useState(false);


    const [attachments, setAttachments] = useState([]);

    const handleAssignButtonClick = (member) => {
        setSelectedMember(member);
    }

    const handleAssignFollower = (members) => {
        setSelectedFollower(members);
    }
    const handleDueDateSelect = (dateData) => {
        if (!dateData) {
            setSelectedStartDate(null);
            setSelectedDueDate(null);
            setStartDateIsVisible(false);
            setDueDateIsVisible(false);
            return;
        }

        const { dates, visibility } = dateData;

        if (Array.isArray(dates)) {
            const [start, end] = dates;
            setSelectedStartDate(start ? dayjs(start).format('YYYY-MM-DD') : null);
            setSelectedDueDate(end ? dayjs(end).format('YYYY-MM-DD') : null);
        }

        setStartDateIsVisible(visibility.startDateIsVisible);
        setDueDateIsVisible(visibility.dueDateIsVisible);
    };

    const handlePriority = (priority) => {
        setSelectedPriority(priority);
    }

    const handleStatus = (status) => {
        setSelectedStatus(status);
    }

    const handleTag = (tag) => {
        setSelectedTags(tag);
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
            formData.append(`attachments${index}`, file);
        });
        formData.append('user_id', loggedInUser ? loggedInUser.loggedUserId : loggedUserId);
        dispatch(uploadAttachments({ data: formData })).then((response) => {
            setUploading(false);
            if (response.payload.status === 200) {
                setAttachments(response.payload.data);
            }

        });

    };
    const handleAttachmentDelete = (id) => {
        setUploading(true);
        dispatch(wpDeleteAttachment({ id: id })).then((response) => {
            setUploading(false);
            if (response.payload.status === 200) {
                setAttachments(attachments.filter(attachment => attachment.id !== id));
                notifications.show({
                    color: theme.primaryColor,
                    title: response.payload.message,
                    icon: <IconCheck />,
                    autoClose: 5000,
                    // withCloseButton: true,
                });
                const timer = setTimeout(() => {
                    dispatch(removeSuccessMessage());
                }, 5000); // Clear notification after 3 seconds

                return () => clearTimeout(timer);
            }
        });
    }

    // useEffect(() => {
    //     if (addTaskDrawerOpen === false) {
    //         // setShowMembersList(workspaceCreateModalOpen);
    //         handleTaskCreation();
    //         setTaskName('Type task name here');
    //         setAttachments([]);
    //     }
    // }, [addTaskDrawerOpen]);

    const handleTaskCreation = () => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = taskDescription;

        // Find all mention elements
        const mentions = tempDiv.querySelectorAll('.mention');
        const mentionedUsers = Array.from(mentions).map(mention => ({
            id: mention.getAttribute('data-id'),
            name: mention.getAttribute('data-label')
        }));



        const newTaskData = {
            name: taskName,
            project_id: projectId,
            task_section_id: taskSectionId,
            created_by: loggedInUser ? loggedInUser.loggedUserId : loggedUserId,
            assigned_to: selectedMember,
            members: selectedFollower,
            start_date: selectedStartDate,
            end_date: selectedDueDate,
            start_date_is_visible: startDateIsVisible,
            end_date_is_visible: dueDateIsVisible,
            priority: selectedPriority,
            internal_status: selectedStatus,
            type: 'task',
            description: taskDescription,
            mention_users: mentionedUsers,
            tags: selectedTags,
            status: 'ACTIVE',
            attachments: attachments,
            is_visible: isVisible,
        };
        if (newTaskData.name !== '' && newTaskData.name !== 'Type task name here') {
            showNotification({
                id: 'load-data',
                loading: true,
                title: 'Task',
                message: "Creating New Task...",
                disallowClose: true,
                color: 'green',
            });
            dispatch(createTask(newTaskData)).then((response) => {
                if (response.payload.status === 200) {
                    setTaskName('Type task name here');
                    setTaskDescription('');
                    editor?.commands.clearContent();
                    setSelectedMember(null)
                    setSelectedTags(null)
                    setSelectedPriority(null)
                    setSelectedStatus(null)
                    setSelectedDueDate(null)
                    setSelectedFollower(null)
                    setAttachments([]);
                    setIsVisible(true);

                    dispatch(closeAddTaskDrawer());

                    updateNotification({
                        id: 'load-data',
                        loading: true,
                        title: 'Task',
                        message: response.payload.message || 'Task created successfully',
                        autoClose: 4000,
                        disallowClose: true,
                        color: 'green',
                    });

                    // notifications.show({
                    //     color: theme.primaryColor,
                    //     title: response.payload.message || 'Task created successfully',
                    //     icon: <IconCheck />,
                    //     autoClose: 5000,
                    // });
                    // const timer = setTimeout(() => {
                    //     dispatch(removeSuccessMessage());
                    // }, 5000); // Clear notification after 3 seconds

                    // return () => clearTimeout(timer);

                }
            });
        }else{
            showNotification({
                title: 'Task',
                message: "Task name cannot be empty",
                autoClose: 4000,
                color: 'red',
            });
        }
    };
    const handleDrawerClose = () => {
        handleTaskCreation();
        dispatch(closeAddTaskDrawer());
    }

    const [mentionProps, setMentionProps] = useState(null);
    const membersRef = useRef([]);
    const rawMembers = projectInfo && projectInfo.members;
    useEffect(() => {
        if (rawMembers && rawMembers.length) {
            membersRef.current = rawMembers.map(user => ({
                id: user.id,
                label: user.name,
                avatar: user.avatar,
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
                            onStart: props => setMentionProps(props),
                            onUpdate: props => setMentionProps(props),
                            onExit: () => setMentionProps(null),
                        }
                    },
                },
            }),
        ],
        content: taskDescription,
        onUpdate: ({ editor }) => {
            setTaskDescription(editor.getHTML());
        },
    });

    return (
        <>
            <Box bg={'yellow'} h={'500px'}>
                <Box mt={'xs'} p={'xs'} >
                    <div className="drawer-head flex gap-3 mb-4 w-full items-center">
                        <div className="w-[85%]">
                            <TextInput
                                className="focus:border-black-600"
                                // defaultValue={taskName}
                                placeholder={translate('Type task name here')}
                                onChange={(e) => setTaskName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        handleTaskCreation();
                                    }
                                }}
                            />

                        </div>
                        <div className="dh-btn flex w-[15%]">

                            <CloseButton onClick={handleDrawerClose} size={`lg`} icon={translate('Create')} className={`!ml-2 !h-[36px] !border-0 !w-[70px] !bg-[#ED7D31] !text-white`} />

                        </div>
                    </div>
                    <ScrollArea className="h-[calc(100vh-90px)]" scrollbarSize={4}>
                        <div className="tasks-body flex flex-col gap-4 relative">
                            <div className="flex items-center" style={{ position: 'relative', zIndex: 7 }}>
                                <div className="w-1/4">
                                    <Text fw={700} fz={14} c="#202020">{translate('Assigned')}</Text>
                                </div>
                                <div className={`relative`}>
                                    <TaskAssignTo assignedMember={(props) => {
                                        handleAssignButtonClick(props);
                                    }} />
                                </div>
                            </div>
                            <div className="flex items-center" style={{ position: 'relative', zIndex: 6 }}>
                                <div className="w-1/4">
                                    <Text fw={700} fz={14} c="#202020">{translate('Following')}</Text>
                                </div>
                                <div className={`relative`}>
                                    <TaskFollower editHandler={(props) => {
                                        handleAssignFollower(props);
                                    }} />
                                </div>
                            </div>
                            <div className="flex items-center" style={{ position: 'relative', zIndex: 5 }}>
                                <div className="w-1/4">
                                    <Text fw={700} fz={14} c="#202020">{translate('Due Date')}</Text>
                                </div>
                                <DueDate editHandler={(props) => {
                                    handleDueDateSelect(props)
                                }} dueDate={selectedDueDate}
                                    startDate={selectedStartDate}
                                    startDateIsVisible={startDateIsVisible}
                                    dueDateIsVisible={dueDateIsVisible}
                                />
                            </div>
                            <div className="flex items-center" style={{ position: 'relative', zIndex: 4 }}>
                                <div className="w-1/4">
                                    <Text fw={700} fz={14} c="#202020">{translate('Priority')}</Text>
                                </div>
                                {/* <div className="border border-solid border-grey rounded-md"> */}
                                <Priority editPriorityHandler={(props) => {
                                    console.log(props)
                                    handlePriority(props)
                                }} />
                                {/* </div> */}
                            </div>
                            <div className="flex items-center" style={{ position: 'relative', zIndex: 3 }}>
                                <div className="w-1/4">
                                    <Text fw={700} fz={14} c="#202020">{translate('Status')}</Text>
                                </div>

                                <Status editStatusHandler={(props) => {
                                    console.log(props)
                                    handleStatus(props)
                                }} />

                            </div>


                            <div className="flex items-center" style={{ position: 'relative', zIndex: 2 }}>
                                <div className="w-1/4">
                                    <Text fw={700} fz={14} c="#202020">{translate('Tags')}</Text>
                                </div>
                                <TaskTagForTaskAdd onChangeSelectedItem={(value) => {
                                    handleTag(value)
                                }} />
                            </div>
                            <div className="flex" style={{ position: 'relative', zIndex: 2 }}>
                                <div className="w-1/4">
                                    <Text fw={700} fz={14} c="#202020">{translate('Attachments')}</Text>
                                </div>
                                <div className='flex flex-wrap gap-3 w-3/4'>
                                    {attachments.map((attachment, index) => (
                                        <div key={index} className='bg-[#EBF1F4] rounded-[20px] px-2 py-1 flex gap-2 items-center'>
                                            <IconFile size={14} />
                                            <Text fw={400} fz={14} c="#202020">{attachment.name}</Text>

                                            <ActionIcon onClick={() => handleAttachmentDelete(attachment.id)} variant="transparent" aria-label="Delete">
                                                <IconTrash size={20} stroke={1} color="red" />
                                            </ActionIcon>

                                        </div>
                                    ))}
                                    {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['add-attachments']) &&
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

                            <div className="flex items-center" style={{ position: 'relative', zIndex: 1 }}>
                                <div className="w-1/4">
                                    <Text fw={700} fz={14} c="#202020">{translate('Display on gantt')}</Text>
                                </div>

                                <Switch
                                    color="orange"
                                    size="md"
                                    onLabel={translate('ON')}
                                    offLabel={translate('OFF')}
                                    checked={isVisible}
                                    onChange={(event) => {
                                        setIsVisible(event.currentTarget.checked)
                                        console.log(event.currentTarget.checked)
                                    }}
                                />

                            </div>
                            <div className="z-0" style={{ maxHeight: '250px', overflowY: 'auto' }}>
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
                            </div>
                            <div className="flex">
                                <button className="mt-1">
                                    {/*<span className="text-sm font-medium text-[#ED7D31]">+ Add subtask</span>*/}
                                </button>
                            </div>

                            {/*<div className="commentbox">
                    <TaskComment />
                </div>*/}
                        </div>
                    </ScrollArea>
                </Box>
            </Box>
        </>
    );
};


export default AddTaskDrawer;