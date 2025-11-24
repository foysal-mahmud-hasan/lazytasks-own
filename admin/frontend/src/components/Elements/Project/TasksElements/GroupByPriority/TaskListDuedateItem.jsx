import React from 'react';
import { Accordion, Tooltip, Avatar, Loader, Flex, Text } from '@mantine/core';
import { IconPlus, IconRefresh } from '@tabler/icons-react';
// import { useInView } from 'react-intersection-observer';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTasksByDueDate, fetchTasksByPriority, openAddTaskDrawer } from '../../../../Settings/store/taskSlice';
import { hasPermission } from '../../../../ui/permissions';
import { translate } from '../../../../../utils/i18n';
import TaskListContentByPriority from './TaskListContentByPriority';
import TaskListContentByDuedate from './TaskListContentByDuedate';

const TaskListDuedateItem = ({ group, index, projectInfo, groupByDateLabels, columns, snapshot, provided }) => {
    const dispatch = useDispatch();
    const { loggedUserId } = useSelector(state => state.auth.user);
    const { loggedInUser } = useSelector(state => state.auth.session);

    const { loadingDueDate, loadedSections } = useSelector(state => state.settings.task);
    const isLoading = loadingDueDate[group?.key];

    // const [ref, inView] = useInView({
    //     threshold: 0.1,
    //     triggerOnce: true,
    // });

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

    const handleRefreshDuedateTasks = (group) => () => {
        if (group && projectInfo?.id) {
            dispatch(fetchTasksByDueDate({
                projectId: projectInfo.id,
                dateType: group.key,
                limit: 14,
                offset: 0,
                append: false,
            }));
        }
    };

    return (
        <Accordion.Item
            key={group.key}
            value={group?.key}
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
                    <Text c={"#4d4d4d"} size='sm' fw={600}>{group?.label}</Text>
                </div>
                <div className="flex gap-2 mr-2">
                    <Tooltip withinPortal={false} label={translate('Refresh')} position="top" withArrow>
                        <Avatar
                            className="cursor-pointer"
                            onClick={handleRefreshDuedateTasks(group)}
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
                    <TaskListContentByDuedate
                        listType="CONTENT"
                        view="listView"
                        projectId={projectInfo.id}
                        group={group}
                        groupKey={group?.key}
                        contents={columns?.[group?.key] || []}
                    />
                )}
            </Accordion.Panel>
        </Accordion.Item>
    );
};

export default TaskListDuedateItem;
