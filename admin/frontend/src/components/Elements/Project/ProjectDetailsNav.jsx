import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    ActionIcon,
    Breadcrumbs,
    Button, Card,
    Flex, Grid,
    Group,
    Popover,
    ScrollArea,
    Text, TextInput,
    Title, Drawer,
    Tooltip, Select, Menu,
    ThemeIcon,
    Divider
} from '@mantine/core';
import { useDisclosure, useHotkeys, useDebouncedCallback } from '@mantine/hooks';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import {
    IconCaretDownFilled,
    IconChevronRight,
    IconFilter,
    IconRefresh, IconSearch,
    IconX, IconSettings, IconArchive,
    IconGauge, IconFingerprint, IconActivity,
    IconSettings2,
    IconArchiveFilled,
    IconArchiveOff,
    IconLayoutNavbarCollapse,
    IconLayoutNavbarExpand,
    IconCodeVariablePlus,
    IconAdjustmentsHorizontal,
    IconCheck
} from '@tabler/icons-react';
import UsersAvatarGroup from "../../ui/UsersAvatarGroup";
import {
    changeGanttViewMode, fetchGanttTasksByProject,
    fetchTasksByProject,
    archiveProject,
    updateIsLoading,
    unarchiveProject,
    createTaskSection,
    updateExpandedItems
} from "../../Settings/store/taskSlice";
import { hasPermission } from "../../ui/permissions";
import ViewArchive from './ViewArchive';
import FilterTasks from './FilterTasks';
import ShortcutPopover from './ShortcutPopover';
import MemberAddRemovePopover from './MemberAddRemovePopover';
import { fetchTasksBySection } from '../../Settings/store/taskSlice';
import { translate } from '../../../utils/i18n';
import AddonInstallationModal from '../../Settings/AddonInstallationModal';
import ProjectConfigureModal from './ProjectConfigureModal';
import { showNotification, updateNotification } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { updateInputFieldFocus } from "../../../store/base/commonSlice";
import ProjectSettingsModal from './ProjectSettingsModal';

const data = [
    { icon: IconGauge, label: 'Day', description: 'Item with description' },
    {
        icon: IconFingerprint,
        label: 'Week',
        rightSection: <IconChevronRight size={16} stroke={1.5} />,
    },
    { icon: IconActivity, label: 'Month' },
];
const ProjectDetailsNav = () => {
    const location = useLocation();
    const navigate = useNavigate()
    const dispatch = useDispatch();

    const { loggedUserId } = useSelector((state) => state.auth.user);
    const { loggedInUser } = useSelector((state) => state.auth.session);
    const userId = loggedInUser ? loggedInUser.loggedUserId : loggedUserId;

    const usersData = useSelector((state) => state.users);

    const { whiteboardAddonState } = useSelector((state) => state.settings.setting);
    const { projectInfo, ordered, loadedSections, projectNavbar, tasks, taskListSections, ganttViewMode } = useSelector((state) => state.settings.task);

    const [settingDrawerOpened, { open: settingDrawerOpen, close: settingDrawerClose }] = useDisclosure(false);
    const [filterDrawerOpened, { open: filterDrawerOpen, close: filterDrawerClose }] = useDisclosure(false);
    const [projectPopoverOpened, setProjectPopoverOpened] = useState(false);
    const [addonModalOpened, setAddonModalOpened] = useState(false);
    const [projectNavConfigureModalOpen, setProjectNavConfigureModalOpen] = useState(false);
    const [projectSettingsModalOpen, setProjectSettingsModalOpen] = useState(false);

    const [isOpenedMemberPopover, setIsOpenedMemberPopover] = useState(false);
    const [isAddingSection, setIsAddingSection] = useState(false);

    const { id } = useParams();
    const listPagePathName = `/project/task/list/${id}`;
    const boardPagePathName = `/project/task/board/${id}`;
    const calendarPagePathName = `/project/task/calendar/${id}`;
    const ganttChartPagePathName = `/project/task/gantt/${id}`;
    const whiteboardPagePathName = `/project/whiteboard/${id}`;
    const listPageGroupByPriorityPathName = `/project/task/list/by/priority/${id}`;
    const listPageGroupByStatusPathName = `/project/task/list/by/status/${id}`;
    const listPageGroupByMemberPathName = `/project/task/list/by/member/${id}`;
    const listPageGroupByDueDatePathName = `/project/task/list/by/duedate/${id}`;

    const reloadSections = () => {
        if (ordered && ordered.length > 0 && projectInfo?.id) {
            ordered.forEach((sectionSlug) => {


                dispatch(fetchTasksBySection({
                    projectId: projectInfo.id,
                    sectionSlug,
                    limit: 15,
                    offset: 0,
                    append: true,
                    userId: userId
                }));

            });
        }
    };

    const searchInputRef = useRef(null);
    useHotkeys([
        ['alt+F', () => {
            if (searchInputRef.current) {
                searchInputRef.current.focus();
            }
        }],
        ['alt+P', () => setProjectPopoverOpened(true)],
        ['Escape', () => setProjectPopoverOpened(false)],
        ['alt+K', () => toggoleView()]
    ]);

    const [searchInputValue, setSearchInputValue] = useState('');

    const toggoleView = () => {
        if (location.pathname === listPagePathName) {
            navigate(boardPagePathName);
        } else if (location.pathname === boardPagePathName) {
            navigate(calendarPagePathName);
        } else if (location.pathname === calendarPagePathName) {
            navigate(ganttChartPagePathName);
        } else if (location.pathname === ganttChartPagePathName) {
            navigate(listPagePathName);
        }
    }



    const goToTasksList = useCallback((projectId) => {
        navigate(`/project/task/list/${projectId}`);
        setProjectPopoverOpened(false);
    }, [navigate]);
    //searchHandler
    const searchHandler = (e) => {

        const searchValue = e.target.value;
        // searchValue length is greater than 2
        setSearchInputValue(searchValue);
        debouncedSearch(searchValue);
        // if (location.pathname === ganttChartPagePathName) {
        //     dispatch(fetchGanttTasksByProject({ id: id, data: { search: searchValue } }))
        // } else {
        //     dispatch(fetchTasksByProject({ id: id, data: { search: searchValue } }))
        // }

    }

    const debouncedSearch = useDebouncedCallback((value) => {
        if (location.pathname === ganttChartPagePathName) {
            dispatch(fetchGanttTasksByProject({ id, data: { search: value } }));
        } else {
            dispatch(fetchTasksByProject({ id, data: { search: value }, userId }));
        }
    }, 1000);


    const handleClearSearch = () => {
        setSearchInputValue('');
        dispatch(fetchTasksByProject({ id: id, data: { search: '' } }));
        dispatch(fetchGanttTasksByProject({ id: id, data: { search: '' } }));
    };

    const handleRefresh = () => {
        dispatch(updateIsLoading(true));
        reloadSections();
    }

    const projectCount = projectInfo?.parent?.projects?.length || 0;
    const cardHeight = 80;
    const maxVisibleCards = 3;

    const scrollAreaHeight = projectCount > maxVisibleCards
        ? cardHeight * maxVisibleCards
        : 'auto';

    //handleGanttViewMode
    const handleGanttViewMode = (mode) => {
        dispatch(changeGanttViewMode(mode));
    }

    const handleViewSwitch = (view) => {
        dispatch(updateIsLoading(true));

        switch (view) {
            case 'list':
                navigate(`/project/task/list/${id}`);
                break;
            case 'board':
                navigate(`/project/task/board/${id}`);
                break;
            case 'calendar':
                navigate(`/project/task/calendar/${id}`);
                break;
            case 'gantt':
                navigate(`/project/task/gantt/${id}`);
                break;
            case 'whiteboard':
                navigate(`/project/task/whiteboard/${id}`);
                break;
        }
    };

    const handleArchiveProject = () => {
        modals.openConfirmModal({
            title: (
                <Group spacing="xs">
                    <ThemeIcon color="orange" radius="xl" size="lg" variant="filled">
                        <IconArchive size={24} />
                    </ThemeIcon>
                    <Text size="md" weight={500}>
                        {translate('Archive Project')}
                    </Text>
                </Group>
            ),
            centered: true,
            children: (
                <>
                    <Divider size="xs" mb={24} className='!-ml-4 w-[calc(100%+2rem)]' />
                    <Text size="md" mb={30}>
                        {translate('Are you sure you want to archive this project?')}
                    </Text>
                </>
            ),
            labels: { confirm: 'Yes', cancel: 'Cancel' },
            confirmProps: { color: 'orange' },
            onConfirm: () => {
                showNotification({
                    id: 'load-data',
                    loading: true,
                    title: 'Project',
                    message: "Archiving The Project...",
                    disallowClose: true,
                    color: 'green',
                });
                dispatch(archiveProject({
                    id: id,
                    data: {
                        updated_by: loggedInUser?.loggedUserId ?? loggedUserId,
                    }
                }))
                    .then((response) => {
                        if (response.payload && response.payload.status && response.payload.status === 200) {
                            updateNotification({
                                id: 'load-data',
                                loading: true,
                                title: 'Subtask',
                                message: response.payload && response.payload.message && response.payload.message,
                                autoClose: 2000,
                                disallowClose: true,
                                color: 'green',
                            });
                        } else {
                            updateNotification({
                                id: 'load-data',
                                loading: false,
                                title: 'Subtask',
                                message: response.payload && response.payload.message && response.payload.message,
                                autoClose: 2000,
                                disallowClose: true,
                                color: 'red',
                            });
                        }
                    })
                    .catch((error) => {
                        console.error('Error completing subtask:', error);
                    });
            },
        });
    }

    const handleUnarchiveProject = () => {
        modals.openConfirmModal({
            title: (
                <Group spacing="xs">
                    <ThemeIcon color="orange" radius="xl" size="lg" variant="filled">
                        <IconArchive size={24} />
                    </ThemeIcon>
                    <Text size="md" weight={500}>
                        {translate('Unarchive Project')}
                    </Text>
                </Group>
            ),
            centered: true,
            children: (
                <>
                    <Divider size="xs" mb={24} className='!-ml-4 w-[calc(100%+2rem)]' />
                    <Text size="md" mb={30}>
                        {translate('Are you sure you want to unarchive this project?')}
                    </Text>
                </>
            ),
            labels: { confirm: 'Yes', cancel: 'Cancel' },
            confirmProps: { color: 'orange' },
            onConfirm: () => {
                showNotification({
                    id: 'load-data',
                    loading: true,
                    title: 'Project',
                    message: "Unarchiving The Project...",
                    disallowClose: true,
                    color: 'green',
                });
                dispatch(unarchiveProject({
                    id: id,
                    data: {
                        updated_by: loggedInUser?.loggedUserId ?? loggedUserId,
                    }
                }))
                    .then((response) => {
                        if (response.payload && response.payload.status && response.payload.status === 200) {
                            updateNotification({
                                id: 'load-data',
                                loading: true,
                                title: 'Subtask',
                                message: response.payload && response.payload.message && response.payload.message,
                                autoClose: 2000,
                                disallowClose: true,
                                color: 'green',
                            });
                        } else {
                            updateNotification({
                                id: 'load-data',
                                loading: false,
                                title: 'Subtask',
                                message: response.payload && response.payload.message && response.payload.message,
                                autoClose: 2000,
                                disallowClose: true,
                                color: 'red',
                            });
                        }
                    })
                    .catch((error) => {
                        console.error('Error completing subtask:', error);
                    });
            },
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        if (window.lazytasksWhiteboard && (projectNavbar && projectNavbar.whiteboard) && hasPermission(loggedInUser && loggedInUser.llc_permissions, 
            ['whiteboard-access', 'whiteboard-manage', 'whiteboard-comments', 'edit-whiteboard-comments', 'delete-whiteboard-comments', 'create-edit-whiteboard-page', 'delete-whiteboard-page'])) {
            window.lazytasksWhiteboard.whiteboardTabButton(id);
        }
    });

    useEffect(() => {
        if (window.lazytasksWhiteboard && (projectNavbar && projectNavbar.whiteboard) && hasPermission(loggedInUser && loggedInUser.llc_permissions, 
            ['whiteboard-access', 'whiteboard-manage', 'whiteboard-comments', 'edit-whiteboard-comments', 'delete-whiteboard-comments', 'create-edit-whiteboard-page', 'delete-whiteboard-page'])) {
            window.lazytasksWhiteboard.whiteboardTabButton(id);
        }
    }, [location, projectNavbar, id]);

    const [expandedItems, setExpandedItems] = useState([]);
    const [accordionItems, setAccordionItems] = useState([]);

    const handleAddSection = () => {
        setIsAddingSection(true);
        const newItemValue = `untitle-section-${accordionItems.length + 1}`;
        const newItem = {
            value: newItemValue,
            title: `Type section name here`,
        };
        setAccordionItems([...accordionItems, newItem]);
        setExpandedItems([...expandedItems, newItemValue]);

        const newSection = {
            name: 'Type section name here',
            project_id: projectInfo.id,
            sort_order: ordered.length + 1,
            created_by: loggedInUser ? loggedInUser.loggedUserId : loggedUserId
        }

        dispatch(createTaskSection(newSection))
            .then(() => {
                setIsAddingSection(false);
            })
            .catch(() => {
                setIsAddingSection(false);
            });
        dispatch(updateInputFieldFocus(true));
    };

    useEffect(() => {
        if (tasks && taskListSections) {
            const transformedItems = Object.entries(taskListSections).map(([key, value]) => ({
                value: key,
                title: value.name,
            })
            );
            setAccordionItems(transformedItems);
            // Set all accordion items as expanded
            setExpandedItems(transformedItems.map(item => item.value));
        }

    }, [taskListSections, ordered]);

    const handleExpandCollapseSections = () => {
        if (expandedItems.length === accordionItems.length) {
            // Collapse all
            setExpandedItems([]);
            dispatch(updateExpandedItems([]));
        } else {
            // Expand all
            setExpandedItems(accordionItems.map(item => item.value));
            dispatch(updateExpandedItems(accordionItems.map((item) => item.value)));
        }

    }

    const activePaths = [
        listPagePathName,
        listPageGroupByPriorityPathName,
        listPageGroupByStatusPathName,
        listPageGroupByMemberPathName,
        listPageGroupByDueDatePathName,
    ];

    const isActive = activePaths.includes(location.pathname);

    const [defaultSelectValue, setDefaultSelectValue] = useState('section');
    useEffect(() => {
        switch (location.pathname) {
            case listPagePathName:
                setDefaultSelectValue('section');
                break;
            case listPageGroupByPriorityPathName:
                setDefaultSelectValue('priority');
                break;
            case listPageGroupByStatusPathName:
                setDefaultSelectValue('status');
                break;
            case listPageGroupByMemberPathName:
                setDefaultSelectValue('member');
                break;
            case listPageGroupByDueDatePathName:
                setDefaultSelectValue('duedate');
                break;
            default:
                setDefaultSelectValue(null);
        }
    }, [location.pathname]);

    const handleGroupBy = (value) => {
        switch (value) {
            case 'section':
                navigate(`/project/task/list/${id}`);
                break;
            case 'priority':
                navigate(`/project/task/list/by/priority/${id}`);
                break;
            case 'status':
                navigate(`/project/task/list/by/status/${id}`);
                break;
            case 'member':
                navigate(`/project/task/list/by/member/${id}`);
                break;
            case 'duedate':
                navigate(`/project/task/list/by/duedate/${id}`);
                break;
        }
    };

    const menuPermissions = [
        ['configure-project-tabs', 'add-remove-priority', 'add-remove-status'],
        ['project-archive-unarchive'],
        ['view-archived-tasks']
    ];

    const userHasAnyPermission = menuPermissions.some((perm) =>
        hasPermission(loggedInUser?.llc_permissions, perm)
    );

    return (
        <>
            <Grid className='mt-2 mb-3'>
                <Grid.Col span={9}>
                    <Breadcrumbs separator={<IconChevronRight size={20} stroke={1.25} />} separatorMargin="xs">
                        <Title order={4}>
                            {projectInfo && projectInfo.parent && projectInfo.parent.name}
                        </Title>
                        <Popover width={300} position="bottom-start" withArrow shadow="md" zIndex={1000}
                            opened={projectPopoverOpened}
                            onChange={setProjectPopoverOpened}
                        >
                            <Popover.Target>
                                <Flex className={`min-w-[200px] !justify-between border px-2 py-1 rounded-md cursor-pointer`}
                                    gap="md"
                                    justify={"space-between"}
                                    align="center"
                                    onClick={() => setProjectPopoverOpened((o) => !o)}
                                >
                                    <Title order={4}>
                                        {projectInfo && projectInfo.name}

                                    </Title>
                                    <IconCaretDownFilled size={20} />
                                </Flex>
                            </Popover.Target>
                            <Popover.Dropdown>
                                <ScrollArea h={scrollAreaHeight} offsetScrollbars scrollbarSize={4}>

                                    {projectInfo && projectInfo.parent && projectInfo.parent.projects && projectInfo.parent.projects.length > 0 && projectInfo.parent.projects.map((project, index) => (
                                        <Card key={`${project.id}-${index}`} className='mb-2 mt-0 cursor-pointer' shadow="sm" radius="sm"
                                            withBorder
                                            bg={location && (location.pathname === '/project/task/list/' + project.id ||
                                                location.pathname === '/project/task/board/' + project.id ||
                                                location.pathname === '/project/task/calendar/' + project.id) ? '#F5F9FB' : 'white'}
                                            onClick={() => goToTasksList(project.id)}
                                            style={{ borderColor: '#39758d' }}
                                        >
                                            <div className="flex justify-between items-center -mt-1">
                                                <Text size="sm" weight={700}>{project.name}</Text>
                                                <UsersAvatarGroup users={project.members} size={30} maxCount={2} />
                                            </div>

                                            <Group position="apart">
                                                <Flex align="center" gap="4">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" fill="none">
                                                        <circle cx="4" cy="4" r="4" fill="#F1975A" />
                                                    </svg>
                                                    <Text size="xs">{translate('%d users engaged').replace('%d', project.members && project.members.length)}</Text>
                                                </Flex>
                                                <Flex align="center" gap="4">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" fill="none">
                                                        <circle cx="4" cy="4" r="4" fill="#39758D" />
                                                    </svg>
                                                    <Text size="xs">{translate('%d task').replace('%d', project?.total_tasks)}</Text>
                                                </Flex>
                                            </Group>
                                        </Card>
                                    ))}

                                </ScrollArea>

                            </Popover.Dropdown>
                        </Popover>
                    </Breadcrumbs>
                </Grid.Col>
                <Grid.Col span={3}>

                    <Flex className={`cursor-pointer`} justify="flex-end" align="center" gap="xs">
                        <TextInput
                            ref={searchInputRef}
                            leftSection={<IconSearch size={22} stroke={1.5} className="text-gray-500" />}
                            value={searchInputValue}
                            rightSectionPointerEvents="auto"
                            rightSection={
                                searchInputValue && (
                                    <IconX
                                        size={24}
                                        stroke={1.5}
                                        className="cursor-pointer text-gray-500"
                                        onClick={handleClearSearch}
                                    />
                                )
                            }
                            style={{ width: '255px' }}
                            onChange={(e) => { searchHandler(e) }}
                            placeholder={translate("Search...")} />

                        <ShortcutPopover />
                        {userHasAnyPermission && (
                            <Menu shadow="lg" width={200} position="bottom-end" withArrow zIndex={30}>
                                <Menu.Target>
                                    <ActionIcon variant="filled" color="#EBF1F4" size={36} aria-label="Settings">
                                        <IconSettings size={24} stroke={1.5} color='#4D4D4D' />
                                    </ActionIcon>
                                </Menu.Target>

                                <Menu.Dropdown>
                                    {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['configure-project-tabs', 'add-remove-priority', 'add-remove-status']) && (
                                        <Menu.Item
                                            leftSection={<IconSettings2 size={18} stroke={1.5} />}
                                            onClick={() => setProjectSettingsModalOpen(true)}
                                        >
                                            {translate('Project Settings')}
                                        </Menu.Item>
                                    )}
                                    {/* {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['edit-project']) && (
                                            <Menu.Item
                                                leftSection={<IconSettings2 size={18} stroke={1.5} />}
                                                onClick={() => setProjectNavConfigureModalOpen(true)}
                                            >
                                                {translate('Configure Tabs')}
                                            </Menu.Item>
                                        )} */}
                                    <>
                                        {expandedItems.length === accordionItems.length ? (
                                            <Menu.Item
                                                leftSection={<IconLayoutNavbarCollapse size={18} stroke={1.5} />}
                                                onClick={handleExpandCollapseSections}
                                            >
                                                {translate('Collapse Sections')}
                                            </Menu.Item>
                                        ) : (
                                            <Menu.Item
                                                leftSection={<IconLayoutNavbarExpand size={18} stroke={1.5} />}
                                                onClick={handleExpandCollapseSections}
                                            >
                                                {translate('Expand Sections')}
                                            </Menu.Item>
                                        )}
                                    </>
                                    {hasPermission(loggedInUser?.llc_permissions, ['project-archive-unarchive']) && projectInfo && (
                                        <>
                                            {projectInfo.status_name === 'active' && (
                                                <Menu.Item
                                                    leftSection={<IconArchive size={18} stroke={1.5} />}
                                                    onClick={handleArchiveProject}
                                                >
                                                    {translate('Archive Project')}
                                                </Menu.Item>
                                            )}

                                            {projectInfo.status_name === 'archived' && (
                                                <Menu.Item
                                                    leftSection={<IconArchiveOff size={18} stroke={1.5} />}
                                                    onClick={handleUnarchiveProject}
                                                >
                                                    {translate('Unarchive Project')}
                                                </Menu.Item>
                                            )}
                                        </>
                                    )}
                                    {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['view-archived-tasks']) && (
                                        <Menu.Item
                                            leftSection={<IconArchiveFilled size={18} stroke={1.5} />}
                                            onClick={settingDrawerOpen}
                                        >
                                            {translate('View Archive Tasks/Sections')}
                                        </Menu.Item>
                                    )}
                                </Menu.Dropdown>
                            </Menu>
                        )}
                    </Flex>
                </Grid.Col>
            </Grid>


            <div className="relative flex justify-between items-center">
                <div className="relative flex mb-3 space-x-3">

                    {projectNavbar && projectNavbar.list && (
                        <Button
                            className="nav-link" activeClassName="active-link"
                            onClick={() => handleViewSwitch('list')}
                            size="sm"
                            color={isActive ? "#39758D" : "#EBF1F4"}
                            styles={{
                                label: {
                                    color: isActive ? "#fff" : "#000"
                                }
                            }}
                        >
                            {translate("List")}
                        </Button>
                    )}

                    {projectNavbar && projectNavbar.board && (
                        <Button
                            onClick={() => handleViewSwitch('board')}
                            className="nav-link" activeClassName="active-link"
                            size="sm"
                            color={location.pathname === boardPagePathName ? "#39758D" : "#EBF1F4"}
                            styles={{
                                label: {
                                    color: location.pathname === boardPagePathName ? "#fff" : "#000"
                                }
                            }}
                        >
                            {translate("Board")}
                        </Button>
                    )}

                    {projectNavbar && projectNavbar.calendar && (
                        <Button
                            onClick={() => handleViewSwitch('calendar')}
                            className="nav-link" activeClassName="active-link"
                            size="sm"
                            color={location.pathname === calendarPagePathName ? "#39758D" : "#EBF1F4"}
                            styles={{
                                label: {
                                    color: location.pathname === calendarPagePathName ? "#fff" : "#000"
                                }
                            }}
                        >
                            {translate("Calendar")}
                        </Button>
                    )}

                    {!window?.appLocalizer?.whiteboardInstalled && projectNavbar && projectNavbar.whiteboard && (
                        <Tooltip withinPortal={false} className="!py-0 !text-[10px] !z-10" label={translate("Addons")} opened position="top" offset={{ mainAxis: -8, crossAxis: 20 }} color={"#ED7D31"} size="xs"
                            onClick={() => setAddonModalOpened(true)}
                        >
                            <Button
                                onClick={() => setAddonModalOpened(true)}
                                className="!text-sm" activeClassName="active-link" size="sm" color={"#EBF1F4"} styles={{ label: { color: "#c2c2c2" } }}>
                                {translate("Whiteboard")}
                            </Button>
                        </Tooltip>
                    )}
                    <AddonInstallationModal opened={addonModalOpened} onClose={() => setAddonModalOpened(false)} />

                    {(projectNavbar && projectNavbar.whiteboard) && (whiteboardAddonState && whiteboardAddonState == 'installed_active') && hasPermission(
                        loggedInUser && loggedInUser.llc_permissions,
                        ['whiteboard-access', 'whiteboard-manage', 'whiteboard-comments', 'edit-whiteboard-comments', 'delete-whiteboard-comments',
                            'create-edit-whiteboard-page', 'delete-whiteboard-page'
                        ]
                    )
                        && (
                            <div id="lazytasks_whiteboard_tab_button">
                                {/* for whiteboard */}
                            </div>
                        )
                    }

                    {/*<Button className="!text-sm" size="sm" color={"#EBF1F4"} styles={{ label: { color: "#c2c2c2" } }}>
                            Gantt chart
                        </Button>*/}
                    {projectNavbar && projectNavbar.gantt && (
                        <Tooltip withinPortal={false} className="!py-0 !text-[10px] !z-10" label={translate("Alpha Release")} opened position="top" offset={-8} color="red" size="xs">
                            <Button
                                onClick={() => handleViewSwitch('gantt')}
                                className="!text-sm"
                                activeClassName="active-link"
                                size="sm"
                                color={location.pathname === ganttChartPagePathName ? "#39758D" : "#EBF1F4"}
                                styles={{
                                    label: {
                                        color: location.pathname === ganttChartPagePathName ? "#fff" : "#000"
                                    }
                                }}
                            >
                                {translate("Gantt chart")}
                            </Button>
                        </Tooltip>
                    )}
                    {projectNavbar && projectNavbar.swimlane && (
                        <Tooltip withinPortal={false} className="!py-0 !text-[10px] !z-10" label={translate("Coming Soon")} opened position="top" offset={-8} color={"#ED7D31"} size="xs">
                            <Button className="!text-sm" activeClassName="active-link" size="sm" color={"#EBF1F4"} styles={{ label: { color: "#c2c2c2" } }} disabled>
                                {translate("Swimlane")}
                            </Button>
                        </Tooltip>
                    )}

                </div>

                <div className="relative filterandusers flex items-center gap-2.5 mb-3">
                    {location && location.pathname === ganttChartPagePathName &&
                        <Select
                            style={{ maxWidth: '100px' }}
                            size="xs"
                            defaultValue={ganttViewMode}
                            data={[translate('Day'), translate('Week'), translate('Month')]}
                            onChange={(value) => handleGanttViewMode(value)}
                            allowDeselect={false}
                        />
                    }
                    <Tooltip withinPortal={false} label={translate('Refresh')} position="top" withArrow>
                        <ActionIcon onClick={() => handleRefresh()} variant="outline" size={36} color="#ED7D31" radius="xl" aria-label="Refresh">
                            <IconRefresh size={24} stroke={1.5} />
                        </ActionIcon>
                    </Tooltip>

                    {isActive && (
                        <Menu shadow="md" width={200} arrowPosition="center" position="bottom-center" withArrow>
                            <Menu.Target>
                                <Tooltip withinPortal={false} label={translate('Group By')} position="top" withArrow>
                                    <ActionIcon variant="light" size={36} radius="xl" color="#39758D" aria-label="Filter">
                                        <IconAdjustmentsHorizontal size={24} stroke={1.5} color='#4D4D4D' />
                                    </ActionIcon>
                                </Tooltip>
                            </Menu.Target>

                            <Menu.Dropdown>
                                <Menu.Label>{translate('Group By')}</Menu.Label>
                                <Menu.Divider />
                                <Menu.Item
                                    rightSection={
                                        defaultSelectValue === 'section' ? <IconCheck size={18} stroke={1.5} /> : null
                                    }
                                    onClick={() => handleGroupBy('section')}
                                    data-selected={defaultSelectValue === 'section' || undefined}
                                >
                                    {translate('Section')}
                                </Menu.Item>
                                <Menu.Item
                                    rightSection={
                                        defaultSelectValue === 'priority' ? <IconCheck size={18} stroke={1.5} /> : null
                                    }
                                    onClick={() => handleGroupBy('priority')}
                                    data-selected={defaultSelectValue === 'priority' || undefined}
                                >
                                    {translate('Priority')}
                                </Menu.Item>
                                <Menu.Item
                                    rightSection={
                                        defaultSelectValue === 'status' ? <IconCheck size={18} stroke={1.5} /> : null
                                    }
                                    onClick={() => handleGroupBy('status')}
                                    data-selected={defaultSelectValue === 'status' || undefined}
                                >
                                    {translate('Status')}
                                </Menu.Item>
                                <Menu.Item
                                    rightSection={
                                        defaultSelectValue === 'member' ? <IconCheck size={18} stroke={1.5} /> : null
                                    }
                                    onClick={() => handleGroupBy('member')}
                                    data-selected={defaultSelectValue === 'member' || undefined}
                                >
                                    {translate('Assigned To')}
                                </Menu.Item>
                                <Menu.Item
                                    rightSection={
                                        defaultSelectValue === 'duedate' ? <IconCheck size={18} stroke={1.5} /> : null
                                    }
                                    onClick={() => handleGroupBy('duedate')}
                                    data-selected={defaultSelectValue === 'duedate' || undefined}
                                >
                                    {translate('Due Date')}
                                </Menu.Item>
                            </Menu.Dropdown>
                        </Menu>
                    )}

                    <Tooltip withinPortal={false} label={translate('Filter Tasks')} position="top" withArrow>
                        <ActionIcon onClick={() => filterDrawerOpen()} variant="light" size={36} radius="xl" color="#39758D" aria-label="Filter">
                            <IconFilter size={24} stroke={1.5} color='#4D4D4D' />
                        </ActionIcon>
                    </Tooltip>
                    {location && (location.pathname === listPagePathName || location.pathname === boardPagePathName) &&
                        <Tooltip withinPortal={false} label={translate('Add Section')} position="top" withArrow>
                            <ActionIcon onClick={() => handleAddSection()} variant="light" size={36} radius="xl" color="#ED7D31" aria-label="Section"
                                loading={isAddingSection}
                                disabled={isAddingSection}
                                loaderProps={{ type: 'dots' }}
                            >
                                <IconCodeVariablePlus size={24} stroke={1.5} />
                            </ActionIcon>
                        </Tooltip>
                    }

                    <div className="flex gap-1">
                        <MemberAddRemovePopover
                            isOpened={isOpenedMemberPopover}
                            setIsOpened={setIsOpenedMemberPopover}
                        />
                    </div>

                </div>
            </div>

            <div className="drawer mt-[16]">

                <Drawer
                    opened={settingDrawerOpened}
                    onClose={settingDrawerClose}
                    position="right"
                    withCloseButton={false}
                    size="lg"
                    overlayProps={{ backgroundOpacity: 0, blur: 0 }}
                    zIndex={1000}
                    styles={{
                        inner: {
                            transform: appLocalizer?.is_admin ? 'translateX(0px)' : 'translateX(0px)',
                        }
                    }}
                >
                    <Drawer.Body>
                        <div className='workspace-create-card w-full'>
                            <div className="relative flex justify-between mb-4">
                                <Title order={4}>
                                    {translate('Archived Items')}
                                </Title>
                                <Drawer.CloseButton className="mr-4" />
                            </div>
                            <div className='border-t border-gray-400 w-[calc(100%+4rem)] -ml-8 pt-4 px-4' style={{ borderColor: '#EBF1F4' }}></div>

                            <ViewArchive onCloseDrawer={settingDrawerClose} />

                        </div>
                    </Drawer.Body>
                </Drawer>

            </div>

            <div className="drawer mt-[16]">
                <Drawer
                    opened={filterDrawerOpened}
                    onClose={filterDrawerClose}
                    position="right"
                    withCloseButton={false}
                    size="lg"
                    overlayProps={{ backgroundOpacity: 0, blur: 0 }}
                    withinPortal={false}
                    zIndex={9999}
                    styles={{
                        inner: {
                            transform: appLocalizer?.is_admin ? 'translateX(-160px)' : 'translateX(0px)',
                        }
                    }}
                    keepMounted
                >
                    {filterDrawerOpened &&
                        <Drawer.Body>
                            <div className='workspace-create-card w-full'>
                                <div className="relative flex justify-between mb-4">
                                    <Title order={4}>
                                        {translate('Filter Tasks')}
                                    </Title>
                                    <Drawer.CloseButton className="mr-4" />
                                </div>
                                <div className='border-t border-gray-400 w-[calc(100%+4rem)] -ml-8 pt-4 px-4' style={{ borderColor: '#EBF1F4' }}></div>

                                <FilterTasks project_id={id} reloadSections={reloadSections} />

                            </div>
                        </Drawer.Body>
                    }
                </Drawer>
            </div>

            <ProjectConfigureModal project_id={id} opened={projectNavConfigureModalOpen} onClose={() => setProjectNavConfigureModalOpen(false)} />
            <ProjectSettingsModal project_id={id} opened={projectSettingsModalOpen} onClose={() => setProjectSettingsModalOpen(false)} />

        </>

    );
}

export default ProjectDetailsNav;
