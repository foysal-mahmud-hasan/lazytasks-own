import React, { Fragment, useEffect, useState } from 'react';
import { Button, Container, Drawer, LoadingOverlay, ScrollArea } from '@mantine/core';
import ProjectDetailsNav from './ProjectDetailsNav';
import ProjectDetailsList from './ProjectDetailsList';
import ProjectDetailsBorad from './ProjectDetailsBorad';
import { useLocation, useParams, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from "react-redux";
import {
    closeTaskEditDrawer,
    closeAddTaskDrawer,
    fetchGanttTasksByProject,
    fetchTasksByProject,
    updateIsLoading,
    fetchProjectOverview
} from "../../Settings/store/taskSlice";
import { fetchAllTags } from "../../Settings/store/tagSlice";
import ProjectDetailsCalendar from "./ProjectDetailsCalendar";
import ProjectDetailsGanttChart from "./ProjectDetailsGanttChart";
import EditTaskDrawer from "./TasksElements/EditTaskDrawer";
import AddTaskDrawer from "./TasksElements/AddTaskDrawer";
const ProjectDetails = () => {
    const location = useLocation();
    const dispatch = useDispatch();
    const { id } = useParams();

    const { isLoading, taskEditDrawerOpen, addTaskDrawerOpen, task, projectId, taskSectionId, projectInfo } = useSelector((state) => state.settings.task);

    const listPagePathName = `/project/task/list/${id}`;
    const boardPagePathName = `/project/task/board/${id}`;
    const calendarPagePathName = `/project/task/calendar/${id}`;
    const ganttChartPagePathName = `/project/task/gantt/${id}`;
    const whiteboardPagePathName = `/project/task/whiteboard/${id}`;

    useEffect(() => {
        dispatch(fetchAllTags())
    }, [dispatch]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (isLoading === true) {
                    if (location.pathname === ganttChartPagePathName) {
                        await dispatch(fetchGanttTasksByProject({ id: id })).then((response) => {
                            if (response.payload.status === 200) {
                                dispatch(updateIsLoading(false))
                            }
                        });
                    } else {
                        await dispatch(fetchProjectOverview(id)).then((response) => {

                            if (response.payload.status === 200) {
                                dispatch(updateIsLoading(false))
                            }
                        });
                    }
                }

            } catch (err) {
                console.error("Unexpected error:", err);
            } finally {
                // dispatch(updateIsLoading( false ))
            }
        };
        fetchData();
    }, [dispatch, isLoading, id, location.pathname]);

    useEffect(() => {
        dispatch(updateIsLoading(true))

        /*setTimeout(() => {
            dispatch(updateIsLoading( false ))
        }, 1000);*/
    }, [location.pathname]);

    const handlerCloseTaskEditDrawer = () => {
        dispatch(closeTaskEditDrawer());
    }
    const handlerCloseAddTaskDrawer = () => {
        dispatch(closeAddTaskDrawer());
    }

    return (
        <Fragment>
            <div className='dashboard'>
                <Container size="full">
                    <div className="settings-page-card bg-white rounded-xl p-6 pt-3 my-5 pb-[1rem]">
                        <ProjectDetailsNav />
                        {/* {location.pathname === listPagePathName && <ProjectDetailsList />}
                        {location.pathname === boardPagePathName && <ProjectDetailsBorad />}
                        {location.pathname === calendarPagePathName && <ProjectDetailsCalendar />}
                        {location.pathname === ganttChartPagePathName && <ProjectDetailsGanttChart />}*/}
                        <Outlet />
                    </div>
                </Container>
            </div>

            {/* {task && taskEditDrawerOpen && */}
            <Drawer
                opened={taskEditDrawerOpen}
                onClose={handlerCloseTaskEditDrawer}
                // title="Authentication"
                position="right"
                withCloseButton={false}
                size="lg"
                closeOnClickOutside={true}
                overlayProps={{ backgroundOpacity: 0, blur: 0 }}
                lockScroll={true}
            >
                <EditTaskDrawer lockScroll={true} taskObj={task} taskId={task && task.id} taskEditDrawerOpen={taskEditDrawerOpen} />
            </Drawer>
            {/* } */}


            <Drawer
                opened={addTaskDrawerOpen}
                onClose={handlerCloseAddTaskDrawer}
                // title="Authentication"
                position="right"
                withCloseButton={false}
                size="lg"
                closeOnClickOutside={true}
                overlayProps={{ backgroundOpacity: 0, blur: 0 }}
                lockScroll={true}
            >
                <AddTaskDrawer lockScroll={true} projectId={projectId} projectInfo={projectInfo} taskSectionId={taskSectionId} addTaskDrawerOpen={addTaskDrawerOpen} />
            </Drawer>


        </Fragment>

    );
}

export default ProjectDetails;
