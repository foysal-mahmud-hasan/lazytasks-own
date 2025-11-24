import React, { useState, useEffect, Fragment, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Gantt, Task, EventOption, StylingOption, ViewMode, DisplayOption } from 'gantt-task-react';
import "gantt-task-react/dist/index.css";
import { TaskListTable } from "./GanttChart/TaskListTable";
import { TaskListHeader } from "./GanttChart/TaskListHeader";
import { openTaskEditDrawer, setEditableTask, updateGanttRefresh, fetchGanttTasksByProject, editTask } from "../../../Settings/store/taskSlice";
import { useParams } from 'react-router-dom';
import { Box, Button, Card, Text, ThemeIcon } from '@mantine/core';
import useTwColorByName from "../../../ui/useTwColorByName";
import CustomTooltip from './GanttChart/CustomTaskTooltip';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconNotesOff } from '@tabler/icons-react';
import { translate } from '../../../../utils/i18n';


function prepareTasks(tasks, bgColor) {
    return tasks.map((task, i) => {
        const name = task.assigned_to && task.assigned_to.name;
        const font_color = name ? bgColor(name)["font-color"] : 'white';
        const bg_color = name ? bgColor(name)["bg-color"] : '#ED7D31';

        const isMissing = !task.start || !task.end;
        const start = new Date(task.start);
        const end = new Date(task.end);

        const durationDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        let maxLength = 15;

        if (durationDays <= 1) {
            maxLength = 5;
        } else if (durationDays <= 3) {
            maxLength = 10;
        } else if (durationDays <= 7) {
            maxLength = 20;
        } else if (durationDays <= 14) {
            maxLength = 30;
        } else if (durationDays <= 30) {
            maxLength = 40;
        } else {
            maxLength = 50;
        }

        const displayName = task.name.length > maxLength
            ? `${task.name.slice(0, maxLength)}...`
            : task.name;
        // how to convert Mon Apr 28 2025 06:00:00 GMT+0600 (Bangladesh Standard Time) to Mon Apr 28 2025 00:00:00 GMT+0600 (Bangladesh Standard Time)
        // Set the time to midnight
        // start.setHours(0);
        // end set hours to 11:59:59 PM
        // end.setHours(23, 59);
        return {
            ...task,
            name: displayName,
            fullName: task.name,
            type: task.children && task.children.length > 0 ? 'project' : 'task',
            start: start,
            end: end,
            progress: 0,
            project: task.parent_id ? task.parent_id : undefined,
            // dependencies: task.children && task.children.length > 0 ? task.children.map(child => child.id) : undefined,
            // dependencies: ['142'],
            // isDisabled: isMissing,
            styles: task.isMissingDates ? {
                backgroundColor: "transparent",
                backgroundSelectedColor: "transparent",
                progressColor: "transparent",
                progressSelectedColor: "transparent",
            } : {
                backgroundColor: bg_color ? bg_color : '#ED7D31',
                progressColor: bg_color ? bg_color : '#ED7D31',
                backgroundSelectedColor: '#39758D',
                progressSelectedColor: '#39758D'
            },

        };
    });
}

const TaskGanttChart = () => {
    const bgColor = useTwColorByName();
    //dispatch
    const dispatch = useDispatch();
    const { id } = useParams();
    const { ganttTasks, ganttViewMode, ganttRefresh } = useSelector((state) => state.settings.task);

    const { loggedUserId } = useSelector((state) => state.auth.user);
    const { loggedInUser } = useSelector((state) => state.auth.session);

    //allTasks format
    const [tasks, setTasks] = useState([]);

    useEffect(() => {
        const formattedTasks = ganttTasks.length > 0 && prepareTasks(ganttTasks, bgColor);
        setTasks(formattedTasks || []);
    }, [dispatch, ganttTasks, bgColor]);

    const handleExpanderClick = (task) => {
        // console.log(updatedTasks)
        setTasks(tasks.map(t => (t.id === task.id ? task : t)));
    };

    //onDblClick
    const onDblClick = (task) => {
        if (preventDrawerOpenRef.current) {
            preventDrawerOpenRef.current = false; // Reset the flag
            return; // Prevent the drawer from opening
        }

        const taskId = task.id
        if (taskId) {
            const taskObj = tasks.find(task => Number(task.id) === Number(taskId));
            dispatch(openTaskEditDrawer());
            dispatch(setEditableTask(taskObj && taskObj));
        }
        return false;
    };

    const ganttRef = useRef();

    useEffect(() => {

        const fillShowHideHandler = () => {
            const ganttEl = ganttRef.current;
            if (ganttEl) {
                const svgRoot = ganttEl.querySelector(".bar");
                if (svgRoot) {
                    //all display none remove
                    const allDisplayNone = svgRoot.querySelectorAll('[style*="display: none"]');
                    //remove display none
                    allDisplayNone.forEach((el) => {
                        el.style.display = "block";
                        el.removeAttribute("style");
                    });

                    const transparentElements = svgRoot.querySelectorAll('[fill="transparent"]');
                    transparentElements.forEach((el) => {
                        const gParent = el.closest('g[tabindex="0"]');
                        if (gParent) {
                            const parent = gParent.parentNode;
                            gParent.setAttribute("style", "pointer-events: none;");
                            gParent.style.display = "none";
                            parent.style.display = "none";

                        }
                    });
                } else {
                    setTimeout(fillShowHideHandler, 100); // Retry after 100ms
                }
            }
        };


        const ganttEl = ganttRef.current;
        if (ganttEl) {
            setTimeout(fillShowHideHandler, 100); // Retry after 100ms
        }

    }, [ganttTasks]);

    useEffect(() => {
        //after 1 second
        const timer = setTimeout(() => {
            const ganttEl = ganttRef.current;
            if (ganttEl) {
                document.querySelectorAll("g.calendar > text").forEach((el) => {
                    const splitValue = el.innerHTML.split(", ");
                    //check if splitValue length is greater than 1
                    if (splitValue.length > 1) {
                        el.innerHTML = el.innerHTML?.split(", ")[1];
                    } else {
                        el.innerHTML = el.innerHTML?.split(", ")[0];
                    }
                })
            }

        }, 100);

    }, [ganttViewMode]);


    const dynamicHeight = window.innerHeight - 358;

    let columnWidth = 70;
    if (ganttViewMode === ViewMode.Year) {
        columnWidth = 350;
    } else if (ganttViewMode === ViewMode.Month) {
        columnWidth = 300;
    } else if (ganttViewMode === ViewMode.Week) {
        columnWidth = 250;
    }

    const [limit] = useState(15);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [viewDate, setViewDate] = useState(null);
    const preventDrawerOpenRef = useRef(false);

    const fetchTasks = async (reset = false) => {
        if (loadingMore || (!reset && !hasMore)) return;

        setLoadingMore(true);
        const response = await dispatch(fetchGanttTasksByProject({ id: id }));

        const newTasks = prepareTasks(response?.payload?.data?.ganttTasks || [], bgColor);

        if (reset) {
            setTasks(newTasks);
            setOffset(limit);
            setHasMore(newTasks.length === limit);
        } else {
            // setTasks(prev => [...prev, ...newTasks]);
            setTasks((prev) => {
                const taskMap = new Map(prev.map((task) => [task.id, task]));
                newTasks.forEach((task) => {
                    taskMap.set(task.id, task); // Add or update the task
                });
                return Array.from(taskMap.values());
            });
            setOffset(prev => prev + limit);
            if (newTasks.length < limit) setHasMore(false);
        }

        setLoadingMore(false);
    };

    useEffect(() => {
        fetchTasks(true);
    }, []);

    useEffect(() => {
        // Set the viewDate only on the first load
        if (!viewDate) {
            setViewDate(new Date()); // Set to the current date initially
        }
    }, []);

    const formatLocalDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const handleDateChange = async (task) => {
        preventDrawerOpenRef.current = true;
        // Update UI instantly
        const updatedTasks = tasks.map((t) =>
            t.id === task.id ? { ...t, start: task.start, end: task.end } : t
        );
        setTasks(updatedTasks);

        dispatch(editTask({
            id: task.id,
            data: {
                start_date: task.start ? formatLocalDate(task.start) : "empty",
                start_date_is_visible: task.start ? 1 : 0,
                end_date: task.end ? formatLocalDate(task.end) : "empty",
                end_date_is_visible: task.end ? 1 : 0,
                'updated_by': loggedInUser ? loggedInUser.loggedUserId : loggedUserId,
            },
        })).then((response) => {
            if (response.payload && response.payload.status === 200) {
                notifications.show({
                    color: 'green',
                    title: 'Success',
                    message: 'Date updated successfully.',
                    icon: <IconCheck />,
                    autoClose: 5000,
                });
            }
        });


    };

    return (
        <Fragment>
            <Box className="lazytask-gantt overflow-y-auto h-full" ref={ganttRef}>
                {tasks && tasks.length > 0 ? (
                    <Gantt
                        style={{ minWidth: "100%" }}
                        viewMode={ganttViewMode ? ganttViewMode : ViewMode.Day}
                        viewDate={viewDate}
                        columnWidth={columnWidth}
                        rowHeight={37}
                        tasks={tasks}
                        onExpanderClick={handleExpanderClick}
                        TaskListTable={(props) => (
                            <TaskListTable
                                {...props}
                                setTasks={setTasks} // Pass setTasks here
                                // onDblClick={onDblClick}
                                onClick={onDblClick}
                            />
                        )}
                        TaskListHeader={TaskListHeader}
                        TooltipContent={({ task }) => <CustomTooltip task={task} />}
                        ganttHeight={dynamicHeight}
                        // onDoubleClick={(task) => {
                        //     onDblClick(task)
                        // }}
                        onClick={(task) => {
                            onDblClick(task)
                        }}
                        onDateChange={handleDateChange}
                    />
                ) : (
                    <Card
                        withBorder
                        radius="md"
                        padding="md"
                        h={"100%"}
                        className="flex flex-col justify-center items-center bg-[#F9FAFB] shadow-sm"
                    >
                        <Box
                            style={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                                zIndex: 25,
                                textAlign: "center",
                            }}
                        >

                            <ThemeIcon color='orange' variant="light" radius="md" size="xl">
                                <IconNotesOff size={32} stroke={1.25} />
                            </ThemeIcon>

                            {/* Message */}
                            <Text ta="center" fz="lg" fw={700} c="#4A5568" mb="sm">
                                {translate("No tasks available to display the Gantt chart.")}
                            </Text>
                            <Text ta="center" fz="sm" c="#718096" mb="lg">
                                {translate("You can add tasks on gantt chart from list tab.")}
                            </Text>

                            {/* Button */}
                            <Button
                                size="md"
                                variant="light"
                                color="#39758D"
                                onClick={() => fetchTasks(true)} // Optionally trigger a refresh
                                style={{
                                    borderRadius: "8px",
                                    padding: "10px 20px",
                                    fontWeight: 600,
                                }}
                            >
                                {translate("Refresh Tasks")}
                            </Button>
                        </Box>
                    </Card>
                )
                }

                {hasMore && (
                    <Box className="text-center mt-2">
                        <Button
                            onClick={() => fetchTasks(false)}
                            loading={loadingMore}
                            loaderProps={{ type: 'dots' }}
                            disabled={loadingMore}
                            size="xs"
                            variant="filled"
                            color="#ED7D31"
                            className="font-semibold"
                        >
                            Load More
                        </Button>
                    </Box>
                )}


            </Box>

        </Fragment>
    );
};

export default TaskGanttChart;
