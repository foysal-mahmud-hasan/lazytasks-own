import React, { Fragment, useEffect, useState } from 'react';
import TaskName from './TaskName';
import TaskAssignTo from './TaskAssignTo';
import TaskFollower from './TaskFollower';
import TaskDueDate from './TaskDueDate';
import TaskPriority from './TaskPriority';
import TaskStatus from './TaskStatus';
import TaskTag from './TaskTag';
import { IconSubtask, IconGripVertical } from '@tabler/icons-react';
import { useSelector, useDispatch } from 'react-redux';
import { hasPermission } from "../../../../ui/permissions";
import {
    Box,
    Grid,
    Tooltip,
    Avatar
} from "@mantine/core";
import AddTaskPopover from "../AddTaskPopover";
import { openTaskEditDrawer, setEditableTask } from "../../../../Settings/store/taskSlice";
import TaskSerial from './TaskSerial';
import TaskActionsMenu from './TaskActionsMenu';
import { translate } from '../../../../../utils/i18n';

const MainTask = ({ addSubtask, taskData, view }) => {
    const dispatch = useDispatch();
    const { loggedInUser } = useSelector((state) => state.auth.session)
    const { childColumns } = useSelector((state) => state.settings.task);
    const { inputFieldIsFocused } = useSelector((state) => state.base.common);

    const [task, setTask] = useState(taskData);
    const [isShown, setIsShown] = useState(false);
    const [isFocused, setIsFocused] = useState(inputFieldIsFocused || false);

    useEffect(() => { setTask(taskData); }, [taskData]);

    const handleEditTaskDrawerOpen = () => {
        dispatch(openTaskEditDrawer());
        dispatch(setEditableTask(task && task));
    };

    const [selectedAccordion, setSelectedAccordion] = useState('');
    const toggleSection = (section) => {
        setSelectedAccordion(section);
    };

    const handleFocus = () => {
        setIsFocused(true);
    };

    const handleBlur = () => {
        setIsFocused(false);
        // dispatch(updateInputFieldFocus(false));
    };

    return (
        <>
            {view === 'cardView' ? (

                <Fragment>
                    <div className="flex single-task-content main-task flex-col gap-3">
                        <Box onClick={() => { handleEditTaskDrawerOpen() }} component="div">
                            <div className="flex items-center justify-between mb-4 w-full">
                                <div className="task-name w-full">
                                    <TaskName task={task && task} taskId={task.id} nameOfTask={task.name} view='cardView' />
                                </div>
                                <Box component="div" onClick={(e) => e.stopPropagation()}>
                                    {/* {(
                                        hasPermission(loggedInUser && loggedInUser.llc_permissions, ['delete-task', 'archive-task', 'edit-task', 'duplicate-task'])
                                        || (taskData && taskData.createdBy_id === loggedInUser?.loggedUserId)
                                    ) && (

                                            <TaskActionsMenu actions={['view', 'complete', 'changeSection', 'archive', 'delete', 'changeVisibility', 'duplicateTask', 'ganttTask']} taskData={taskData} />
                                        )} */}
                                    <TaskActionsMenu actions={['view', 'complete', 'changeSection', 'archive', 'delete', 'changeVisibility', 'duplicateTask', 'ganttTask']} taskData={taskData} />
                                </Box>

                            </div>
                            <div className="flex items-center justify-start mb-3 gap-3">
                                <div className="assign-to" onClick={(e) => e.stopPropagation()}>
                                    <TaskAssignTo taskId={task.id} assigned={task.assigned_to} view='cardView'
                                        assignedMember={(props) => {
                                            console.log('')
                                        }} />
                                </div>
                                <div className="due-date" onClick={(e) => e.stopPropagation()}>
                                    <TaskDueDate taskId={task.id} startDate={task.start_date} dueDate={task.end_date} startDateIsVisible={task.start_date_is_visible} dueDateIsVisible={task.end_date_is_visible} />
                                </div>
                                {/* 2. All fields missing */}
                                {!task.end_date && !task.priority && !task.internal_status && (
                                    <>
                                        <div className="priority" onClick={(e) => e.stopPropagation()}>
                                            <TaskPriority taskId={task.id} priority={task.priority} />
                                        </div>
                                        <div className="status" onClick={(e) => e.stopPropagation()}>
                                            <TaskStatus taskId={task.id} status={task.internal_status} />
                                        </div>
                                    </>
                                )}

                                {/* 3. Only priority or status exists, but no end_date */}
                                {!task.end_date && (task.priority || task.internal_status) && (
                                    <>
                                        <div className="priority" onClick={(e) => e.stopPropagation()}>
                                            <TaskPriority taskId={task.id} priority={task.priority} />
                                        </div>
                                        <div className="status" onClick={(e) => e.stopPropagation()}>
                                            <TaskStatus taskId={task.id} status={task.internal_status} />
                                        </div>
                                    </>
                                )}
                                {/* 4. Only date exists, but no priority or status */}
                                {task.end_date && !task.priority && !task.internal_status && (
                                    <>
                                        <div className="priority" onClick={(e) => e.stopPropagation()}>
                                            <TaskPriority taskId={task.id} priority={task.priority} />
                                        </div>
                                        <div className="status" onClick={(e) => e.stopPropagation()}>
                                            <TaskStatus taskId={task.id} status={task.internal_status} />
                                        </div>
                                    </>
                                )}
                            </div>
                            {/* 1. All fields exist */}
                            {task.end_date && task.priority && task.internal_status && (
                                <div className="flex items-center justify-start mb-3 gap-3">
                                    <div className="priority" onClick={(e) => e.stopPropagation()}>
                                        <TaskPriority taskId={task.id} priority={task.priority} />
                                    </div>
                                    <div className="status" onClick={(e) => e.stopPropagation()}>
                                        <TaskStatus taskId={task.id} status={task.internal_status} />
                                    </div>
                                </div>
                            )}
                            {/* 5. Only priority or status exists with end_date (and not all three) */}
                            {task.end_date &&
                                (task.priority || task.internal_status) &&
                                !(task.priority && task.internal_status) && (
                                    <div className="flex items-center justify-start mb-3 gap-3">
                                        <div className="priority" onClick={(e) => e.stopPropagation()}>
                                            <TaskPriority taskId={task.id} priority={task.priority} />
                                        </div>
                                        <div className="status" onClick={(e) => e.stopPropagation()}>
                                            <TaskStatus taskId={task.id} status={task.internal_status} />
                                        </div>
                                    </div>
                                )}

                            <div className="tags mb-3" onClick={(e) => e.stopPropagation()}>
                                <TaskTag taskId={task.id} taskTags={task.tags} />
                            </div>
                            <div className="flex w-full items-center mb-0">
                                <div className="w-full following flex gap-1" onClick={(e) => e.stopPropagation()}>
                                    <TaskFollower taskId={task.id} followers={task.members} editHandler={(props) => {
                                        console.log('')
                                    }} />
                                </div>
                                <div className="flex justify-between items-center gap-2">
                                    {
                                        childColumns && childColumns[task.slug] && childColumns[task.slug].length > 0 &&
                                        <Tooltip withinPortal={false} label={translate('View Subtask')} position="top" withArrow>
                                            <Avatar
                                                className={`cursor-pointer`}
                                                onClick={() => handleEditTaskDrawerOpen()}
                                                size={`sm`}
                                                bg="#ED7D31"
                                                color="#fff"
                                            >
                                                <IconSubtask className=' hover:scale-110' size={18} />
                                            </Avatar>
                                            {/* <Pill size="lg" className="!bg-transparent !text-[#ED7D31] !px-0 !ml-1 mt-[2px] cursor-pointer">{ childColumns[task.slug].length }</Pill> */}
                                        </Tooltip>
                                    }
                                    <Box component="div" onClick={(e) => e.stopPropagation()}>
                                        {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['add-subtask']) &&
                                            <AddTaskPopover projectId={task && task.project_id}
                                                taskSectionId={task && task.task_section_id} isSubtask={true} parent={task} />
                                        }
                                    </Box>
                                </div>

                            </div>
                        </Box>
                    </div>

                </Fragment>

            ) : (
                <div onClick={() => {
                    handleEditTaskDrawerOpen()
                }} className="single-task-content main-task w-full"
                    onFocus={handleFocus} onBlur={handleBlur}
                    onMouseEnter={() => {
                        setIsShown(true)
                    }}
                    onMouseLeave={() => {
                        setIsShown(false)
                    }}
                >

                    <Grid columns={24}>
                        {task && task.is_serial_enable && (
                            <Grid.Col className={`flex items-center w-full !py-0`} span={1.5}>
                                <div className="!min-w-[20px] w-[20px] pl-[5px]">

                                    {(isShown || isFocused) &&
                                        <Fragment>
                                            <IconGripVertical size={20} stroke={1.25} />
                                        </Fragment>
                                    }

                                </div>
                                <div
                                    className="w-full"
                                    style={{ marginLeft: '-15px' }}
                                >
                                    <TaskSerial task={task && task} taskId={task.id} />
                                </div>
                            </Grid.Col>
                        )}
                        <Grid.Col className={`flex items-center w-full !py-0`} span={7}>
                            <div
                                className="w-full" style={{ marginLeft: task && task.is_serial_enable ? '-35px' : '6px' }}
                            >
                                <TaskName task={task && task} taskId={task.id} nameOfTask={task.name} />
                            </div>
                        </Grid.Col>
                        <Grid.Col className={`assign-to flex items-center w-full !py-0`} span={2.5}>
                            <div className={`pl-1 ml-[-14px]`} onClick={(e) => e.stopPropagation()}>
                                <TaskAssignTo taskId={task.id} assigned={task.assigned_to} assignedMember={(props) => {
                                    console.log('')
                                }} />
                            </div>
                        </Grid.Col>
                        <Grid.Col className={`following flex items-center justify-center !py-0`} span={2.5}>
                            <div onClick={(e) => e.stopPropagation()} >
                                <TaskFollower taskId={task.id} followers={task.members} editHandler={(props) => {
                                    console.log('')
                                }} />
                            </div>
                        </Grid.Col>
                        <Grid.Col className={`due-date flex items-center w-full !py-0`} span={2}>
                            <div className={`w-full`} onClick={(e) => e.stopPropagation()} >
                                <div className={`w-full flex items-start justify-center`}>
                                    <TaskDueDate taskId={task.id} startDate={task.start_date} dueDate={task.end_date} startDateIsVisible={task.start_date_is_visible} dueDateIsVisible={task.end_date_is_visible} />
                                </div>
                            </div>
                        </Grid.Col>
                        <Grid.Col className={`priority flex items-center w-full !py-0`} span={2}>
                            <div className="pl-1 w-full flex justify-center" onClick={(e) => e.stopPropagation()}>
                                <TaskPriority taskId={task.id} priority={task.priority} />
                            </div>
                        </Grid.Col>
                        <Grid.Col className={`priority flex items-center w-full !py-0`} span={2}>
                            <div className="pl-1 w-full flex justify-center" onClick={(e) => e.stopPropagation()}>
                                <TaskStatus taskId={task.id} status={task.internal_status} />
                            </div>
                        </Grid.Col>
                        {task && task.is_serial_enable ? (
                            <Grid.Col className={`tags flex items-center w-full !py-0 !pl-10`} span={4.5}>
                                <div className={`w-full flex items-center`} onClick={(e) => e.stopPropagation()}>
                                    <TaskTag taskId={task.id} taskTags={task.tags} />
                                </div>
                            </Grid.Col>
                        ) : (
                            <Grid.Col className={`tags flex items-center w-full !py-0 !pl-10`} span={5.5}>
                                <div className={`w-full flex items-center`} onClick={(e) => e.stopPropagation()}>
                                    <TaskTag taskId={task.id} taskTags={task.tags} />
                                </div>
                            </Grid.Col>
                        )}

                    </Grid>

                </div>
            )}

        </>


    );
};

export default MainTask;
