import React, { useRef, useEffect, useState } from 'react';
import {
    Card,
    Group,
    Text,
    ScrollArea,
    Stack,
    Modal,
    Button,
    Grid,
    Box,
    Avatar, Pill,
    Flex, TextInput, LoadingOverlay,
    Badge,
    Title,
    ThemeIcon,
    Divider,
    Overlay
} from '@mantine/core';
import { modals } from "@mantine/modals";
import { useDisclosure } from '@mantine/hooks';
import { IconTrash, IconPlus, IconSearch, IconX, IconPencil, IconArchive } from '@tabler/icons-react';
import UsersAvatarGroup from "../ui/UsersAvatarGroup";
import UserAvatarSingle from "../ui/UserAvatarSingle";
import { useSelector, useDispatch } from 'react-redux';
import { createCompany, editCompany, fetchAllCompanies } from "../Settings/store/companySlice";
import { createProject, editProject, fetchAllProjects } from "../Settings/store/projectSlice";
import { createUser, editUser, editUserRole, fetchAllMembers, updateIsLoading, fetchUser, openProfileDrawer } from "../../store/auth/userSlice";
import { fetchAllRoles } from "../../store/auth/roleSlice";
import { fetchTasksByProject, updateBoardMembers, fetchProjectOverview, unarchiveProject } from "../Settings/store/taskSlice";
import { showNotification, updateNotification } from "@mantine/notifications";
import DeleteProjectModal from '../Elements/Modal/Project/DeleteProject';
import EditProjectModal from '../Elements/Modal/Project/EditProjectModal';
import DeleteWorkspaceModal from '../Elements/Modal/Workspace/DeleteWorkspace';
import EditWorkspaceModal from '../Elements/Modal/Workspace/EditWorkspaceModal';
import MemberEditDrawer from "../../components/Profile/MemberEditDrawer";
import { hasPermission } from "../ui/permissions";
import { translate } from '../../utils/i18n';
import ProjectConfigureModal from '../Elements/Project/ProjectConfigureModal';
import ProjectSettingsButton from '../Elements/Button/ProjectSettingsButton';
import ProjectUnarchiveButton from '../Elements/Button/ProjectUnarchiveButton';



const SectionCard = ({ title, onAdd, children }) => (
    <Card p="lg" radius="md" withBorder>
        <Group position="apart" mb="sm">
            <Text weight={600}>{title}</Text>
        </Group>
        <Stack spacing="sm">{children}</Stack>
    </Card>
);

const SettingsPanel = () => {
    const dispatch = useDispatch();
    const { loggedInUser } = useSelector((state) => state.auth.session);
    const { loggedUserId } = useSelector((state) => state.auth.user);
    const { roles } = useSelector((state) => state.auth.role);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        dispatch(fetchAllCompanies());
        dispatch(fetchAllMembers()).then(() => {
            setIsLoading(false);
        });
    }, [dispatch]);

    const { companies } = useSelector((state) => state.settings.company);
    const { projects } = useSelector((state) => state.settings.project);
    const { allMembers } = useSelector((state) => state.auth.user);

    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(null);
    const [selectedProjectId, setSelectedProjectId] = useState(null);

    const selectedProject = projects.find(project => project.id === selectedProjectId) || {};
    const projectMembers = selectedProject?.members || [];
    const invitedMembers = selectedProject?.invitedMembers || [];

    const [projectCreateModalOpen, { open: openProjectCreateModal, close: closeProjectCreateModal }] = useDisclosure(false);
    const [isEmailValid, setIsEmailValid] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [searchValue, setSearchValue] = useState('');
    const [workspaceName, setWorkspaceName] = useState('');
    const [workspaceError, setWorkspaceError] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [projectError, setProjectError] = useState(false);
    const selectedCompany = companies.find(company => company.id === selectedWorkspaceId);
    const selectedCompanyName = selectedCompany ? selectedCompany.name : '';

    const selectedProjectName = selectedProject ? selectedProject.name : '';

    const [workspaceCreateModalOpen, { open: openWorkspaceCreateModal, close: closeWorkspaceCreateModal }] = useDisclosure(false);
    const workspaceInputRef = useRef(null);
    const projectInputRef = useRef(null);
    const [addMemberModalOpen, { open, close }] = useDisclosure(false);
    const [isInviteClose, setIsInviteClose] = useState(false);
    const [inviteLoading, setInviteLoading] = useState(false);

    const [isEditWorkspace, setIsEditWorkspace] = useState(false);
    const [editingWorkspace, setEditingWorkspace] = useState(null);

    const [projectMemberData, setProjectMemberData] = useState([]);
    const [projectNavConfigureModalOpen, setProjectNavConfigureModalOpen] = useState(false);
    const [projectId, setProjectId] = useState(null);

    useEffect(() => {
        if (selectedProject?.members) {
            setProjectMemberData(selectedProject.members);
        }
    }, [selectedProject]);

    const validateEmail = (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    const filteredMembers = allMembers && allMembers.length > 0 && allMembers.filter(
        (member) =>
            member.name.toLowerCase().includes(searchValue.toLowerCase()) ||
            member.email.toLowerCase().includes(searchValue.toLowerCase())
    );

    const handleSearchInputChange = (e) => {
        const inputValue = e.target.value;
        setSearchValue(inputValue);
        // setIsEmailValid(validateEmail(inputValue));
    };

    const handleInviteInputChange = (e) => {
        const inputValue = e.target.value;
        setInviteEmail(inputValue);
        setIsEmailValid(validateEmail(inputValue));
    };
    const [addedMembers, setAddedMembers] = useState([]);
    const [currentMemberData, setCurrentMemberData] = useState([]);
    const { tasks } = useSelector((state) => state.settings.task);
    const [localRoleUpdates, setLocalRoleUpdates] = useState({});

    const handleDeleteCurrentMember = (id) => {

        const isMemberAssignedToTask = tasks && tasks.allTasks && Object.values(tasks.allTasks).length > 0 && Object.values(tasks.allTasks).some((task) => task.assignedTo_id === id.toString());
        const isMemberAssignedToSubTask = tasks && tasks.allTasks && Object.values(tasks.allTasks).length > 0 && Object.values(tasks.allTasks).some((task) => task.children && task.children.length > 0 && task.children.some((subtask) => subtask.assignedTo_id === id.toString()));

        if (isMemberAssignedToTask || isMemberAssignedToSubTask) {
            modals.open({
                withCloseButton: false,
                centered: true,
                children: (
                    <Box>
                        <Text size="sm">
                            This member is assigned to a task. Please reassign the task before removing the member.
                        </Text>

                        <div className="!grid w-full !justify-items-center">
                            <Button justify="center" onClick={() => modals.closeAll()} mt="md">
                                Ok
                            </Button>
                        </div>
                    </Box>
                ),
            });

        } else {

            const updatedCurrentMembers = currentMemberData.filter((member) => member.id !== id);

            setCurrentMemberData(updatedCurrentMembers);

            setAddedMembers((prevMembers) => prevMembers.filter((memberId) => memberId !== id));
        }

    };
    const handleButtonClick = (clickedMember) => {
        // Check if the member is not already in the current list
        if (!addedMembers.includes(clickedMember.id)) {
            // Add the clickedMember to the currentMemberData state with updated status
            const updatedClickedMember = { ...clickedMember, status: 'Added' };
            setCurrentMemberData((prevData) => [...prevData, updatedClickedMember]);
            // Update the state to indicate that the member has been added
            setAddedMembers((prevMembers) => [...prevMembers, clickedMember.id]);
        }
    };
    const handleWorkspaceName = (e) => {
        setWorkspaceName(e.currentTarget.value);
        if (e.currentTarget.value === '') {
            setWorkspaceError(true);
        } else {
            setWorkspaceError(false);
        }
    }
    const handleProjectName = (e) => {
        setProjectName(e.currentTarget.value);
        if (e.currentTarget.value === '') {
            setProjectError(true);
        } else {
            setProjectError(false);
        }
    }

    useEffect(() => {
        if (companies?.length > 0 && selectedWorkspaceId === null) {
            setSelectedWorkspaceId(companies[0].id);
        }
    }, [companies, selectedWorkspaceId]);

    useEffect(() => {
        const workspaceProjects = projects?.filter(
            (project) => project.company_id === selectedWorkspaceId
        );

        if (selectedWorkspaceId && (!selectedProjectId || !workspaceProjects.find(p => p.id === selectedProjectId))) {
            setSelectedProjectId(workspaceProjects[0]?.id || null);
        }

    }, [selectedWorkspaceId, projects, selectedProjectId]);

    useEffect(() => {
        // if (projectCreateModalOpen === false) {
        //     handleProjectCreation();
        // }
        if (projectCreateModalOpen) {
            setTimeout(() => {
                projectInputRef.current?.focus();
            }, 100);
        }
    }, [projectCreateModalOpen]);

    // useEffect(() => {
    //     if (addMemberModalOpen === false && !isInviteClose) {
    //         handleAddMemberToProject();
    //     }
    //     // Reset the flag when modal is closed
    //     if (addMemberModalOpen === false) {
    //         setIsInviteClose(false);
    //     }
    // }, [addMemberModalOpen]);

    useEffect(() => {
        if (selectedProjectId) {
            dispatch(fetchTasksByProject({ id: selectedProjectId }));
        }
    }, [selectedProjectId, dispatch]);

    useEffect(() => {
        if (workspaceCreateModalOpen === false) {
            handleWorkspaceCreation();
        }
        if (workspaceCreateModalOpen) {
            setTimeout(() => {
                workspaceInputRef.current?.focus();
            }, 100);
        }
    }, [workspaceCreateModalOpen]);

    const handleProjectCreation = () => {
        const newProject = {
            name: projectName,
            members: currentMemberData,
            company_id: selectedWorkspaceId,
            created_by: loggedInUser,
        };
        if (newProject.name !== '') {
            dispatch(createProject(newProject)).then((response) => {
                if (response.payload && response.payload.status && response.payload.status === 200) {
                    showNotification({
                        id: 'load-data',
                        loading: true,
                        title: 'Project',
                        message: response.payload && response.payload.message && response.payload.message,
                        autoClose: 2000,
                        disallowClose: true,
                        color: 'green',
                    });
                    dispatch(fetchAllCompanies());
                    setProjectName('');
                    closeProjectCreateModal();
                }
                if (response.payload && response.payload.status && response.payload.status !== 200) {
                    showNotification({
                        id: 'load-data',
                        loading: true,
                        title: 'Project',
                        message: response.payload && response.payload.message && response.payload.message,
                        autoClose: 2000,
                        disallowClose: true,
                        color: 'red',
                    });
                }
            }
            );
        }
        setProjectName('');
        setCurrentMemberData([]);
        setAddedMembers([]);
    };

    const isEmailAlreadyInvited = (email) => {
        return invitedMembers && invitedMembers.some(member =>
            member.email.toLowerCase() === email.toLowerCase()
        );
    };

    const handleSendInvite = (email) => {
        setInviteLoading(true);
        const values = {
            email,
            loggedInUserId: loggedInUser ? loggedInUser.id : loggedUserId
        };

        dispatch(createUser(values)).then((response) => {
            if (response.payload?.status === 200) {
                // console.log(projectMemberData);
                // const updated = [...projectMemberData, response.payload.data];
                // console.log(updated);
                const updatedMembers = [
                    ...projectMemberData,
                    ...(selectedProject?.invitedMembers || []).filter(
                        invited => !projectMemberData.some(project => project.id === invited.id)
                    ),
                    response.payload.data
                ];

                if (selectedProjectId) {
                    dispatch(editProject({
                        id: selectedProjectId,
                        data: {
                            members: updatedMembers,
                            updated_by: loggedInUser ? loggedInUser.id : loggedUserId
                        }
                    })).then((res) => {
                        if (res.payload?.status === 200) {
                            // Important: use latest members from server, not local assumption
                            dispatch(updateBoardMembers(res.payload.data?.members || []));
                            dispatch(fetchAllMembers()).then(() => {
                                dispatch(fetchAllCompanies()).then(() => {
                                    const updatedProject = projects.find(p => p.id === selectedProjectId);
                                    if (updatedProject) {
                                        setProjectMemberData(updatedProject.members || []);
                                        setCurrentMemberData(updatedProject.members || []);
                                    }
                                });
                            });
                            setInviteEmail('');
                            setIsEmailValid(false);
                            setIsInviteClose(true);
                            closeAddMemberModal();
                            // Update projectMemberData state if needed
                            // setProjectMemberData(res.payload.data?.members || []);
                        }
                    });
                }

                showNotification({
                    id: 'load-data',
                    loading: false,
                    title: 'User',
                    message: response.payload.message || 'User invited successfully',
                    autoClose: 2000,
                    disallowClose: true,
                    color: 'green',
                });
            }
        }).catch(error => {
            console.error('Invite Error:', error);
            showNotification({
                id: 'load-data-error',
                title: 'Error',
                message: 'Failed to invite user.',
                autoClose: 2000,
                disallowClose: true,
                color: 'red',
            });
        }).finally(() => {
            setInviteLoading(false);
        });
    };


    const openAddMemberModal = () => {
        if (selectedProject) {
            const initialMemberIds = selectedProject.members?.map(member => member.id) || [];
            setCurrentMemberData(selectedProject.members || []);
            setAddedMembers(initialMemberIds);
        } else {
            setCurrentMemberData([]);
        }
        open(true);
    };

    const closeAddMemberModal = () => {
        close();
    };

    const handleAddMemberToProject = () => {
        if (currentMemberData && currentMemberData.length > 0) {
            const updatedMembers = [
                ...currentMemberData,
                ...(selectedProject?.invitedMembers || []).filter(
                    invited => !currentMemberData.some(current => current.id === invited.id)
                )
            ];
            dispatch(editProject({ id: selectedProjectId, data: { 'members': updatedMembers, 'updated_by': loggedInUser } })).then((response) => {
                if (response.payload && response.payload.status && response.payload.status === 200) {
                    showNotification({
                        id: 'load-data',
                        loading: true,
                        title: 'User',
                        message: response.payload && response.payload.message && response.payload.message,
                        autoClose: 2000,
                        disallowClose: true,
                        color: 'green',
                    });
                    // dispatch(fetchAllCompanies());
                    dispatch(fetchAllCompanies()).then(() => {
                        const updatedProject = projects.find(p => p.id === selectedProjectId);
                        if (updatedProject) {
                            setProjectMemberData(updatedProject.members || []);
                        }
                    });
                    closeAddMemberModal();
                    setCurrentMemberData([]);
                    setAddedMembers([]);
                }
            });

        }
    };

    const confirmRemoveMember = (member) => {
        modals.openConfirmModal({
            title: `Remove ${member.name}?`,
            centered: true,
            children: (
                <Text size="sm">
                    Are you sure you want to remove <strong>{member.name}</strong> from this project? This action cannot be undone.
                </Text>
            ),
            labels: { confirm: 'Remove', cancel: "Cancel" },
            confirmProps: { color: 'red' },
            onConfirm: () => handleRemoveMember(member.id),
        });
    };

    const handleRemoveMember = (id) => {
        const isMemberAssignedToTask = tasks && tasks.allTasks && Object.values(tasks.allTasks).length > 0 && Object.values(tasks.allTasks).some((task) => task.assignedTo_id === id.toString());
        const isMemberAssignedToSubTask = tasks && tasks.allTasks && Object.values(tasks.allTasks).length > 0 && Object.values(tasks.allTasks).some((task) => task.children && task.children.length > 0 && task.children.some((subtask) => subtask.assignedTo_id === id.toString()));

        if (isMemberAssignedToTask || isMemberAssignedToSubTask) {
            modals.open({
                withCloseButton: false,
                centered: true,
                children: (
                    <Box>
                        <Text size="sm">
                            This member is assigned to a task. Please reassign the task before removing the member.
                        </Text>

                        <div className="!grid w-full !justify-items-center">
                            <Button justify="center" onClick={() => modals.closeAll()} mt="md">
                                Ok
                            </Button>
                        </div>
                    </Box>
                ),
            });

        } else {

            const updatedMembers = projectMemberData.filter(member => member.id !== id);
            setProjectMemberData(updatedMembers);

            dispatch(editProject({
                id: selectedProjectId,
                data: {
                    members: updatedMembers,
                    deleted_member_id: id,
                    updated_by: loggedInUser
                }
            })).then((response) => {
                if (response.payload?.status === 200) {
                    showNotification({
                        id: 'load-data',
                        loading: true,
                        title: 'User',
                        message: response.payload?.message,
                        autoClose: 2000,
                        disallowClose: true,
                        color: 'green',
                    });
                    dispatch(fetchAllCompanies());
                }
            });
        }
    };

    const handleRoleChange = (user, newRoleId) => {
        const selectedRole = roles.find(role => role.id.toString() === newRoleId);
        if (selectedRole) {
            const roleObject = {
                id: selectedRole.id,
                name: selectedRole.name,
            };

            setLocalRoleUpdates(prev => ({
                ...prev,
                [user.id]: roleObject
            }));
            // Update local state
            const updatedMembers = projectMembers.map(member => {
                if (member.id === user.id) {
                    return {
                        ...member,
                        lazytasks_role: [roleObject]
                    };
                }
                return member;
            });
            setProjectMemberData(updatedMembers);

            dispatch(editUserRole({ id: user.id, data: { roles: JSON.stringify([roleObject]) } })).then((response) => {
                if (response.payload && response.payload.status && response.payload.status === 200) {
                    showNotification({
                        id: 'load-data',
                        loading: true,
                        title: 'User',
                        message: response.payload && response.payload.message && response.payload.message,
                        autoClose: 2000,
                        disallowClose: true,
                        color: 'green',
                    });
                    dispatch(fetchAllCompanies());
                }
                if (response.payload && response.payload.status && response.payload.status !== 200) {
                    showNotification({
                        id: 'load-data',
                        loading: true,
                        title: 'User',
                        message: response.payload && response.payload.message && response.payload.message,
                        autoClose: 2000,
                        disallowClose: true,
                        color: 'red',
                    });
                    setProjectMemberData(projectMembers);
                }
            });

        }
    };


    const handleWorkspaceCreation = () => {
        if (workspaceName) {
            if (isEditWorkspace && editingWorkspace) {
                if (workspaceName === editingWorkspace.name) {
                    closeWorkspaceCreateModal();
                    setIsEditWorkspace(false);
                    setEditingWorkspace(null);
                    return; // Skip dispatching editCompany
                }
                const editWorkspace = {
                    id: editingWorkspace.id,
                    data: {
                        name: workspaceName,
                        updated_by: loggedInUser
                    }
                };
                console.log(editingWorkspace, workspaceName);
                // return;
                // Edit mode
                dispatch(editCompany(editWorkspace)).then((response) => {
                    console.log(response);
                    if (response.payload && response.payload.status === 200) {
                        showNotification({
                            id: 'load-data',
                            loading: true,
                            title: 'Workspace',
                            message: response.payload.message,
                            autoClose: 2000,
                            disallowClose: true,
                            color: 'green',
                        });
                        setWorkspaceName('');
                        setIsEditWorkspace(false);
                        setEditingWorkspace(null);
                        dispatch(fetchAllCompanies());
                        closeWorkspaceCreateModal();
                    }
                });
            } else {
                const newWorkspace = {
                    name: workspaceName,
                    created_by: loggedInUser
                };
                dispatch(createCompany(newWorkspace)).then((response) => {
                    if (response.payload && response.payload.status && response.payload.status === 200) {
                        showNotification({
                            id: 'load-data',
                            loading: true,
                            title: 'Workspace',
                            message: response.payload && response.payload.message && response.payload.message,
                            autoClose: 2000,
                            disallowClose: true,
                            color: 'green',
                        });
                        setWorkspaceName('');
                        dispatch(fetchAllCompanies());
                        closeWorkspaceCreateModal();
                    }
                });
            }

        }
    }

    const handleProfileEditDrawer = (id) => {
        console.log(id);
        dispatch(fetchAllRoles());
        dispatch(updateIsLoading(true));

        dispatch(fetchUser(id)).then((response) => {
            if (response.payload && response.payload.status && response.payload.status === 200) {
                dispatch(openProfileDrawer());

                // set timeout to close the loading overlay
                setTimeout(() => {
                    dispatch(updateIsLoading(false));
                }, 500);
            }
        });
    }

    const handleEditWorkspace = (workspace) => {
        setIsEditWorkspace(true);
        setEditingWorkspace(workspace);
        setWorkspaceName(workspace.name);
        openWorkspaceCreateModal();
    };

    const handleOpenProjectSettings = (projectId) => {
        setProjectId(projectId);
        setProjectNavConfigureModalOpen(true);
        dispatch(fetchProjectOverview(projectId));
    };

    const handleUnarchiveProject = (id) => {
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
                            dispatch(fetchAllProjects());
                            setSelectedProjectId(id);
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

    return (
        <Box>
            <ScrollArea scrollbarSize={4} scrollbars="y"
                className={`w-full ${appLocalizer?.is_admin ? 'h-[calc(100vh-300px)]' : 'h-[calc(100vh-250px)]'}`}
            >
                <LoadingOverlay visible={isLoading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
                <Grid columns={24}>
                    <Grid.Col span={6}>

                        <SectionCard title={translate('Workspaces')}>
                            {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['create-workspace']) &&
                                <button
                                    className="relative w-full h-full min-h-[60px] rounded-lg border border-dashed bg-white flex-row items-center justify-center align-items-center text-center"
                                    style={{ borderColor: '#39758D' }} onClick={openWorkspaceCreateModal}
                                >
                                    <Flex justify="center" align="flex-start" gap="xs" wrap="nowrap">
                                        <IconPlus size={20} color="#39758D" />

                                        <Text ta="center" fz="md" fw={500} c="#39758D">
                                            {translate('Create Workspace')}
                                        </Text>
                                    </Flex>
                                </button>
                            }
                            <ScrollArea h={hasPermission(loggedInUser?.llc_permissions, ['create-workspace']) ? 515 : 592} scrollbarSize={2}>
                                {companies && companies.length > 0 && companies.map((item) => (

                                    <Card key={item.id} padding="lg" shadow="xs" className='mb-3' withBorder onClick={() => setSelectedWorkspaceId(item.id)}
                                        style={{ borderColor: selectedWorkspaceId === item.id ? '#39758d' : '#dee2e6', cursor: 'pointer', backgroundColor: selectedWorkspaceId === item.id ? '#F5F9FB' : 'white' }}
                                    >

                                        <Text size="lg" weight={900}>{item.name}</Text>
                                        <Flex align="center" justify="space-between">
                                            <Group>
                                                <Box className='flex items-center gap-1'>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" fill="none">
                                                        <circle cx="4" cy="4" r="4" fill="#F1975A" />
                                                    </svg>
                                                    <Text size="sm">
                                                        {translate('%d users engaged').replace('%d', item.members && item.members.length)}
                                                    </Text>
                                                </Box>
                                                <Box className='flex items-center gap-1'>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" fill="none">
                                                        <circle cx="4" cy="4" r="4" fill="#39758D" />
                                                    </svg>
                                                    <Text size="sm">
                                                        {translate('%d project').replace('%d', item.projects && item.projects.length)}
                                                    </Text>
                                                </Box>
                                            </Group>

                                            <Group spacing="sm">
                                                {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['edit-workspace']) &&
                                                    <Box
                                                        className='border border-dashed rounded-full p-2 group cursor-pointer'
                                                        style={{
                                                            borderColor: '#4D4D4D',
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.borderColor = '#ff9800';
                                                            e.currentTarget.querySelector('svg').style.color = '#ff9800';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.borderColor = '#4D4D4D';
                                                            e.currentTarget.querySelector('svg').style.color = '#4D4D4D';
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEditWorkspace(item);
                                                        }}
                                                    >
                                                        <IconPencil
                                                            size={20}
                                                            stroke={1.25}
                                                            style={{
                                                                transition: 'all 0.2s ease'
                                                            }}
                                                        />
                                                    </Box>
                                                }
                                                {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['delete-workspace']) &&
                                                    <DeleteWorkspaceModal {...item} />
                                                }
                                            </Group>
                                        </Flex>
                                    </Card>
                                ))}
                            </ScrollArea>

                        </SectionCard>
                    </Grid.Col>
                    <Grid.Col span={7}>
                        {/* Projects */}

                        <SectionCard title={translate('Projects')}>
                            {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['create-project']) &&
                                <button
                                    className="relative w-full h-full min-h-[60px] rounded-lg border border-dashed bg-white flex-row items-center justify-center align-items-center text-center"
                                    style={{ borderColor: '#39758D' }} onClick={openProjectCreateModal}
                                >
                                    <Flex justify="center" align="flex-start" gap="xs" wrap="nowrap">
                                        <IconPlus size={20} color="#39758D" />

                                        <Text ta="center" fz="md" fw={500} c="#39758D">
                                            {translate('Create Project')}
                                        </Text>
                                    </Flex>
                                </button>
                            }
                            <ScrollArea h={hasPermission(loggedInUser?.llc_permissions, ['create-project']) ? 515 : 592} scrollbarSize={2} offsetScrollbars={true}>
                                {projects && projects.length > 0 && projects.filter((project) => project.company_id === selectedWorkspaceId)
                                    .map((project, index) => (

                                        <Card key={index} padding="lg" shadow="xs" className='mb-3' withBorder onClick={() => setSelectedProjectId(project.id)}
                                            style={{
                                                borderColor: selectedProjectId === project.id ? '#39758d' : '#dee2e6',
                                                cursor: 'pointer',
                                                backgroundColor:
                                                    project.status == '2' // 2 means archived
                                                        ? '#F0F0F0' // always gray for archived
                                                        : selectedProjectId === project.id
                                                            ? '#F5F9FB' // highlight for active selected
                                                            : 'white', // default
                                            }}
                                        >
                                            {project.status == '2' && (
                                                <Badge
                                                    color="gray"
                                                    variant="filled"
                                                    radius="sm"
                                                    size="sm"
                                                    style={{
                                                        position: 'absolute',
                                                        top: '5px',
                                                        right: '5px',
                                                        zIndex: 10,
                                                        cursor: 'pointer'
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // prevent triggering card click
                                                        handleUnarchiveProject(project.id); // unarchive the project
                                                    }}
                                                >
                                                    {translate('Archived')}
                                                </Badge>
                                            )}

                                            <Text size="lg" weight={900}>{project.name}</Text>
                                            <Flex justify="space-between" align="center">
                                                <Group>
                                                    <Box className='flex items-center gap-1'>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" fill="none">
                                                            <circle cx="4" cy="4" r="4" fill="#F1975A" />
                                                        </svg>
                                                        <Text size="sm">
                                                            {translate('%d users engaged').replace('%d', project.members && project.members.length > 0 ? project.members.length : 0)}
                                                        </Text>
                                                    </Box>
                                                    <Box className='flex items-center gap-1'>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" fill="none">
                                                            <circle cx="4" cy="4" r="4" fill="#39758D" />
                                                        </svg>
                                                        <Text size="sm">
                                                            {translate('%d tasks').replace('%d', project.total_tasks && project.total_tasks > 0 ? project.total_tasks : 0)}
                                                        </Text>
                                                    </Box>
                                                </Group>

                                                <Group spacing="sm">

                                                    {project.status == '1' && hasPermission(loggedInUser && loggedInUser.llc_permissions, ['edit-project']) &&
                                                        <EditProjectModal projectData={{ id: project.id, name: project.name, members: project.members, parent: project.parent, invitedMembers: project.invitedMembers }} />
                                                    }
                                                    {project.status == '1' && hasPermission(loggedInUser && loggedInUser.llc_permissions, ['edit-project']) &&
                                                        <ProjectSettingsButton
                                                            onClick={() => handleOpenProjectSettings(project.id)}
                                                        />
                                                    }
                                                    {project.status == '2' && hasPermission(loggedInUser && loggedInUser.llc_permissions, ['edit-project']) &&
                                                        <ProjectUnarchiveButton
                                                            onClick={() => handleUnarchiveProject(project.id)}
                                                        />
                                                    }
                                                    {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['delete-project']) &&
                                                        <DeleteProjectModal {...project} />
                                                    }

                                                </Group>

                                            </Flex>
                                        </Card>
                                    ))}
                            </ScrollArea>

                        </SectionCard>
                    </Grid.Col>
                    <Grid.Col span={11}>
                        {/* Members */}

                        <SectionCard title={translate('Members')}>
                            {selectedProject && selectedProject?.status == '2' && (
                                <>
                                    <Overlay
                                        blur={2}
                                        opacity={0.7}
                                        color="#fff"
                                        zIndex={20}
                                    />
                                    <Box
                                        style={{
                                            position: 'absolute',
                                            top: '50%',
                                            left: '50%',
                                            transform: 'translate(-50%, -50%)',
                                            zIndex: 25, // Ensure it is above the overlay
                                            textAlign: 'center',
                                        }}
                                    >
                                        <Badge size="lg" leftSection={<IconArchive stroke={1.25} />} color="orange">{translate('This project is archived')}</Badge>
                                    </Box>
                                </>
                            )}
                            {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['add-member-to-project-send-invite']) &&
                                <button
                                    className="relative w-full h-full min-h-[60px] rounded-lg border border-dashed bg-white flex-row items-center justify-center align-items-center text-center"
                                    style={{ borderColor: '#39758D' }} onClick={openAddMemberModal}
                                >
                                    <Flex justify="center" align="flex-start" gap="xs" wrap="nowrap">
                                        <IconPlus size={20} color="#39758D" />

                                        <Text ta="center" fz="md" fw={500} c="#39758D">
                                            {translate('Add Member')}
                                        </Text>
                                    </Flex>
                                </button>
                            }
                            <ScrollArea h={hasPermission(loggedInUser?.llc_permissions, ['add-member-to-project-send-invite']) ? 515 : 592} scrollbarSize={2} offsetScrollbars={true}>
                                {projectMembers && projectMembers.length > 0 && projectMembers.map((user, index) => (

                                    <Card key={index} p="sm" shadow="xs" className='mb-3' withBorder>

                                        <Flex justify="space-between" align="center" gap="xs">
                                            <Group>
                                                <UserAvatarSingle user={{ name: user.name, avatar: user.avatar }} size={50} stroke={1.25} />
                                                <div>
                                                    <Text size="lg">{user.name}</Text>
                                                    <Text size="xs" c="dimmed">{user.email}</Text>
                                                </div>
                                            </Group>

                                            <Group spacing="xs">
                                                {/* <Select
                                                        value={
                                                            localRoleUpdates[user.id]?.id.toString() ||
                                                            (user.lazytasks_role &&
                                                                user.lazytasks_role.length > 0 &&
                                                                user.lazytasks_role[0].id ?
                                                                user.lazytasks_role[0].id.toString() :
                                                                null)
                                                        }
                                                        placeholder="Select Role"
                                                        data={roles && roles.length > 0 ? roles.map((role) => ({
                                                            value: role.id.toString(),
                                                            label: role.name
                                                        })) : []}
                                                        size="sm"
                                                        w={130}
                                                        onChange={(newRoleId) => handleRoleChange(user, newRoleId)}
                                                    /> */}

                                                {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['manage-users']) && (
                                                    <Box
                                                        className='border border-dashed rounded-full p-2 group cursor-pointer'
                                                        style={{
                                                            borderColor: '#4D4D4D',
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.borderColor = '#ff9800';
                                                            e.currentTarget.querySelector('svg').style.color = '#ff9800';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.borderColor = '#4D4D4D';
                                                            e.currentTarget.querySelector('svg').style.color = '#4D4D4D';
                                                        }}
                                                    >
                                                        <IconPencil
                                                            size={20}
                                                            stroke={1.25}
                                                            style={{
                                                                transition: 'all 0.2s ease'
                                                            }}
                                                            onClick={() => handleProfileEditDrawer(user.id)}
                                                        />
                                                    </Box>
                                                )}
                                                {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['remove-member-from-project']) && (
                                                    <Box
                                                        className='border border-dashed rounded-full p-2 group cursor-pointer'
                                                        style={{
                                                            borderColor: '#4D4D4D',
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.borderColor = '#ff0000';
                                                            e.currentTarget.querySelector('svg').style.color = '#ff0000';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.borderColor = '#4D4D4D';
                                                            e.currentTarget.querySelector('svg').style.color = '#4D4D4D';
                                                        }}
                                                    >
                                                        <IconTrash
                                                            size={20}
                                                            stroke={1.25}
                                                            style={{
                                                                transition: 'all 0.2s ease'
                                                            }}
                                                            onClick={() => confirmRemoveMember(user)}
                                                        />
                                                    </Box>
                                                )}
                                            </Group>

                                        </Flex>

                                    </Card>
                                ))}
                                {invitedMembers && invitedMembers.length > 0 && invitedMembers.map((invitedUser, index) => (

                                    <Card key={index} p="sm" shadow="xs" className='mb-3' withBorder>

                                        <Flex justify="space-between" align="center" gap="xs">
                                            <Group>
                                                <UserAvatarSingle user={{ name: invitedUser.name, avatar: invitedUser.avatar }} size={50} stroke={1.25} />
                                                <div>
                                                    <Text size="lg">{invitedUser.name}</Text>
                                                    <Text size="xs" c="dimmed">{invitedUser.email}</Text>
                                                </div>
                                            </Group>
                                            {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['remove-member-from-project']) &&
                                                <Group spacing="xs">

                                                    <Pill size="lg" bg={"#EBF1F4"}>{translate('Invited')}</Pill>

                                                    <Box
                                                        className='border border-dashed rounded-full p-2 group cursor-pointer'
                                                        style={{
                                                            borderColor: '#4D4D4D',
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.borderColor = '#ff0000';
                                                            e.currentTarget.querySelector('svg').style.color = '#ff0000';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.borderColor = '#4D4D4D';
                                                            e.currentTarget.querySelector('svg').style.color = '#4D4D4D';
                                                        }}
                                                    >
                                                        <IconTrash
                                                            size={20}
                                                            stroke={1.25}
                                                            style={{
                                                                transition: 'all 0.2s ease'
                                                            }}
                                                            onClick={() => confirmRemoveMember(invitedUser)}
                                                        />
                                                    </Box>
                                                </Group>
                                            }
                                        </Flex>

                                    </Card>
                                ))}
                            </ScrollArea>

                        </SectionCard>

                    </Grid.Col>
                </Grid>
            </ScrollArea>

            <Modal.Root
                opened={projectCreateModalOpen}
                onClose={closeProjectCreateModal}
                centered
                size="xl"
            >
                <Modal.Overlay />
                <Modal.Content radius={15}>
                    <Modal.Header px={20} py={10}>
                        {/* <Title order={5}>{translate('Create Project')}</Title> */}
                        {/* <Modal.CloseButton size={`md`} icon={"Create"} className={`!w-[70px]`} /> */}
                        {/* <Modal.CloseButton size={`lg`} icon={translate('Create')} className={`!ml-2 !h-[36px] !border-0 !w-[70px] !bg-[#ED7D31] !text-white`} /> */}
                        <Group position="apart" justify='space-between' align='items-center' style={{ width: '100%' }}>
                            <Title order={5}>{translate('Create Project')}</Title>
                            <Button variant="filled" color="orange" mr={10}
                                onClick={handleProjectCreation}
                                size='sm'
                            >
                                {translate('Create')}
                            </Button>
                        </Group>
                        <Modal.CloseButton />

                    </Modal.Header>
                    <Modal.Body>
                        <Card withBorder padding="md" mt="sm">
                            <Text fw={500} mb="sm">
                                {translate('Workspace')} : {selectedCompanyName}
                            </Text>
                            <TextInput
                                ref={projectInputRef}
                                withAsterisk
                                label={translate('Project name')}
                                placeholder={translate('Project name')}
                                mb="md"
                                radius="md"
                                size="md"
                                onChange={(e) => handleProjectName(e)}
                                styles={{
                                    label: { marginBottom: '8px', fontSize: '15px' },
                                }}
                                error={projectError}
                            />
                            <div className="flex flex-wrap gap-4 mb-4">
                                {currentMemberData && currentMemberData.length > 0 && currentMemberData.map((member) => (
                                    <div
                                        key={member.id}
                                        className="flex items-center justify-between gap-2"
                                        style={{ backgroundColor: '#EBF1F4', padding: '5px 10px', borderRadius: '5px' }}
                                    >
                                        {/*<Avatar src={member.name} size={28} radius={22} />*/}
                                        <UserAvatarSingle user={member} size={32} />
                                        <Text size="sm" fw={100} c="#202020">
                                            {member.name}
                                        </Text>
                                        <button onClick={() => handleDeleteCurrentMember(member.id)}>
                                            <IconX size={16} color="#202020" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <Grid>
                                {/* Search Input */}
                                <Grid.Col span={6}>
                                    <TextInput
                                        leftSection={<IconSearch size={16} />}
                                        placeholder={translate('Quick search member')}
                                        mt="md"
                                        value={searchValue}
                                        onChange={handleSearchInputChange}
                                    />
                                </Grid.Col>
                                <Grid.Col span={6}>
                                    <TextInput
                                        placeholder={translate('Invite By Email')}
                                        mt="md"
                                        value={inviteEmail}
                                        onChange={handleInviteInputChange}
                                        rightSection={
                                            <Button variant="filled" color="#39758D"
                                                size='sm'
                                                radius='sm'
                                                disabled={!isEmailValid || inviteLoading}
                                                loading={inviteLoading}
                                                loaderProps={{ type: 'dots' }}
                                                onClick={() => handleSendInvite(inviteEmail)}
                                                style={{
                                                    padding: '0px 10px',
                                                    height: '28px'
                                                }}
                                            >
                                                {translate('Invite')}
                                            </Button>
                                        }
                                        rightSectionWidth={60}
                                    />
                                </Grid.Col>
                            </Grid>
                            <Text size="lg" c="#000" mt={10} fw={600} ta="center">
                                {translate('Wordpress Users')}
                            </Text>

                            <ScrollArea h={220} scrollbarSize={6}>
                                {/* User List */}
                                {filteredMembers && filteredMembers.length === 0 && (
                                    <div className="py-4 text-center">
                                        <Text size="sm" c="#555">{translate('No members found')}</Text>
                                    </div>
                                )}
                                {filteredMembers && filteredMembers.length > 0 && filteredMembers.map((user) => (
                                    <div key={user.id}
                                        className="ml-single flex items-center border-b border-solid border-[#C2D4DC] py-3 justify-between">
                                        {/*<Avatar src={user.name} size={32} radius={32} />*/}
                                        <UserAvatarSingle user={user} size={32} />
                                        <div className="mls-ne ml-2 w-full">
                                            <Text size="sm" fw={700} c="#202020">{user.name}</Text>
                                            <Text size="sm" fw={100} c="#202020">{user.email}</Text>
                                        </div>
                                        {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['add-member-to-project-send-invite']) &&
                                            <Button
                                                radius="sm"
                                                height={24}
                                                style={{
                                                    backgroundColor: addedMembers.includes(user.id) ? "#EBF1F4" : "#39758D", // Conditional background color
                                                    color: addedMembers.includes(user.id) ? "#000" : "#fff",
                                                    fontWeight: 400,
                                                    padding: "5px 0px",
                                                    width: "100px",
                                                }}
                                                disabled={addedMembers.includes(user.id)}
                                                size="sm"
                                                marginLeft={2}
                                                onClick={() => handleButtonClick(user)}
                                            >
                                                {addedMembers.includes(user.id) ? translate('Added') : translate('Add')}
                                            </Button>
                                        }
                                    </div>
                                ))}

                            </ScrollArea>
                        </Card>
                    </Modal.Body>
                </Modal.Content>
            </Modal.Root>

            <Modal.Root
                opened={addMemberModalOpen}
                onClose={closeAddMemberModal}
                centered
                size="xl"
            >
                <Modal.Overlay />
                <Modal.Content radius={15}>
                    <Modal.Header px={20} py={10}>
                        {/* <Title order={5}>{translate('Add Member')}</Title> */}
                        {/* <Modal.CloseButton size={`lg`} icon={translate('Add')} className={`!ml-2 !h-[36px] !border-0 !w-[70px] !bg-[#ED7D31] !text-white`} /> */}
                        <Group position="apart" justify='space-between' align='items-center' style={{ width: '100%' }}>
                            <Title order={5}>{translate('Add Member')}</Title>
                            <Button variant="filled" color="orange" mr={10}
                                onClick={handleAddMemberToProject}
                                size='sm'
                            >
                                {translate('Add')}
                            </Button>
                        </Group>
                        <Modal.CloseButton />
                    </Modal.Header>
                    <Modal.Body>
                        <Card withBorder padding="md" mt="sm">
                            <Text fw={500} mb="sm">
                                {translate('Workspace')} : {selectedCompanyName}
                            </Text>
                            <Text fw={500} mb="sm">
                                {translate('Project')} : {selectedProjectName}
                            </Text>

                            <div className="flex flex-wrap gap-4 mb-4">
                                {currentMemberData && currentMemberData.length > 0 && currentMemberData.map((member) => (
                                    <div
                                        key={member.id}
                                        className="flex items-center justify-between gap-2"
                                        style={{ backgroundColor: '#EBF1F4', padding: '5px 10px', borderRadius: '5px' }}
                                    >
                                        {/*<Avatar src={member.name} size={28} radius={22} />*/}
                                        <UserAvatarSingle user={member} size={32} />
                                        <Text size="sm" fw={100} c="#202020">
                                            {member.name}
                                        </Text>
                                        <button onClick={() => handleDeleteCurrentMember(member.id)}>
                                            <IconX size={16} color="#202020" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <Grid>
                                {/* Search Input */}
                                <Grid.Col span={6}>
                                    <TextInput
                                        leftSection={<IconSearch size={16} />}
                                        placeholder={translate('Quick search member')}
                                        mt="md"
                                        value={searchValue}
                                        onChange={handleSearchInputChange}
                                    />
                                </Grid.Col>
                                <Grid.Col span={6}>
                                    <TextInput
                                        placeholder={translate('Invite By Email')}
                                        mt="md"
                                        value={inviteEmail}
                                        onChange={handleInviteInputChange}
                                        rightSection={
                                            <Button variant="filled" color="#39758D"
                                                size='sm'
                                                radius='sm'
                                                disabled={!isEmailValid || inviteLoading}
                                                loading={inviteLoading}
                                                loaderProps={{ type: 'dots' }}
                                                onClick={() => handleSendInvite(inviteEmail)}
                                                style={{
                                                    padding: '0px 10px',
                                                    height: '28px'
                                                }}
                                            >
                                                {translate('Invite')}
                                            </Button>
                                        }
                                        rightSectionWidth={60}
                                    />
                                </Grid.Col>
                            </Grid>


                            <Text size="lg" c="#000" mt={10} fw={600} ta="center">
                                {translate('Wordpress Users')}
                            </Text>

                            <ScrollArea h={220} scrollbarSize={6}>
                                {filteredMembers && filteredMembers.length === 0 && (
                                    <div className="py-4 text-center">
                                        <Text size="sm" c="#555">{translate('No members found')}</Text>
                                    </div>
                                )}
                                {/* User List */}
                                {filteredMembers && filteredMembers.length > 0 && filteredMembers.map((user) => (
                                    <div key={user.id}
                                        className="ml-single flex items-center border-b border-solid border-[#C2D4DC] py-3 justify-between">
                                        {/*<Avatar src={user.name} size={32} radius={32} />*/}
                                        <UserAvatarSingle user={user} size={32} />
                                        <div className="mls-ne ml-2 w-full">
                                            <Text size="sm" fw={700} c="#202020">{user.name}</Text>
                                            <Text size="sm" fw={100} c="#202020">{user.email}</Text>
                                        </div>

                                        <Button
                                            radius="sm"
                                            height={24}
                                            style={{
                                                backgroundColor: addedMembers.includes(user.id) ? "#EBF1F4" : "#39758D", // Conditional background color
                                                color: addedMembers.includes(user.id) ? "#000" : "#fff",
                                                fontWeight: 400,
                                                padding: "5px 0px",
                                                width: "100px",
                                            }}
                                            disabled={addedMembers.includes(user.id)}
                                            size="sm"
                                            marginLeft={2}
                                            onClick={() => handleButtonClick(user)}
                                        >
                                            {addedMembers.includes(user.id) ? translate('Added') : translate('Add')}
                                        </Button>

                                    </div>
                                ))}

                            </ScrollArea>
                        </Card>
                    </Modal.Body>
                </Modal.Content>
            </Modal.Root>

            <Modal.Root
                opened={workspaceCreateModalOpen}
                onClose={closeWorkspaceCreateModal}
                centered
                size={575}
            >
                <Modal.Overlay />
                <Modal.Content radius={15}>
                    <Modal.Header px={20} py={10}>
                        <Title order={5}>{isEditWorkspace ? translate('Edit Workspace') : translate('Create Workspace')}</Title>
                        <Modal.CloseButton size={`lg`} icon={isEditWorkspace ? translate('Update') : translate('Create')} className={`!ml-2 !h-[36px] !border-0 !w-[70px] !bg-[#ED7D31] !text-white`} />
                        {/* <Button
                                size="sm"
                                className="!w-[100px] text-white"
                                style={{ backgroundColor: '#ED7D31' }}
                                onClick={handleWorkspaceCreation}
                            >
                                Create
                            </Button> */}
                    </Modal.Header>
                    <Modal.Body>
                        <Card withBorder padding="md" mt="sm">

                            <TextInput
                                ref={workspaceInputRef}
                                withAsterisk
                                label={translate('Workspace name')}
                                placeholder={translate('Workspace name')}
                                mb="md"
                                radius="md"
                                size="md"
                                value={workspaceName}
                                onChange={(e) => handleWorkspaceName(e)}
                                styles={{
                                    label: { marginBottom: '8px', fontSize: '15px' },
                                }}
                                error={workspaceError}
                            />

                        </Card>
                    </Modal.Body>
                </Modal.Content>
            </Modal.Root>

            <MemberEditDrawer />
            <ProjectConfigureModal project_id={projectId} opened={projectNavConfigureModalOpen} onClose={() => setProjectNavConfigureModalOpen(false)} isSettings={true} />
        </Box>
    );
};
export default SettingsPanel;