import React, { Fragment, useEffect, useState } from 'react';
import { ReactSortable } from 'react-sortablejs';
import SubtaskContent from './SubtaskContent';
import MainTask from './MainTask';
import { useSelector, useDispatch } from 'react-redux';
import { createTask, deleteTask, archiveTask, completeTask } from "../../../../Settings/store/taskSlice";
import { Draggable, Droppable } from "react-beautiful-dnd";
import { Accordion, Button, Flex, Pill, Text, Title, Tooltip, Popover, List, Box } from "@mantine/core";
import { hasPermission } from "../../../../ui/permissions";
import { IconChevronDown, IconPlus, IconTrash, IconDotsVertical, IconArchiveFilled, IconEye, IconCircleCheck } from "@tabler/icons-react";
import EditTaskDrawer from "../EditTaskDrawer";
import { modals } from "@mantine/modals";
import TaskDelete from "./TaskDelete";
import ChangeTaskSection from "./ChangeTaskSection";
import { updateInputFieldFocus } from "../../../../../store/base/commonSlice";
import MyZenButton from "./MyZenButton";
import { useDisclosure } from "@mantine/hooks";
import { showNotification } from "@mantine/notifications";
import TaskActionsMenu from './TaskActionsMenu';
import { translate } from '../../../../../utils/i18n';

const TaskContent = ({ view, taskData }) => {

    const dispatch = useDispatch();
    const { childColumns } = useSelector((state) => state.settings.task);
    const [task, setTask] = useState(taskData);
    const [opened, setOpened] = useState(false);

    useEffect(() => {
        setTask(taskData);
    }, [taskData]);

    const [subtasks, setSubtasks] = useState(childColumns && childColumns[taskData.slug] && childColumns[taskData.slug].length ? [...Array(childColumns[taskData.slug].length).keys()] : []);
    const { loggedUserId } = useSelector((state) => state.auth.user)
    const { loggedInUser } = useSelector((state) => state.auth.session)


    useEffect(() => {
        setTask(taskData);
    }, [taskData]);

    const addSubtask = () => {
        setSubtasks([...subtasks, subtasks.length]);

        //check if childColumns && childColumns[taskData.slug] name is 'Type task name here' using some
        if (childColumns && childColumns[taskData.slug] && childColumns[taskData.slug].some(subtask => subtask.name === 'Type task name here')) {
            // /how to get the index of the first element that matches the condition
            const index = childColumns[taskData.slug].findIndex(subtask => subtask.name === 'Type task name here');
            //index element tag editable
            const subtask = childColumns[taskData.slug][index];

            //check if subtask is not undefined
            if (subtask !== undefined) {
                //focus on the subtask
                const subtaskElement = document.querySelector(`[data-id="${subtask.id}"]`);
                if (subtaskElement) {
                    subtaskElement.focus();
                }
            }

            return false;
        }

        const newTaskData = {
            name: 'Type task name here',
            parent: taskData,
            task_section_id: taskData.task_section_id,
            project_id: taskData.project_id,
            type: 'sub-task',
            created_by: loggedInUser ? loggedInUser.loggedUserId : loggedUserId,
            status: 'ACTIVE',
            'is_visible': taskData.ganttIsVisible == 1 ? 1 : 0,
        }
        dispatch(createTask(newTaskData));
        dispatch(updateInputFieldFocus(true));
    };
    const onSortEnd = (sortedList) => {
        setSubtasks(sortedList);
    };

    const [selectedAccordion, setSelectedAccordion] = useState('');
    const toggleSection = (section) => {
        setSelectedAccordion(section);
    };

    const ArrowBadge = ({ number, isOpen }) => (
        <Box
            pos="relative"
            py={6}
            bg="#ED7D31"
            c="white"
            style={{
                clipPath:
                    "polygon(0 0, 100% 0, 100% calc(100% - 10px), 50% 100%, 0 calc(100% - 10px))",
                borderRadius: "4px",
                minWidth: "21px",
                marginLeft: isOpen ? "-7px" : "0",
                transition: "margin-left 0.3s ease",
                textAlign: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <Text fw={500} ta={"center"}
                style={{
                    fontSize: '11px', rotate: isOpen ? '180deg' : '0', transition: 'transform 0.3s ease',
                    paddingTop: isOpen ? '2px' : '0'
                }}
            >
                {number}
            </Text>
        </Box>
    );


    return (
        <Fragment>
            {view === 'cardView' ? (
                <div className="full-project-tasks flex-col shadow-md p-3 rounded-md border border-1 border-[#efefef] gap-3">
                    <MainTask view='cardView' addSubtask={addSubtask} taskData={task} />
                </div>
            ) : (
                <div className="full-project-tasks">
                    <Accordion
                        value={selectedAccordion}
                        onChange={setSelectedAccordion}
                        chevronPosition="left"
                        // chevron={<IconChevronDown size={30} stroke={2} />}
                        chevron={
                            childColumns && childColumns[taskData.slug] && childColumns[taskData.slug].length > 0
                            && <ArrowBadge number={childColumns[taskData.slug].length}
                                isOpen={selectedAccordion === taskData.slug}
                            />
                        }
                        classNames={{
                            control: '!p-0 !w-auto',
                            content: '!pl-[30px] !pr-0 !pb-2',
                            label: '!py-0 !pt-1',
                            chevron: '!mx-0 !ml-1',
                            // chevron: classes.chevron
                        }}
                        styles={{
                            content: {
                                backgroundColor: '#F0F8FF',
                                borderRadius: '10px',
                                marginLeft: '10px',
                                marginRight: '10px',
                                marginBottom: '10px'
                            },
                            panel: {
                                backgroundColor: '#F0F8FF',
                                borderRadius: '10px',
                                marginLeft: '10px',
                                marginRight: '10px',
                                // marginBottom: '10px'
                            }
                        }}
                    >
                        <Accordion.Item value={taskData && taskData.slug}>
                            <div className="flex w-full items-center py-1">
                                <div className={`min-w-[19px] min-h-[30px]`}>
                                    {childColumns && childColumns[taskData.slug] && childColumns[taskData.slug].length > 0 &&
                                        <Accordion.Control>

                                        </Accordion.Control>
                                    }
                                </div>
                                <div className="flex w-full items-center">
                                    {/*<Pill className="!bg-[#ED7D31] !text-white !px-2">{childColumns && childColumns[taskData.slug] && childColumns[taskData.slug].length > 0 ? childColumns[taskData.slug].length : 0 }</Pill>*/}
                                    <MainTask addSubtask={addSubtask} taskData={task} />
                                </div>
                                <div className="flex items-center justify-end min-w-28">
                                    {/*{ loggedInUser && loggedUserId === parseInt(taskData.assignedTo_id) &&
                                  <MyZenButton task={taskData} taskId={taskData && taskData.id} />
                              }*/}


                                    {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['add-subtask']) &&
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <Tooltip withinPortal={false} label={translate('Add Subtask')} position="top" withArrow>
                                                <div
                                                    className="h-[24px] w-[24px] border border-solid border-[#E9E9E9] rounded-full p-[3px] create-subtask"
                                                    onClick={() => {
                                                        toggleSection(taskData.slug);
                                                        addSubtask();
                                                    }}>
                                                    <IconPlus color="#4d4d4d" size="16" className="cursor-pointer" />
                                                </div>
                                            </Tooltip>
                                        </div>
                                    }
                                    {/* {(
                                        hasPermission(loggedInUser && loggedInUser.llc_permissions, ['delete-task', 'archive-task', 'edit-task', 'duplicate-task'])
                                        || (taskData && taskData.createdBy_id === loggedInUser?.loggedUserId)
                                    ) && (
                                            <div className="flex items-center cursor-pointer">
                                                <TaskActionsMenu actions={['view', 'complete', 'changeSection', 'archive', 'delete', 'changeVisibility', 'duplicateTask', 'ganttTask']} taskData={taskData} />
                                            </div>
                                        )} */}
                                    <TaskActionsMenu actions={['view', 'complete', 'changeSection', 'archive', 'delete', 'changeVisibility', 'duplicateTask', 'ganttTask']} taskData={taskData} />

                                </div>

                            </div>

                            {childColumns && childColumns[taskData.slug] && childColumns[taskData.slug].length > 0 &&
                                <Accordion.Panel>
                                    <Box bg="#F0F8FF" mr={6}>
                                        <Droppable
                                            key={taskData.id}
                                            droppableId={taskData.slug}
                                            type='SUBTASK'
                                        >
                                            {(dropProvided, snapshot) => (
                                                <div
                                                    style={{ transition: 'background-color 0.3s ease' }}
                                                    className={`w-full h-full min-h-[20px] mb-2 ${childColumns && childColumns[taskData.slug] && childColumns[taskData.slug].length > 0 ? 'py-1 bg-[#F0F8FF] rounded-lg' : ''}`}
                                                    ref={dropProvided.innerRef}
                                                    {...dropProvided.droppableProps}
                                                >
                                                    {childColumns && childColumns[taskData.slug] && childColumns[taskData.slug].length > 0 && childColumns[taskData.slug].map((subTask, subtaskIndex) => (
                                                        <Draggable
                                                            key={subTask.id}
                                                            draggableId={subTask.id.toString()}
                                                            index={subtaskIndex}
                                                            isDragDisabled={subTask.status === 'COMPLETED'}
                                                        >
                                                            {(dragProvided, dragSnapshot) => (
                                                                <div
                                                                    key={subtaskIndex}
                                                                    className='single-task'
                                                                    ref={dragProvided.innerRef}
                                                                    {...dragProvided.draggableProps}
                                                                    {...dragProvided.dragHandleProps}
                                                                    style={{
                                                                        ...dragProvided.draggableProps.style,
                                                                        backgroundColor: dragSnapshot.isDragging ? '#EBF1F4' : '#F0F8FF',
                                                                        transition: 'all 0.1s ease-in-out',
                                                                        cursor: dragSnapshot.isDragging ? 'grabbing' : 'grab',
                                                                        opacity: dragSnapshot.isDragging ? 0.9 : 1,
                                                                        transform: snapshot.isDragging
                                                                            ? `${dragProvided.draggableProps.style?.transform} rotate(-10deg) scale(1.10)`
                                                                            : dragProvided.draggableProps.style?.transform,
                                                                        boxShadow: snapshot.isDragging
                                                                            ? '0 6px 12px rgba(0, 0, 0, 0.15)'
                                                                            : 'none',
                                                                        userSelect: 'none',
                                                                        border: dragSnapshot.isDragging ? '1px solid #E5E5E5' : 'none',
                                                                    }}
                                                                >
                                                                    <SubtaskContent taskData={taskData} key={subtaskIndex}
                                                                        subtask={subTask} />

                                                                </div>
                                                            )}

                                                        </Draggable>
                                                    ))}

                                                    {dropProvided.placeholder}

                                                </div>
                                            )}

                                        </Droppable>

                                        {childColumns && childColumns[taskData.slug] && childColumns[taskData.slug].length > 0 && hasPermission(loggedInUser && loggedInUser.llc_permissions, ['add-subtask']) &&
                                            <div className="mx-4 pr-[11px]">
                                                <button
                                                    className="rounded-md border border-dashed border-[#ED7D31] bg-white px-4 mb-1 w-full justify-center flex items-center"
                                                    onClick={() => {
                                                        toggleSection(taskData.slug);
                                                        addSubtask();
                                                    }}
                                                >
                                                    <span className="text-lg font-semibold text-[#ED7D31]">{translate('+ Add Subtask')}</span>
                                                </button>
                                            </div>
                                        }
                                    </Box>
                                </Accordion.Panel>
                            }
                        </Accordion.Item>
                    </Accordion>

                </div>

            )}
        </Fragment>
    );
};

export default TaskContent;
