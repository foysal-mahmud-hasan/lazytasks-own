import {Button, Group, Modal, Text, Title} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks'; 
import ProjectDeleteButton from '../../Button/ProjectDeleteButton'; 
import {IconAlertTriangleFilled, IconCheck} from '@tabler/icons-react';
import {useDispatch, useSelector} from "react-redux";
import {deleteProject} from "../../../Settings/store/projectSlice";
import {modals} from "@mantine/modals";
import React, {Fragment} from "react";
import {deleteCompany, removeSuccessMessage, fetchAllCompanies} from "../../../Settings/store/companySlice";
import {notifications, showNotification} from "@mantine/notifications";
const DeleteProjectModal = (props) => {
    const { id, members, total_tasks } = props;

    const dispatch = useDispatch();

    const {loggedUserId} = useSelector((state) => state.auth.user)

    const [projectDeleteModalOpen, { open: deleteProjectModal, close: closeProjectDeleteModal }] = useDisclosure(false);

    /*const deleteHandler = () => {
        if(id === undefined || id === null || id === ''){
            return;
        }
        dispatch(deleteProject({id:id, data: {'deleted_by': loggedUserId}}));
    }*/
    const deleteHandler = () => modals.openConfirmModal({
        title: (
            <Title order={5}>You are parmanently deleting this project</Title>
        ),
        size: 'sm',
        radius: 'md',
        withCloseButton: false,
        centered: true,
        children: (
            <Text size="sm">
                Are you sure you want to delete this project?
            </Text>
        ),
        labels: { confirm: 'Confirm', cancel: 'Cancel' },
        onCancel: () => console.log('Cancel'),
        onConfirm: () => {
            if(id && id!=='undefined'){
                    if((members && members.length > 0) || (total_tasks && total_tasks > 0)){
                    modals.open({
                        withCloseButton: false,
                        centered: true,
                        children: (
                            <Fragment>
                                { members && members.length > 0 &&
                                    <Text size="sm">
                                        This project has {members.length} members. Please delete all members before deleting this project.
                                    </Text>
                                }
                                { total_tasks > 0 &&
                                    <Text size="sm">
                                        This project has {total_tasks} tasks. Please delete all tasks before deleting this project.
                                    </Text>
                                }

                                <div className="!grid w-full !justify-items-center">
                                    <Button justify="center" onClick={() => modals.closeAll()} mt="md">
                                        Ok
                                    </Button>
                                </div>
                            </Fragment>
                        ),
                    });
                }else{
                    dispatch(deleteProject({id:id, data: {'deleted_by': loggedUserId}})).then((response) => {
                        if(response && response.payload && response.payload.status && response.payload.status===200){
                            showNotification({
                                id: 'load-data',
                                loading: true,
                                title: 'Project',
                                message: response.payload && response.payload.message && response.payload.message,
                                autoClose: 2000,
                                disallowClose: true,
                                color: 'green',
                            });
                            dispatch(removeSuccessMessage());
                            dispatch(fetchAllCompanies());
                        }else {
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
                    });
                }

            }
        },
    });

    return (
        <>
            <ProjectDeleteButton onClick={deleteHandler} />
            
            {/*<Modal radius="15px" opened={projectDeleteModalOpen} centered size={475} padding="0px" withCloseButton={false}>
                <div className="dm-head flex justify-center items-center gap-2 p-6 border-b border-gray-300">
                
                    <IconAlertTriangleFilled style={{ color: 'orange' }} />
                    <Text ta="center" fz="xl" fw={500} c="#202020">
                        Delete Project
                    </Text>
                  
                </div>
                <div className="delete-c-box p-10"> 
                
                    <Text ta="center" fz="lg" fw={500} c="#202020" mb="xl">
                        You are going to delete “Project 1”.
                        Are you sure?
                    </Text>

                    <Group mt="xl" grow wrap="nowrap"  ta="center">
                        <Button onClick={closeProjectDeleteModal} style={{ '--button-bg': '#EBF1F4', color: '#4D4D4D' }}>No, Keep It.</Button>
                        <Button onClick={() => {
                            deleteHandler();
                            closeProjectDeleteModal()
                        }} color="orange">Yes, Delete !</Button>
                    </Group>
                </div>
            </Modal>*/}
            </>
    );
}
 
export default DeleteProjectModal;