import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import styles from "./task-list-table.module.css";
import TaskAssignTo from "../Task/TaskAssignTo";
import TaskDueDate from "../Task/TaskDueDate";
import { deleteGanttTask, deleteTask, editGanttTaskSortOrder, editTask, fetchTask } from "../../../../Settings/store/taskSlice";
import { useDispatch, useSelector } from "react-redux";
import { useDisclosure } from "@mantine/hooks";
import { useParams } from "react-router-dom";
import { Divider, Group, Text, ThemeIcon, Tooltip } from "@mantine/core";
import { IconCircleMinus, IconCircleX, IconTrash } from "@tabler/icons-react";
import { modals } from "@mantine/modals";
import { showNotification, updateNotification } from "@mantine/notifications";
import { translate } from "../../../../../utils/i18n";

export const TaskListTable = ({
    rowHeight,
    rowWidth,
    fontFamily,
    fontSize,
    locale,
    tasks,
    setTasks,
    selectedTaskId,
    setSelectedTask,
    onExpanderClick,
    onClick
}) => {

    const dispatch = useDispatch();

    const { id } = useParams();

    const { loggedUserId } = useSelector((state) => state.auth.user)
    const { loggedInUser } = useSelector((state) => state.auth.session)

    const handleDragEnd = (result) => {

        // how to remove blur from the grid
        const grid = document.querySelector('.grid').closest('svg');
        if (grid) {
            grid.style.filter = 'none';
        }

        if (!result.destination) return;

        //destination.index and source.index are same return false
        if (result.destination.index === result.source.index) return;

        const reorderedTasks = Array.from(tasks);
        const [movedTask] = reorderedTasks.splice(result.source.index, 1);
        reorderedTasks.splice(result.destination.index, 0, movedTask);
        //how to get only ids with index
        const reorderedTaskIds = reorderedTasks.length > 0 && reorderedTasks.map((task, index) => task.id);
        const submittedData = {
            project_id: id,
            orderedList: reorderedTaskIds,
            updated_by: loggedInUser ? loggedInUser.loggedUserId : loggedUserId
        }
        console.log(submittedData)

        dispatch(editGanttTaskSortOrder({ data: submittedData })).then((response) => {
            if (response.payload.status === 200) {
                const data = response.payload?.data;
                const taskId = response.payload?.taskId;
                console.log(data)
                console.log(taskId)
                const reOrderedTasks = reorderedTasks.map((task, index) => {
                    return {
                        ...task,
                        displayOrder: index + 1,
                    }
                });

                setTasks(reOrderedTasks);

            }
        });

    };
    const handleDragStart = (start) => {

        //how to get .grid class and loading component display into this class
        const grid = document.querySelector('.grid').closest('svg');
        if (grid) {
            //backdrop-filter
            grid.style.filter = 'blur(20px)';
        }
    }

    const removeTaskFromGanttHandler = (taskId) => {
        modals.openConfirmModal({
            title: (
                <Group spacing="xs">
                    <ThemeIcon color="orange" radius="xl" size="lg" variant="filled">
                        <IconCircleMinus size={24} />
                    </ThemeIcon>
                    <Text size="md" weight={500}>
                        {translate('Remove Task From Gantt Chart')}
                    </Text>
                </Group>
            ),
            centered: true,
            children: (
                <>
                    <Divider size="xs" mb={14} className='!-ml-4 w-[calc(100%+2rem)]' />
                    <Text size="md" mb={30}>
                        {translate('Are you sure you want to remove task from gantt chart ?')}
                    </Text>
                </>
            ),
            labels: { confirm: translate('Yes'), cancel: translate('Cancel') },
            confirmProps: { color: 'orange' },
            onConfirm: () => {
                showNotification({
                    id: 'load-data',
                    loading: true,
                    title: 'Task',
                    message: "Removing Task From Gantt...",
                    disallowClose: true,
                    color: 'green',
                });
                const updatedTask = {
                    is_visible: 0
                }
                dispatch(editTask({
                    id: taskId,
                    data: updatedTask
                }))
                    .then((response) => {
                        if (response.payload && response.payload.status && response.payload.status === 200) {
                            updateNotification({
                                id: 'load-data',
                                loading: false,
                                title: 'Task',
                                message: response.payload && response.payload.message && response.payload.message,
                                autoClose: 2000,
                                disallowClose: true,
                                color: 'green',
                            });
                        } else {
                            updateNotification({
                                id: 'load-data',
                                loading: false,
                                title: 'Task',
                                message: response.payload && response.payload.message && response.payload.message,
                                autoClose: 2000,
                                disallowClose: true,
                                color: 'red',
                            });
                        }
                    })
                    .catch((error) => {
                        console.error('Error adding task on gantt:', error);
                        alert('Failed to Add Task to Gantt Chart.');
                    });
            },
        });
    }

    return (
        <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
            <Droppable droppableId="taskList">
                {(provided) => (
                    <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={styles.taskListWrapper}
                    >
                        {tasks.map((t, index) => {

                            return (
                                <Draggable key={t.id} draggableId={t.id.toString()} index={index} isDragDisabled={true}>
                                    {(provided, dragSnapshot) => (
                                        <div
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            ref={provided.innerRef}
                                            className={`taskRowWrapper task-list-item ${styles.taskListTableRow}`}
                                            style={{
                                                height: rowHeight,
                                                ...provided.draggableProps.style,
                                                backgroundColor: dragSnapshot.isDragging ? '#EBF1F4' : '',
                                            }}
                                            onClick={() => onClick(t)}
                                        >
                                            <div
                                                className={styles.taskListCell}
                                                style={{
                                                    minWidth: "250px",
                                                    maxWidth: "250px",
                                                    paddingLeft: "10px",
                                                }}
                                            >
                                                <div
                                                    className={`pr-3 ${styles.taskListNameWrapper}
                                                     ${t.parent ? styles.subTaskList : ""}`}
                                                >
                                                    <div
                                                        className={
                                                            t.hideChildren === false
                                                                ? styles.taskListExpander
                                                                : styles.taskListEmptyExpander
                                                        }
                                                        onClick={() => onExpanderClick(t)}
                                                    >
                                                        {t.hideChildren === false && "▼"}
                                                        {t.hideChildren === true && "▶"}
                                                    </div>
                                                    <div
                                                        className="taskNameWrapper"
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <IconCircleX
                                                            className="deleteIcon"
                                                            stroke={1.25}
                                                            style={{
                                                                fontSize: '16px', // Explicit size
                                                                color: '#ff4d4f',
                                                                cursor: 'pointer',
                                                                flexShrink: 0, // Prevent shrinking
                                                            }}
                                                            onClick={() => removeTaskFromGanttHandler(t.id)}
                                                        />
                                                        <Tooltip
                                                            arrowPosition="side"
                                                            arrowOffset={24}
                                                            arrowSize={4}
                                                            label={<div dangerouslySetInnerHTML={{ __html: t.fullName }} />}
                                                            position="top-start"
                                                            withArrow
                                                        >
                                                            <p
                                                                className="p-0 m-0 line-clamp-1"
                                                                style={{
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap',
                                                                }}
                                                                dangerouslySetInnerHTML={{ __html: t.fullName }}
                                                            />
                                                        </Tooltip>
                                                    </div>
                                                </div>
                                            </div>
                                            <div
                                                className={`justify-center ${styles.taskListCell}`}
                                                style={{
                                                    minWidth: "100px",
                                                    maxWidth: "100px",
                                                    textAlign: "center",
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <TaskAssignTo taskId={t.id} assigned={t.assigned_to} view='ganttView' assignedMember={(props) => {
                                                    console.log('')
                                                }} />
                                            </div>
                                            <div
                                                className={`justify-center ${styles.taskListCell}`}
                                                style={{
                                                    minWidth: "100px",
                                                    maxWidth: "100px",
                                                    textAlign: "center",
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <TaskDueDate
                                                    taskId={t.id}
                                                    startDate={t.start_date}
                                                    dueDate={t.end_date}
                                                    startDateIsVisible={t.start_date_is_visible}
                                                    dueDateIsVisible={t.end_date_is_visible}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </Draggable>
                            )
                        }
                        )
                        }
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </DragDropContext>
    );
};