import React, { useState, useEffect, Fragment, useRef } from 'react';
import {
    ActionIcon,
    Button,
    Input,
    Menu,
    rem,
    ScrollArea,
    Textarea,
    TextInput,
    Title,
    Text,
    useMantineTheme, Card, Group, Table, CloseButton, Avatar,
    Box,
    LoadingOverlay
} from '@mantine/core';
import { useSelector, useDispatch } from 'react-redux';
import { IconEdit, IconInfoCircle, IconPencil, IconPlus, IconRowRemove, IconSettings, IconTrash } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import EditTemplateModal from "./EditTemplateModal";
import { fetchNotificationTemplate, removeNotificationTemplate } from "../store/notificationTemplateSlice";
import { modals } from "@mantine/modals";
import CreateTemplateModal from "./CreateTemplateModal";
import { showNotification } from "@mantine/notifications";
import { translate } from '../../../utils/i18n';
import TemplateInfo from './TemplateInfo';

const TemplateListContent = () => {
    const dispatch = useDispatch();
    const { notificationTemplates } = useSelector((state) => state.notifications.notificationTemplate);
    const [loading, setLoading] = useState(true);
    const [templateData, setTemplateData] = useState(notificationTemplates && notificationTemplates.length > 0 ? notificationTemplates : []);

    useEffect(() => {
        setTemplateData(notificationTemplates && notificationTemplates.length > 0 ? notificationTemplates : []);
        setLoading(false);
    }, [notificationTemplates]);

    const rows = templateData && templateData.length > 0 && templateData.map((element) => (
        <Table.Tr key={element.id} title={element.title}>
            <Table.Td title={element.title}>
                <Text fz="sm" title={element.title} lineClamp={1}>
                    {element.title}
                </Text>
            </Table.Td>
            <Table.Td>{Object.keys(element.content).map((data) => data).join(', ')}</Table.Td>
            <Table.Td>{element.notification_action_name}</Table.Td>
            <Table.Td>
                <Box className="flex items-center gap-3">
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
                        onClick={() => editTemplateModalHandler(element.id)}
                    >
                        <IconPencil
                            size={20}
                            stroke={1.25}
                            style={{
                                transition: 'all 0.2s ease'
                            }}
                        />
                    </Box>
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
                        onClick={() => {
                            templateDeleteHandler(element.id)
                        }}
                    >
                        <IconTrash
                            size={20}
                            stroke={1.25}
                            style={{
                                transition: 'all 0.2s ease'
                            }}
                        />
                    </Box>
                </Box>
            </Table.Td>
        </Table.Tr>
    ));


    const [notificationEditTemplateModalOpen, {
        open: openNotificationEditTemplateModal,
        close: closeNotificationEditTemplateModal
    }] = useDisclosure(false);


    const editTemplateModalHandler = (id) => {
        openNotificationEditTemplateModal();
        dispatch(fetchNotificationTemplate(id));
    };


    const [notificationTemplateModalOpen, { open: openNotificationTemplateModal, close: closeNotificationTemplateModal }] = useDisclosure(false);


    const createTemplateModalHandler = () => {
        openNotificationTemplateModal();
    };

    const templateDeleteHandler = (templateId) => modals.openConfirmModal({
        title: (
            <Title order={5}>Are you sure delete?</Title>
        ),
        size: 'sm',
        radius: 'md',
        withCloseButton: false,
        children: (
            <Text size="sm">
                This action is so important that you are required to confirm it with a modal. Please click
                one of these buttons to proceed.
            </Text>
        ),
        labels: { confirm: 'Confirm', cancel: 'Cancel' },
        onCancel: () => {
            console.log('Cancel');
        },
        onConfirm: () => {
            if (templateId && templateId !== 'undefined') {
                dispatch(removeNotificationTemplate(templateId)).then((response) => {
                    if (response.payload && response.payload.status && response.payload.status === 200) {
                        showNotification({
                            id: 'load-data',
                            loading: true,
                            title: 'Notification Template',
                            message: response.payload && response.payload.message && response.payload.message,
                            autoClose: 2000,
                            disallowClose: true,
                            color: 'green',
                        });
                    }
                }
                );
            }
        },
    });



    return (
        <>
            <Card withBorder shadow="sm" radius="md">
                <Card.Section px="xs">
                    <ScrollArea className="relative h-full pb-[2px]" scrollbarSize={4}>
                        <LoadingOverlay visible={loading} overlayBlur={2} />
                        <Table striped highlightOnHover>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>{translate('Title')}</Table.Th>
                                    <Table.Th>{translate('Channel')}</Table.Th>
                                    <Table.Th>{translate('Do action hook')}</Table.Th>
                                    <Table.Th>
                                        <Group position="apart" align="center" spacing={0}>
                                            <ActionIcon variant="filled" color="#ED7D31" size="lg" title="Create Template" aria-label="Settings"
                                                radius={"xl"} onClick={() => createTemplateModalHandler()}
                                            >
                                                <IconPlus size={22} color="#fff" stroke={1.75} />
                                            </ActionIcon>
                                            <TemplateInfo/>
                                        </Group>
                                    </Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>{rows}</Table.Tbody>
                        </Table>
                    </ScrollArea>
                </Card.Section>
            </Card>
            {notificationEditTemplateModalOpen && <EditTemplateModal modalOpened={notificationEditTemplateModalOpen} closeModal={closeNotificationEditTemplateModal} />}

            {notificationTemplateModalOpen && <CreateTemplateModal modalOpened={notificationTemplateModalOpen}
                closeModal={closeNotificationTemplateModal} />}

        </>
    );
};

export default TemplateListContent;
