import React, { useEffect, useRef, useState } from 'react';
import {
    Drawer,
    FileInput,
    rem,
    Text,
    ScrollArea,
    useMantineTheme,
    Tooltip,
    TextInput, Select,
    Box,
    Flex,
    Avatar
} from '@mantine/core';
import { IconCheck, IconFile, IconPaperclip } from '@tabler/icons-react';
// import TaskComment from './TaskComment';
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import { notifications } from "@mantine/notifications";
import { createTask, removeSuccessMessage } from "../Settings/store/taskSlice";

import DueDate from "../Elements/Project/TasksElements/Task/DueDate";
import TaskTagForTaskAdd from "../Elements/Project/TasksElements/Task/TaskTagForTaskAdd";
import { fetchAllCompanies, fetchCompany } from "../Settings/store/companySlice";
import {
    emptyProjectSection,
    fetchAllProjects,
    fetchProjectPriorities,
    fetchProjectStatuses,
    fetchProjectTaskSections
} from "../Settings/store/projectSlice";
import { fetchAllMembers } from "../../store/auth/userSlice";
import TaskAssignTo from "./TaskAssignTo";
import Priority from "./Priority";
import Status from "./Status";
import TaskFollower from "./TaskFollower";
import { deleteQuickTask } from "../Settings/store/quickTaskSlice";
import { useEditor, EditorContent } from '@tiptap/react';
import { Link, RichTextEditor } from '@mantine/tiptap';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import Mention from '@tiptap/extension-mention';
import TextAlign from '@tiptap/extension-text-align';
import { translate } from '../../utils/i18n';

const AddTaskFromQuickTaskDrawer = ({ task, taskEditDrawerOpen, openTaskEditDrawer, closeTaskEditDrawer }) => {
    const dispatch = useDispatch();
    const theme = useMantineTheme();
    const { loggedUserId } = useSelector((state) => state.auth.user)
    const { success } = useSelector((state) => state.settings.task);

    const icon = <IconPaperclip style={{ width: rem(18), height: rem(18) }} stroke={1.5} />;

    const [projectID, setProjectID] = useState(null);
    const [taskSectionId, setTaskSectionId] = useState(null);
    const [taskName, setTaskName] = useState(task && task.name ? task.name : 'Type task name here');
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


    const [attachments, setAttachments] = useState([]);

    const handleAssignButtonClick = (member) => {
        setSelectedMember(member);
    }

    const handleAssignFollower = (members) => {
        setSelectedFollower(members);
    }
    // const handleDueDateSelect = (date) => {
    //     if(date){
    //         var formatedDate = dayjs(date).format('YYYY-MM-DD');
    //         setSelectedDueDate(formatedDate)
    //     }
    // };

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
        setAttachments(Array.from(files)); // Convert files to an array
        console.log('Attachments:', attachments); // Check updated state
    };

    useEffect(() => {
        if (taskEditDrawerOpen === false) {
            handleTaskCreation();
        }
    }, [taskEditDrawerOpen]);



    const handleTaskCreation = () => {
        const newTaskData = {
            name: taskName,
            project_id: projectID,
            task_section_id: taskSectionId,
            created_by: loggedUserId,
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
            tags: selectedTags,
            status: 'ACTIVE',
            is_visible: isVisible,
        };
        if (
            newTaskData.name !== ''
            && newTaskData.name !== 'Type task name here'
            && newTaskData.project_id
            && newTaskData.task_section_id
        ) {
            dispatch(createTask(newTaskData));

            dispatch(deleteQuickTask(task.id));
            setTaskName('Type task name here');
            setTaskDescription('');
            setIsVisible(true);
            // setCurrentMemberData([]);

            if (success) {
                notifications.show({
                    color: theme.primaryColor,
                    title: success,
                    icon: <IconCheck />,
                    autoClose: 5000,
                    // withCloseButton: true,
                });
                const timer = setTimeout(() => {
                    dispatch(removeSuccessMessage());
                }, 5000); // Clear notification after 3 seconds

                return () => clearTimeout(timer);
            }
        }
    };

    const { companies, company } = useSelector((state) => state.settings.company);
    const { projectSections, projectPriorities, projectStatuses } = useSelector((state) => state.settings.project);
    var projects = [];
    var members = [];

    useEffect(() => {
        dispatch(fetchAllCompanies());
        // dispatch(fetchAllProjects());
    }, []);
    const [selectedCompanyId, setSelectedCompanyId] = useState(null);

    const onCompanyChange = (e) => {
        if (e && e.value && e.value !== '') {
            dispatch(fetchCompany(e.value));
            setSelectedCompanyId(e.value);
        } else {
            setSelectedCompanyId(null);
        }
    };

    if (company?.projects?.length > 0) {
        projects = company.projects || [];
    }
    var [project, setProject] = useState(null);
    const onProjectChange = (e) => {
        if (e && e.value && e.value !== '') {
            dispatch(fetchProjectPriorities(e.value))
            dispatch(fetchProjectStatuses(e.value))
            dispatch(fetchProjectTaskSections(e.value))
            //find project from projects by id
            setProject(projects.filter(project => parseInt(project.id) === parseInt(e.value))[0]);
            setProjectID(e.value);
        } else {
            setProject(null);
            setProjectID(null);
            dispatch(emptyProjectSection());
        }
    };
    const onSectionChange = (e) => {
        if (e && e.value && e.value !== '') {
            setTaskSectionId(e.value);
        } else {
            setTaskSectionId(null);
        }
    };

    const [mentionProps, setMentionProps] = useState(null);
    const membersRef = useRef([]);
    const rawMembers = project && project.members;
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
                        ),
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
            {taskEditDrawerOpen &&
                <div className="drawer">

                    <Drawer
                        opened={taskEditDrawerOpen}
                        onClose={() => {
                            closeTaskEditDrawer();
                        }}
                        position="right"
                        withCloseButton={false} size="lg" closeOnClickOutside={true}
                        overlayProps={{ backgroundOpacity: 0, blur: 0 }}
                    >
                        <div className="mt-4">

                            <Drawer.Body className="!px-1">
                                <div className="drawer-head flex mb-4 w-full items-center">
                                    <div className="w-[85%]">
                                        <TextInput
                                            className="focus:border-black-600"
                                            defaultValue={taskName}
                                            onChange={(e) => setTaskName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    handleTaskCreation();
                                                    setTaskName('Type task name here');
                                                    closeTaskEditDrawer();
                                                }
                                            }}
                                        />

                                    </div>
                                    <div className="dh-btn flex w-[15%]">
                                        {/* <div className="attachment w-[35px] mt-[-3px]">
                                        <FileInput
                                            multiple
                                            variant="unstyled"
                                            rightSection={icon}
                                            rightSectionPointerEvents="none"
                                            clearable
                                            onChange={handleFileUpload}
                                        />
                                    </div> */}
                                        <Tooltip label={'Convert to Task'} position={appLocalizer?.is_admin ? `bottom` : `top`} withArrow withinPortal={false}>
                                            <Drawer.CloseButton size={`lg`} icon={"Convert"} className={`!ml-2 !h-[36px] !border-0 !w-[70px] !bg-[#ED7D31] !text-white`} />
                                        </Tooltip>

                                    </div>
                                </div>
                                <ScrollArea className="h-[calc(100vh-130px)]" scrollbarSize={4}>
                                    <div className="tasks-body flex flex-col gap-4 relative">
                                        <div className="flex z-[104]">
                                            <div className="w-1/3">
                                                <Text fw={400} fz={14} c="#202020">Workspace</Text>
                                            </div>
                                            <Select
                                                searchable
                                                clearable
                                                size="sm"
                                                placeholder="Select Workspace"
                                                data={companies && companies.length > 0 && companies.map((company) => ({
                                                    value: company.id,
                                                    label: company.name
                                                }))}
                                                // defaultValue="React"
                                                allowDeselect
                                                onChange={(e, option) => {
                                                    console.log(e)
                                                    onCompanyChange(option);
                                                }}
                                            />
                                        </div>
                                        <div className="flex z-[104]">
                                            <div className="w-1/3">
                                                <Text fw={400} fz={14} c="#202020">Project</Text>
                                            </div>
                                            <Select
                                                searchable
                                                clearable
                                                size="sm"
                                                placeholder="Select Project"
                                                data={selectedCompanyId && projects && projects.length > 0 && projects.map((project) => ({
                                                    value: project.id,
                                                    label: project.name
                                                }))}
                                                // defaultValue="React"
                                                allowDeselect
                                                onChange={(e, option) => {
                                                    onProjectChange(option);
                                                }}
                                            />
                                        </div>
                                        <div className="flex z-[104]">
                                            <div className="w-1/3">
                                                <Text fw={400} fz={14} c="#202020">Section</Text>
                                            </div>
                                            <Select
                                                searchable
                                                clearable
                                                size="sm"
                                                placeholder="Select Section"
                                                data={projectSections && projectSections.length > 0 && projectSections.map((section) => ({
                                                    value: section.id,
                                                    label: section.name
                                                }))}
                                                // defaultValue="React"
                                                allowDeselect
                                                onChange={(e, option) => {
                                                    onSectionChange(option);
                                                }}
                                            />
                                        </div>
                                        <div className="flex z-[104]">
                                            <div className="w-1/3">
                                                <Text fw={400} fz={14} c="#202020">Assigned</Text>
                                            </div>
                                            <div className={`relative`}>
                                                <TaskAssignTo
                                                    boardMembers={project && project.members && project.members.length > 0 ? project.members : []}
                                                    assignedMember={(props) => {
                                                        handleAssignButtonClick(props);
                                                    }} />
                                            </div>
                                        </div>
                                        <div className="flex z-[103]">
                                            <div className="w-1/3">
                                                <Text fw={400} fz={14} c="#202020">Following</Text>
                                            </div>
                                            <div className={`relative`}>
                                                <TaskFollower
                                                    boardMembers={project && project.members && project.members.length > 0 ? project.members : []}
                                                    editHandler={(props) => {
                                                        handleAssignFollower(props);
                                                    }} />
                                            </div>
                                        </div>
                                        <div className="flex z-[102]">
                                            <div className="w-1/3">
                                                <Text fw={400} fz={14} c="#202020">Due Date</Text>
                                            </div>
                                            <DueDate editHandler={(props) => {
                                                handleDueDateSelect(props)
                                            }} dueDate={selectedDueDate}
                                                startDate={selectedStartDate}
                                                startDateIsVisible={startDateIsVisible}
                                                dueDateIsVisible={dueDateIsVisible}
                                            />
                                        </div>
                                        <div className="flex z-[101]">
                                            <div className="w-1/3">
                                                <Text fw={400} fz={14} c="#202020">Priority</Text>
                                            </div>
                                            <div className="">
                                                <Priority editPriorityHandler={(props) => {
                                                    handlePriority(props)
                                                }}
                                                    projectPriorities={projectPriorities && projectPriorities.length > 0 ? projectPriorities : []} />
                                            </div>
                                        </div>
                                        <div className="flex z-[100]">
                                            <div className="w-1/3">
                                                <Text fw={400} fz={14} c="#202020">Status</Text>
                                            </div>
                                            <div className="">
                                                <Status editStatusHandler={(props) => {
                                                    handleStatus(props)
                                                }}
                                                    projectStatuses={projectStatuses && projectStatuses.length > 0 ? projectStatuses : []} />
                                            </div>
                                        </div>
                                        <div className="flex z-[99]">
                                            <div className="w-1/3">
                                                <Text fw={400} fz={14} c="#202020">Tags</Text>
                                            </div>
                                            <TaskTagForTaskAdd onChangeSelectedItem={(value) => {
                                                handleTag(value)
                                            }} />
                                        </div>
                                        <div className="flex z-[98]">
                                            <div className="w-1/3">
                                                <Text fw={400} fz={14} c="#202020">Attachments</Text>
                                            </div>
                                            <div className='flex flex-wrap gap-3'>
                                                {attachments.map((attachment, index) => (
                                                    <div key={index}
                                                        className='bg-[#EBF1F4] rounded-[20px] px-2 py-1 flex gap-2 items-center'>
                                                        <IconFile size={14} /><Text fw={400} fz={14}
                                                            c="#202020">{attachment.name}</Text>
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
                                        {/* <div className="flex items-center z-[97]">
                                        <div className="w-1/3">
                                            <Text fw={400} fz={14} c="#202020">Display on gantt</Text>
                                        </div>
    
                                        <Switch
                                            color="orange"
                                            size="md"
                                            onLabel="ON"
                                            offLabel="OFF"
                                            checked={isVisible}
                                            onChange={(event) => {
                                                setIsVisible(event.currentTarget.checked)
                                                console.log(event.currentTarget.checked)
                                            }}
                                        />
    
                                    </div> */}
                                        <div className="flex z-0">
                                            {/* <Textarea
                                            label="Description"
                                            description=""
                                            style={{width: '100%'}}
                                            autosize
                                            minRows={4}
                                            placeholder="What is the task about"
                                            onChange={(e) => setTaskDescription(e.target.value)}
                                        /> */}
                                            <RichTextEditor editor={editor} style={{ width: '100%' }}>
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

                                    </div>
                                </ScrollArea>
                            </Drawer.Body>
                        </div>

                    </Drawer>
                </div>
            }
        </>
    );
};


export default AddTaskFromQuickTaskDrawer;