import React, { useEffect, useRef } from 'react';
import { Accordion, Tooltip, Avatar, Loader, Flex, Text } from '@mantine/core';
import { IconPlus, IconRefresh } from '@tabler/icons-react';
// import { useInView } from 'react-intersection-observer';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTasksByPriority, fetchTasksByStatus, openAddTaskDrawer } from '../../../../Settings/store/taskSlice';
import { hasPermission } from '../../../../ui/permissions';
import { translate } from '../../../../../utils/i18n';
import TaskListContentByPriority from './TaskListContentByPriority';
import TaskListContentByStatus from './TaskListContentByStatus';

const TaskListStatusItem = ({ status, index, projectInfo, projectStatuses, columns, snapshot, provided }) => {
    const dispatch = useDispatch();
    const { loggedUserId } = useSelector(state => state.auth.user);
    const { loggedInUser } = useSelector(state => state.auth.session);
    const userId = loggedInUser ? loggedInUser.loggedUserId : loggedUserId;

    const { loadingStatus, loadedSections } = useSelector(state => state.settings.task);
    const key = status?.slug === 'no-status' ? 'no-status' : status?.slug;
    const isLoading = loadingStatus[key];

    // const [ref, inView] = useInView({
    //     threshold: 0.1,
    //     triggerOnce: true,
    // });

    const loadedSectionsRef = useRef({});

    const handleAddTaskDrawerOpen = () => {
        dispatch(openAddTaskDrawer({
            projectId: projectInfo.id,
            sectionId: taskListSections[taskListSection].id
        }));
    };

    const setRefs = (el) => {
        // ref(el);
        provided.innerRef(el);
    };

    const handleRefreshStatusTasks = (status) => () => {
        if (status && projectInfo?.id) {
            if (status.id === 'no-status') {
                dispatch(fetchTasksByStatus({
                    projectId: projectInfo.id,
                    statusId: null,
                    statusSlug: null,
                    limit: 14,
                    offset: 0,
                    append: false,
                }));
            } else {
                dispatch(fetchTasksByStatus({
                    projectId: projectInfo.id,
                    statusId: status.id ?? null,
                    statusSlug: status.slug ?? null,
                    limit: 14,
                    offset: 0,
                    append: false,
                }));
            }
        }
    };
        const columnKey = status?.id === 'no-status' ? 'no-status' : status?.id;

        return (
            <Accordion.Item
                key={status.id}
                value={status?.id.toString()}
                // ref={ref}
                ref={setRefs}
                className="!border-solid !border-[#dddddd] !rounded-t-md accordion-item !bg-[#fcfcfc]"
                {...provided.draggableProps}
            >
                <div
                    {...provided.dragHandleProps}
                    className="flex items-center w-full border-b border-solid border-[#dddddd] !bg-[#EBF1F4]"
                    style={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 10,
                        backgroundColor: '#EBF1F4',
                        width: '100%',
                    }}
                >
                    <div className="flex w-full items-center font-bold py-1 pr-3 !pl-3 gap-5">
                        <Accordion.Control />
                        {/* <TaskSectionName
                        taskSectionId={taskListSections[taskListSection]?.id}
                        nameOfTaskSection={taskListSections[taskListSection]?.name}
                        view="listView"
                    /> */}
                        <Text c={"#4d4d4d"} size='sm' fw={600}>{status?.name}</Text>
                    </div>
                    <div className="flex gap-2 mr-2">
                        <Tooltip withinPortal={false} label={translate('Refresh')} position="top" withArrow>
                            <Avatar
                                className="cursor-pointer"
                                onClick={handleRefreshStatusTasks(status)}
                                size={26}
                                color="#ED7D31"
                                variant="light"
                            >
                                <IconRefresh className=' hover:scale-110' size={16} />
                            </Avatar>
                        </Tooltip>
                    </div>
                    {/* <div className="flex gap-2">
                    {hasPermission(loggedInUser?.llc_permissions, ['create-task']) && (
                        <Tooltip withinPortal={false} label={translate('Add Task')} position="top" withArrow>
                            <Avatar
                                className="cursor-pointer"
                                onClick={handleAddTaskDrawerOpen}
                                size={26}
                                bg="#ED7D31"
                                color="#fff"
                            >
                                <IconPlus className=' hover:scale-110' size={16} />
                            </Avatar>
                        </Tooltip>
                    )}
                </div> */}
                    {/* {hasPermission(loggedInUser?.llc_permissions, ['create-manage-section', 'archive-section', 'duplicate-section']) && (
                    <div className="flex items-center gap-2 cursor-pointer pr-1">
                        <SectionHeaderActions
                            taskSection={taskListSections[taskListSection]}
                            taskListSection={taskListSection}
                        />
                    </div>
                )} */}
                </div>
                <Accordion.Panel>
                    {isLoading ? (
                        <Flex justify="center" align="center">
                            <Loader type="dots" size={24} />
                        </Flex>
                    ) : (
                        <TaskListContentByStatus
                            listType="CONTENT"
                            view="listView"
                            projectId={projectInfo.id}
                            status={status}
                            statusId={status?.id}
                            contents={columns?.[key] || []}
                        />
                    )}
                </Accordion.Panel>
            </Accordion.Item>
        );
    };

    export default TaskListStatusItem;
