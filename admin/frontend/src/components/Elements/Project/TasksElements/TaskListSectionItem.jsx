import React, { useEffect, useRef } from 'react';
import { Accordion, Tooltip, Avatar, Loader, Flex } from '@mantine/core';
import { IconPlus, IconRefresh } from '@tabler/icons-react';
// import { useInView } from 'react-intersection-observer';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTasksBySection, openAddTaskDrawer } from '../../../Settings/store/taskSlice';
import TaskListContent from './TaskListContent';
import TaskSectionName from './Task/TaskSectionName';
import SectionHeaderActions from './SectionHeaderActions';
import { hasPermission } from '../../../ui/permissions';
import { translate } from '../../../../utils/i18n';

const TaskListSectionItem = ({ taskListSection, index, projectInfo, taskListSections, columns, snapshot, provided }) => {
    const dispatch = useDispatch();
    const { loggedUserId } = useSelector(state => state.auth.user);
    const { loggedInUser } = useSelector(state => state.auth.session);

    const { loadingSections, loadedSections } = useSelector(state => state.settings.task);
    const sectionSlug = taskListSections[taskListSection]?.slug;
    const isLoading = loadingSections[sectionSlug];

    // const [ref, inView] = useInView({
    //     threshold: 0.1,
    //     triggerOnce: true,
    // });

    const loadedSectionsRef = useRef({});
    // useEffect(() => {
    //     if (
    //         !loadedSectionsRef.current[taskListSection] &&
    //         taskListSections[taskListSection] &&
    //         projectInfo?.id
    //     ) {
    //         dispatch(fetchTasksBySection({
    //             projectId: projectInfo.id,
    //             sectionSlug: taskListSections[taskListSection].slug,
    //             limit: 10,
    //             offset: 0,
    //             append: true
    //         }));
    //         loadedSectionsRef.current[taskListSection] = true;
    //     }
    // }, [taskListSection]);
    // useEffect(() => {
    //     const alreadyLoaded = loadedSections?.[sectionSlug]?.offset > 0;

    //     if (!alreadyLoaded && sectionSlug && projectInfo?.id) {
    //         dispatch(fetchTasksBySection({
    //             projectId: projectInfo.id,
    //             sectionSlug,
    //             limit: 10,
    //             offset: 0,
    //             append: false,
    //         }));
    //     }
    // }, [sectionSlug, projectInfo?.id]);

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

    const handleRefreshSectionTasks = (section) => () => {
        if (section && projectInfo?.id) {
            dispatch(fetchTasksBySection({
                projectId: projectInfo.id,
                sectionSlug: section.slug,
                limit: 14,
                offset: 0,
                append: false,
            }));
        }
    };

    return (
        <Accordion.Item
            key={taskListSection}
            value={taskListSections[taskListSection]?.slug}
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
                    <TaskSectionName
                        taskSectionId={taskListSections[taskListSection]?.id}
                        nameOfTaskSection={taskListSections[taskListSection]?.name}
                        view="listView"
                    />
                </div>
                <div className="flex gap-2 mr-2">
                    <Tooltip withinPortal={false} label={translate('Refresh Section')} position="top" withArrow>
                        <Avatar
                            className="cursor-pointer"
                            onClick={handleRefreshSectionTasks(taskListSections[taskListSection])}
                            size={26}
                            color="#ED7D31"
                            variant="light"
                        >
                            <IconRefresh className=' hover:scale-110' size={16} />
                        </Avatar>
                    </Tooltip>
                </div>
                <div className="flex gap-2">
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
                </div>
                {hasPermission(loggedInUser?.llc_permissions, ['create-manage-section', 'archive-section', 'duplicate-section']) && (
                    <div className="flex items-center gap-2 cursor-pointer pr-1">
                        <SectionHeaderActions
                            taskSection={taskListSections[taskListSection]}
                            taskListSection={taskListSection}
                        />
                    </div>
                )}
            </div>
            <Accordion.Panel>
                {isLoading ? (
                    <Flex justify="center" align="center">
                        <Loader type="dots" size={24} />
                    </Flex>
                ) : (
                    <TaskListContent
                        listType="CONTENT"
                        view="listView"
                        projectId={projectInfo.id}
                        taskSection={taskListSection}
                        taskSectionId={taskListSections[taskListSection]?.id}
                        contents={columns?.[taskListSection] || []}
                    />
                )}
            </Accordion.Panel>
        </Accordion.Item>
    );
};

export default TaskListSectionItem;
