import React, {useState, useEffect, Fragment} from 'react';
import {Avatar, Button, Modal, ScrollArea, Select, Text, TextInput, Title} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconSearch } from '@tabler/icons-react';
import { IconX } from '@tabler/icons-react';
import ProjectEditButton from '../../Button/ProjectEditButton';
import {useDispatch, useSelector} from 'react-redux';
import InlineEditForm from "../../../ui/InlineEditForm";
import {editProject} from "../../../Settings/store/projectSlice";
import UserAvatarSingle from "../../../ui/UserAvatarSingle";
import {fetchTasksByProject, updateBoardMembers} from "../../../Settings/store/taskSlice";
import { createUser } from "../../../../store/auth/userSlice";
import {modals} from "@mantine/modals";
import {showNotification} from "@mantine/notifications";
import { hasPermission } from "../../../ui/permissions";
import { translate } from '../../../../utils/i18n';
const EditProjectModal = ({ projectData }) =>  {
    const dispatch = useDispatch();
    const {loggedUserId} = useSelector((state) => state.auth.user)
    const { loggedInUser } = useSelector((state) => state.auth.session);
    const [projectEditModalOpen, { open: openProjectEditModal, close: closeProjectEditModal }] = useDisclosure(false);
    const [showMembersList, setShowMembersList] = useState(true);
    const [editedName, setEditedName] = useState(projectData.name); // State to hold edited name
    const [isEmailValid, setIsEmailValid] = useState(false);


    const editProjectNameHandler = (props) => {
        const {id, input, fieldName} = props
        if(id === undefined || input === undefined || fieldName === undefined){
            return;
        }
        dispatch(editProject({id: id, data: {[fieldName]: input, 'updated_by': loggedUserId}})).then((response) => {
                if(response.payload && response.payload.status && response.payload.status === 200){
                    showNotification({
                        id: 'load-data',
                        loading: true,
                        title: 'Project',
                        message: response.payload && response.payload.message && response.payload.message,
                        autoClose: 2000,
                        disallowClose: true,
                        color: 'green',
                    });
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
        setEditedName(input)
    }


    const [currentMemberData, setCurrentMemberData] = useState(projectData.members);
    const invitedMembers = projectData?.invitedMembers || [];
    const [inviteLoading, setInviteLoading] = useState(false);
    const [isInviteClose, setIsInviteClose] = useState(false);

    const {tasks} = useSelector((state) => state.settings.task)

    const handleDeleteCurrentMember = (id) => {

        const isMemberAssignedToTask = tasks && tasks.allTasks && Object.values(tasks.allTasks).length>0 && Object.values(tasks.allTasks).some((task) => task.assignedTo_id === id.toString());
        const isMemberAssignedToSubTask = tasks && tasks.allTasks && Object.values(tasks.allTasks).length>0 && Object.values(tasks.allTasks).some((task) => task.children && task.children.length>0 && task.children.some((subtask) => subtask.assignedTo_id === id.toString()));
        if(isMemberAssignedToTask || isMemberAssignedToSubTask){
            modals.open({
                withCloseButton: false,
                centered: true,
                children: (
                    <Fragment>
                        <Text size="sm">
                            This member is assigned to a task. Please reassign the task before removing the member.
                        </Text>

                        <div className="!grid w-full !justify-items-center">
                            <Button justify="center" onClick={() => modals.closeAll()} mt="md">
                                Ok
                            </Button>
                        </div>
                    </Fragment>
                ),
            });

        }else{
            const updatedCurrentMembers = currentMemberData.filter((member) => parseInt(member.id) !== parseInt(id));
            setCurrentMemberData(updatedCurrentMembers);

            // Remove the member's ID from the addedMembers array
            setAddedMembers((prevMembers) => prevMembers.filter((memberId) => parseInt(memberId) !== parseInt(id)));

            dispatch(editProject({id: projectData.id, data: {'members': updatedCurrentMembers, 'deleted_member_id': id, 'updated_by': loggedUserId}})).then((response) => {
                    if(response.payload && response.payload.status && response.payload.status === 200){
                        showNotification({
                            id: 'load-data',
                            loading: true,
                            title: 'Project',
                            message: 'Member removed successfully',
                            autoClose: 2000,
                            disallowClose: true,
                            color: 'green',
                        });
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
    };

    const validateEmail = (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };
    const [searchValue, setSearchValue] = useState('');

    const handleSearchInputChange = (e) => {
        const inputValue = e.target.value;
        setSearchValue(inputValue);

        setShowMembersList(true);
        setIsEmailValid(validateEmail(inputValue));
        
    };

    const isEmailAlreadyInvited = (email) => {
        return invitedMembers && invitedMembers.some(member =>
            member.email.toLowerCase() === email.toLowerCase()
        );
    };

    const filteredMembers = projectData.parent.members && projectData.parent.members.length>0 && projectData.parent.members.filter(
        (member) =>
          member.name.toLowerCase().includes(searchValue.toLowerCase()) ||
          member.email.toLowerCase().includes(searchValue.toLowerCase())
      );

    const handleSearchInputFocus = (e) => {
        setShowMembersList(true);
    };

    const [addedMembers, setAddedMembers] = useState(projectData.members && projectData.members.length>0 ? projectData.members.map((member) => member.id):[]);


      const handleButtonClick = (clickedMember) => {
        console.log('Added');
        // Check if the member is not already in the current list
        if (!addedMembers.includes(clickedMember.id)) {
            // Add the clickedMember to the currentMemberData state with updated status
            const updatedClickedMember = { ...clickedMember, status: 'Added' };
            const updatedMembers = [...currentMemberData, updatedClickedMember];

            setCurrentMemberData((prevData) => {
                // const newData = [...prevData, updatedClickedMember];
                // console.log(newData)
                return [...prevData, updatedClickedMember];
            });
            setAddedMembers((prevMembers) => [...prevMembers, clickedMember.id]);

            dispatch(editProject({id: projectData.id, data: {'members': updatedMembers, 'updated_by': loggedUserId}})).then((response) => {
                    if(response.payload && response.payload.status && response.payload.status === 200){
                        showNotification({
                            id: 'load-data',
                            loading: true,
                            title: 'Project',
                            message: 'Member added successfully',
                            autoClose: 2000,
                            disallowClose: true,
                            color: 'green',
                        });
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
    };

    useEffect(() => {
        if(projectEditModalOpen===false){
            setShowMembersList(projectEditModalOpen);
        }
        if(projectEditModalOpen===true){
            dispatch(fetchTasksByProject({id: projectData.id}))
            setShowMembersList(true);
        }
    }, [projectEditModalOpen]);

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
                    ...currentMemberData,
                    ...(projectData?.invitedMembers || []).filter(
                        invited => !projectData.members.some(project => project.id === invited.id)
                    ),
                    response.payload.data
                ];

                if (projectData.id) {
                    dispatch(editProject({
                        id: projectData.id,
                        data: {
                            members: updatedMembers,
                            updated_by: loggedInUser ? loggedInUser.id : loggedUserId
                        }
                    })).then((res) => {
                        if (res.payload?.status === 200) {
                            // Important: use latest members from server, not local assumption
                            dispatch(updateBoardMembers(res.payload.data?.members || []));
                            setSearchValue('');
                            setIsInviteClose(true);
                            closeProjectEditModal();
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

    return (
        <>
            <ProjectEditButton onClick={openProjectEditModal} />
            {projectEditModalOpen &&
                <Modal.Root
                    opened={projectEditModalOpen}
                    onClose={closeProjectEditModal}
                    centered
                    size={575}
                >
                    <Modal.Overlay />
                    <Modal.Content radius={15}>
                        <Modal.Header px={20} py={10}>
                            <Title order={5}>{translate('Edit Project')}</Title>
                            <Modal.CloseButton size={`lg`} icon={translate('Update')} className={`!ml-2 !h-[36px] !border-0 !w-[70px] !bg-[#ED7D31] !text-white`} />
                        </Modal.Header>
                        <Modal.Body>
                            <div className="edit-form-box">
                                <Text fw={500} mb="sm">
                                    {translate('Workspace')} : {projectData.parent && projectData.parent.name ? projectData.parent.name : 'N/A'}
                                </Text>
                                {/* <div className="mb-4">
                                    <InlineEditForm editHandler={(props) => {
                                        props['id'] = projectData.id;
                                        props['fieldName'] = 'name'
                                        editProjectNameHandler(props)
                                    }} value={editedName}/>
                                </div> */}
                                <TextInput
                                    withAsterisk
                                    label={translate('Project name')}
                                    placeholder={translate('Project name')}
                                    mb="md"
                                    radius="md"
                                    size="md"
                                    onChange={e => setEditedName(e.target.value)} // <-- This makes the input editable
                                    onBlur={() => editProjectNameHandler({
                                        id: projectData.id,
                                        input: editedName,
                                        fieldName: 'name'
                                    })}
                                    value={editedName}
                                    styles={{
                                        label: { marginBottom: '8px', fontSize: '15px' },
                                    }}
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
                                <TextInput
                                    leftSection={<IconSearch size={16} />}
                                    placeholder={translate('Quick search member')}
                                    mt="md"
                                    value={searchValue}
                                    onChange={handleSearchInputChange}
                                />
                                <Text size="lg" c="#000" mt={10} fw={600} ta="center">
                                    {translate('Wordpress Users')}
                                </Text>

                                <ScrollArea h={220} scrollbarSize={6}>
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
                                    {filteredMembers && filteredMembers.length === 0 && isEmailValid && hasPermission(loggedInUser.llc_permissions, ['add-member-to-project-send-invite']) &&
                                        <div className="ml-single flex items-center border-b border-solid border-[#C2D4DC] py-3 justify-between">
                                            <Avatar size={32} radius={32} />
                                            <div className="mls-ne ml-2 w-full">
                                                <Text size="sm" fw={100} c="#202020">{searchValue}</Text>
                                            </div>

                                            {!isEmailAlreadyInvited(searchValue) ? (
                                                <Button
                                                    radius="sm"
                                                    height={24}
                                                    style={{
                                                        backgroundColor: "#39758D", // Conditional background color
                                                        color: "#fff",
                                                        fontWeight: 400,
                                                        padding: "5px 0px",
                                                        width: "100px",
                                                    }}
                                                    size="sm"
                                                    marginLeft={2}
                                                    loading={inviteLoading}
                                                    loaderProps={{ type: 'dots' }}
                                                    disabled={inviteLoading}
                                                    onClick={() => handleSendInvite(searchValue)}
                                                >
                                                    {translate('Send Invite')}
                                                </Button>
                                            ) : (
                                                <Button
                                                    radius="sm"
                                                    height={24}
                                                    style={{
                                                        backgroundColor: "#EBF1F4",
                                                        color: "#000",
                                                        fontWeight: 400,
                                                        padding: "5px 0px",
                                                        width: "100px",
                                                    }}
                                                    disabled={true}
                                                    size="sm"
                                                    marginLeft={2}
                                                >
                                                    {translate('Invited')}
                                                </Button>
                                            )}

                                        </div>
                                    }
                                </ScrollArea>


                            </div>
                        </Modal.Body>
                    </Modal.Content>
                </Modal.Root>
            }
        </>
    );
}

export default EditProjectModal;