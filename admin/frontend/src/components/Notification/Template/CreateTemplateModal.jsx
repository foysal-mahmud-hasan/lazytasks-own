import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { Modal, Select, Tabs, Textarea, TextInput, Title, Group, Switch, Text, Button } from '@mantine/core';
import { useSelector, useDispatch } from 'react-redux';
import { createNotificationTemplate } from "../store/notificationTemplateSlice";
import { showNotification } from "@mantine/notifications";
import { translate } from '../../../utils/i18n';

const CreateTemplateModal = ({ modalOpened, closeModal }) => {
    const dispatch = useDispatch();
    const { loggedUserId } = useSelector((state) => state.auth.user);
    const { settings } = useSelector((state) => state.settings.setting);
    const { notificationChannels, notificationActions } = useSelector((state) => state.notifications.notificationTemplate);
    const [title, setTitle] = useState('Type title here');
    const [description, setDescription] = useState('');
    const [content, setContent] = useState([]);
    const [channelStatus, setChannelStatus] = useState([]);
    const [notificationAction, setNotificationAction] = useState(null);
    const [emailSubject, setEmailSubject] = useState(null);
    const [mobileNotificationTitle, setMobileNotificationTitle] = useState(null);
    const [isSmsEnabled, setIsSmsEnabled] = useState(false);

    useEffect(() => {
        if (notificationChannels && notificationChannels.length > 0) {
            const initialStatus = {};
            notificationChannels.forEach(channel => {
                initialStatus[channel.slug] = false;
            });
            setChannelStatus(initialStatus);
        }
    }, [notificationChannels, modalOpened]);

    useEffect(() => {
        if (settings && settings.sms_configuration) {
            try {
                // Parse the JSON string
                const parsedData = JSON.parse(settings.sms_configuration);

                if (parsedData && parsedData.is_sms_enabled) {
                    setIsSmsEnabled(parsedData.is_sms_enabled);
                }
            } catch (error) {
                console.error("JSON parsing error:", error.message);
            }
        }
    }, [settings]);

    const handleTemplateCreation = () => {
        const newTemplateData = {
            title: title,
            created_by: loggedUserId,
            description: description,
            channel_status: channelStatus,
            content: content,
            notification_action_name: notificationAction,
            email_subject: emailSubject,
            mobile_notification_title: mobileNotificationTitle
        };

        // console.log(newTemplateData);
        // return;

        if (newTemplateData.title !== '' && newTemplateData.title !== 'Type title here') {
            dispatch(createNotificationTemplate(newTemplateData)).then((response) => {
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
                    closeModal();
                }
            }
            );
            setTitle('Type title here');
            setDescription('');
            setContent([]);
            setNotificationAction(null);
            setEmailSubject('');
            setMobileNotificationTitle('');
        }
    };


    return (
        <Fragment>
            <Modal.Root
                opened={modalOpened}
                onClose={() => {
                    closeModal()
                }
                }
                centered
                size="1200px"
            >
                <Modal.Overlay />
                <Modal.Content radius={15}>
                    <Modal.Header px={20} py={10}>
                        <Group position="apart" justify='space-between' align='items-center' style={{ width: '100%' }}>
                            <Title order={5}>{translate('Create Template')}</Title>
                            <Button variant="filled" color="orange" mr={10}
                                onClick={handleTemplateCreation}
                                size='sm'
                            >
                                Create
                            </Button>
                        </Group>
                        <Modal.CloseButton />
                    </Modal.Header>
                    <Modal.Body>
                        <div className="create-form-box">

                            <div className="mb-4">
                                <TextInput
                                    label={translate('Do action title')}
                                    placeholder={translate('Enter your title')}
                                    radius="md"
                                    size="md"
                                    styles={{
                                        borderColor: "gray.3",
                                        backgroundColor: "white",
                                        focus: {
                                            borderColor: "blue.5",
                                        },
                                    }}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>

                            <div className="mb-4">
                                {/*<Select
                                    placeholder="Select Action"
                                    data={notificationActions && Object.keys(notificationActions).map((action) => ({ value: action, label: notificationActions[action] }))}
                                    clearable
                                    onChange={(e) => { setNotificationAction(e)}}
                                />*/}
                                <TextInput
                                    label={translate('Do action (hook)')}
                                    placeholder={translate('Enter action name')}
                                    radius="md"
                                    size="md"
                                    styles={{
                                        borderColor: "gray.3",
                                        backgroundColor: "white",
                                        focus: {
                                            borderColor: "blue.5",
                                        },
                                    }}
                                    onChange={(e) => setNotificationAction(e.target.value)}
                                />
                            </div>

                            <div className="mb-4">
                                {notificationChannels && notificationChannels.length > 0 &&
                                    <Tabs color="orange" defaultValue={notificationChannels[0].slug}>
                                        <Tabs.List>
                                            {notificationChannels
                                                .filter((channel) => !(channel.slug === 'sms' && !isSmsEnabled))
                                                .map((channel) => (
                                                    <Tabs.Tab value={channel.slug} key={channel.id}
                                                        disabled={channel.slug === 'mobile'}
                                                    >
                                                        {channel.name}
                                                    </Tabs.Tab>
                                                )
                                                )}
                                        </Tabs.List>

                                        {notificationChannels.map((channel) => (
                                            <Tabs.Panel value={channel.slug} key={channel.id}>
                                                <Group>
                                                    <Text mt={5}>{translate('Enable/Disable')} :</Text>
                                                    <Switch
                                                        color="#ED7D31"
                                                        size="md"
                                                        onLabel="ON"
                                                        offLabel="OFF"
                                                        radius='sm'
                                                        mt={5}
                                                        checked={!!channelStatus[channel.slug]}
                                                        onChange={(e) => {
                                                            const checked = e.currentTarget.checked;
                                                            // Update channelStatus
                                                            setChannelStatus(prev => ({
                                                                ...prev,
                                                                [channel.slug]: checked
                                                            }));
                                                        }}
                                                    />
                                                </Group>
                                                {channel.slug === 'email' &&
                                                    <div className="mt-2">
                                                        <TextInput
                                                            label={translate('Email subject')}
                                                            placeholder={translate('Enter email subject')}
                                                            radius="md"
                                                            size="md"
                                                            styles={{
                                                                borderColor: "gray.3",
                                                                backgroundColor: "white",
                                                                focus: {
                                                                    borderColor: "blue.5",
                                                                },
                                                            }}
                                                            onChange={(e) => setEmailSubject(e.target.value)}
                                                            value={emailSubject}
                                                        />
                                                    </div>
                                                }

                                                {channel.slug === 'mobile' &&
                                                    <div className="mt-2">
                                                        <TextInput
                                                            label={translate('Notification title')}
                                                            placeholder={translate('Enter notification title')}
                                                            radius="md"
                                                            size="md"
                                                            styles={{
                                                                borderColor: "gray.3",
                                                                backgroundColor: "white",
                                                                focus: {
                                                                    borderColor: "blue.5",
                                                                },
                                                            }}
                                                            onChange={(e) => setMobileNotificationTitle(e.target.value)}
                                                            value={mobileNotificationTitle}
                                                        />
                                                    </div>
                                                }

                                                <div className="mt-2">
                                                    <Textarea
                                                        rows={10}
                                                        label={translate('Message body')}
                                                        resize="vertical"
                                                        name={channel.slug}
                                                        placeholder={translate('Enter %s content here').replace('%s', channel.name)}
                                                        radius="md"
                                                        size="md"
                                                        onChange={(e) => {
                                                            setContent({
                                                                ...content,
                                                                [channel.slug]: e.target.value
                                                            });
                                                        }}
                                                    />
                                                </div>
                                            </Tabs.Panel>
                                        )
                                        )}
                                    </Tabs>
                                }

                            </div>

                        </div>
                    </Modal.Body>
                </Modal.Content>
            </Modal.Root>
        </Fragment>
    );
}

export default CreateTemplateModal;