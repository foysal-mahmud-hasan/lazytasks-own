import React, { Fragment, useEffect } from 'react';
import TaskAssignTo from "./Task/TaskAssignTo";
import TaskFollower from "./Task/TaskFollower";
import TaskDueDate from "./Task/TaskDueDate";
import TaskPriority from "./Task/TaskPriority";
import TaskStatus from "./Task/TaskStatus";
import TaskTag from "./Task/TaskTag";

import { useDisclosure } from "@mantine/hooks";
import EditMyTaskDrawer from "./EditMyTaskDrawer";
import TaskName from "./Task/TaskName";
import TaskSerial from './Task/TaskSerial';
import { useSelector, useDispatch } from "react-redux";
import { Drawer } from '@mantine/core';


const MyTaskRow = ({ task, isSubtask }) => {
    const dispatch = useDispatch();
    const { serialSettings } = useSelector((state) => state.settings.setting);

    const [taskEditDrawerOpen, { open: openTaskEditDrawer, close: closeTaskEditDrawer }] = useDisclosure(false);
    const handleEditTaskDrawerOpen = (task) => {
        openTaskEditDrawer();
    };
    return (
        <Fragment>
            <div onClick={() => { handleEditTaskDrawerOpen(task) }} className="flex single-task-content main-task items-center w-full cursor-pointer">
                {serialSettings && serialSettings.enabled && (
                    <div className={`task-name pr-2 items-center w-[6%]`}>
                        <div className="flex gap-2 items-center w-full">
                            {task && task.is_serial_enable && isSubtask ? (
                                <div className="w-full">
                                    <TaskSerial task={task && task} taskId={task.id} isSubtask />
                                </div>
                            ):(
                                <div className="w-full">
                                    <TaskSerial task={task && task} taskId={task.id} />
                                </div>
                            )}
                        </div>
                    </div>
                )}
                <div className={`task-name pr-2 items-center ${task.parent ? 'w-[24%]' : 'w-[25%]'}`}>
                    <div className="flex gap-2 items-center w-full">
                        <div className="w-full">
                            <TaskName task={task && task} taskId={task.id} nameOfTask={task.name} />
                        </div>
                    </div>
                </div>
                <div className="assign-to w-[10%] pr-2">
                    <div onClick={(e) => e.stopPropagation()}>
                        <TaskAssignTo task={task} assigned={task.assigned_to} />
                    </div>
                </div>
                <div className="following w-[12%] items-center">
                    <div onClick={(e) => e.stopPropagation()}>
                        <TaskFollower task={task} followers={task.members} />
                    </div>
                </div>
                <div className="due-date w-[10%]">
                    <div onClick={(e) => e.stopPropagation()}>
                        <div className="w-full inline-flex items-center justify-center">
                            {/* <TaskDueDate taskId={task.id} dueDate={task.end_date}/> */}
                            <TaskDueDate taskId={task.id} startDate={task.start_date} dueDate={task.end_date} startDateIsVisible={task.start_date_is_visible} dueDateIsVisible={task.end_date_is_visible} />
                        </div>
                    </div>
                </div>
                <div className="priority w-[8%]">
                    <div onClick={(e) => e.stopPropagation()}>
                        <TaskPriority task={task} priority={task.priority} />
                    </div>
                </div>
                <div className="priority w-[8%]">
                    <div onClick={(e) => e.stopPropagation()}>
                        <TaskStatus task={task} status={task.internal_status} />
                    </div>
                </div>
                <div className={`tags ${task.parent ? 'w-[22%] pl-8' : 'w-[21%] pl-5'}`}>
                    <div className="w-full inline-flex" onClick={(e) => e.stopPropagation()}>
                        <TaskTag task={task} taskTags={task.tags} />
                    </div>
                </div>
            </div>


            {/* {taskEditDrawerOpen && <EditMyTaskDrawer taskObj={task} taskId={task && task.id} taskEditDrawerOpen={taskEditDrawerOpen} openTaskEditDrawer={openTaskEditDrawer} closeTaskEditDrawer={closeTaskEditDrawer} />} */}

            <Drawer
                opened={taskEditDrawerOpen}
                onClose={closeTaskEditDrawer}
                position="right"
                withCloseButton={false}
                size="lg"
                closeOnClickOutside={true}
                overlayProps={{ backgroundOpacity: 0, blur: 0 }}
                lockScroll={true}
            >
                <EditMyTaskDrawer
                    taskObj={task}
                    taskId={task && task.id}
                    taskEditDrawerOpen={taskEditDrawerOpen}
                    openTaskEditDrawer={openTaskEditDrawer}
                    closeTaskEditDrawer={closeTaskEditDrawer}
                />
            </Drawer>


        </Fragment>


    );
};

export default MyTaskRow;
