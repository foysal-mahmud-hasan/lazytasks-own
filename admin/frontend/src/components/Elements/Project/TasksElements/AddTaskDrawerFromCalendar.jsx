import React, { useEffect, useState } from 'react';
import {
    Drawer,
    FileInput,
    rem,
    Textarea,
    Text,
    ScrollArea,
    useMantineTheme,
    Switch,
    TextInput, Select
} from '@mantine/core';
import { IconCheck, IconFile, IconPaperclip } from '@tabler/icons-react';
// import TaskComment from './TaskComment';
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import { notifications } from "@mantine/notifications";
import { createTask, removeSuccessMessage } from "../../../Settings/store/taskSlice";
import { useParams } from "react-router-dom";
import { fetchProjectPriorities, fetchProjectTaskSections } from "../../../Settings/store/projectSlice";
import TaskAssignTo from "./Task/TaskAssignTo";
import TaskFollower from "./Task/TaskFollower";
import DueDate from "./Task/DueDate";
import Priority from "./Task/Priority";
import TaskTagForTaskAdd from "./Task/TaskTagForTaskAdd";
import Status from './Task/Status';


const AddTaskDrawerFromCalendar = ({ startDate, endDate, project, taskAddDrawerOpen, openTaskAddDrawer, closeTaskAddDrawer }) => {


    const dispatch = useDispatch();
    const theme = useMantineTheme();
    const { loggedUserId } = useSelector((state) => state.auth.user)
    const { loggedInUser } = useSelector((state) => state.auth.session)
    const { success } = useSelector((state) => state.settings.task);

    const icon = <IconPaperclip style={{ width: rem(18), height: rem(18) }} stroke={1.5} />;

    const projectId = useParams().id;

    const [taskSectionId, setTaskSectionId] = useState(null);
    const [taskName, setTaskName] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [selectedMember, setSelectedMember] = useState(null);
    const [selectedFollower, setSelectedFollower] = useState(null);
    const [selectedDueDate, setSelectedDueDate] = useState(startDate);
    const [selectedPriority, setSelectedPriority] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState(null);
    const [selectedTags, setSelectedTags] = useState(null);
    const [isVisible, setIsVisible] = useState(false);


    const [attachments, setAttachments] = useState([]);

    const handleAssignButtonClick = (member) => {
        setSelectedMember(member);
    }

    const handleAssignFollower = (members) => {
        setSelectedFollower(members);
    }
    const handleDueDateSelect = (date) => {
        if (date) {
            var formatedDate = dayjs(date).format('YYYY-MM-DD');
            setSelectedDueDate(formatedDate)
        }
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
        if (taskAddDrawerOpen === false) {
            handleTaskCreation();
        }
    }, [taskAddDrawerOpen]);

    useEffect(() => {
        setSelectedDueDate(startDate);
    },
        [startDate]);



    const handleTaskCreation = () => {
        const newTaskData = {
            name: taskName,
            project_id: projectId,
            task_section_id: taskSectionId,
            created_by: loggedInUser ? loggedInUser.loggedUserId : loggedUserId,
            assigned_to: selectedMember,
            members: selectedFollower,
            start_date: selectedDueDate,
            end_date: selectedDueDate,
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

    const { projectSections } = useSelector((state) => state.settings.project);

    useEffect(() => {
        if (projectId) {
            dispatch(fetchProjectTaskSections(projectId))
        }
    }, [projectId]);

    const onSectionChange = (e) => {
        if (e && e.value && e.value !== '') {
            setTaskSectionId(e.value);
        } else {
            setTaskSectionId(null);
        }
    };


    return (
        <>
            {taskAddDrawerOpen &&
                <div className="drawer">

                    <Drawer
                        opened={taskAddDrawerOpen}
                        onClose={() => {
                            closeTaskAddDrawer();
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
                                            // defaultValue={taskName}
                                            placeholder="Type task name here"
                                            onChange={(e) => setTaskName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    handleTaskCreation();
                                                    setTaskName('Type task name here');
                                                    closeTaskAddDrawer();
                                                }
                                            }}
                                        />

                                    </div>
                                    <div className="dh-btn flex w-[15%]">
                                        {/*<div className="attachment w-[35px] mt-[-3px]">
                                        <FileInput
                                            multiple
                                            variant="unstyled"
                                            rightSection={icon}
                                            rightSectionPointerEvents="none"
                                            clearable
                                            onChange={handleFileUpload}
                                        />
                                    </div>*/}
                                        <Drawer.CloseButton size={`lg`} icon={"Create"} className={`!ml-2 !h-[36px] !border-0 !w-[70px] !bg-[#ED7D31] !text-white`} />

                                    </div>
                                </div>
                                <ScrollArea className="h-[calc(100vh-130px)]" scrollbarSize={4}>
                                    <div className="tasks-body flex flex-col gap-4 relative">


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
                                        <div className="flex z-[104] relative">
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
                                            }} dueDate={selectedDueDate} />
                                        </div>
                                        <div className="flex z-[101]">
                                            <div className="w-1/3">
                                                <Text fw={400} fz={14} c="#202020">Priority</Text>
                                            </div>
                                            <div className="">
                                                <Priority editPriorityHandler={(props) => {
                                                    handlePriority(props)
                                                }}
                                                    projectPriorities={project && project.projectPriorities && project.projectPriorities.length > 0 ? project.projectPriorities : []} />
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
                                                    projectStatuses={project && project.projectStatuses && project.projectStatuses.length > 0 ? project.projectStatuses : []} />
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
                                        <div className="flex items-center z-[97]">
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

                                        </div>
                                        <div className="flex z-0">
                                            <Textarea
                                                labelProps={{ style: { fontWeight: 'bold' } }}
                                                label="Description"
                                                description=""
                                                style={{ width: '100%' }}
                                                autosize
                                                minRows={4}
                                                placeholder="What is the task about"
                                                onChange={(e) => setTaskDescription(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex">
                                            <button className="mt-1">
                                                <span className="text-sm font-medium text-[#ED7D31]">+ Add sub task</span>
                                            </button>
                                        </div>

                                        {/*<div className="commentbox">
                            <TaskComment />
                        </div>*/}
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


export default AddTaskDrawerFromCalendar;