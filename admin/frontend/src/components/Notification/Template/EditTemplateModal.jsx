import React, { Fragment, useCallback, useEffect, useState, use } from 'react';
import { Modal, Select, Tabs, Textarea, TextInput, Title, Switch, Group, Text, Button } from '@mantine/core';
import { useSelector, useDispatch } from 'react-redux';
import { updateNotificationTemplate } from "../store/notificationTemplateSlice";
import { showNotification } from "@mantine/notifications";
import { translate } from '../../../utils/i18n';

const EditTemplateModal = ({ modalOpened, closeModal }) => {
    const dispatch = useDispatch();
    const { loggedUserId } = useSelector((state) => state.auth.user);
    const { settings } = useSelector((state) => state.settings.setting);
    const { notificationChannels, notificationTemplate, notificationActions } = useSelector((state) => state.notifications.notificationTemplate);
    const [title, setTitle] = useState(notificationTemplate && notificationTemplate.title ? notificationTemplate.title : 'Type title here');
    const [description, setDescription] = useState(notificationTemplate && notificationTemplate.description ? notificationTemplate.description : '');
    const [content, setContent] = useState(notificationTemplate && notificationTemplate.content ? notificationTemplate.content : {});
    const [notificationAction, setNotificationAction] = useState(notificationTemplate && notificationTemplate.notification_action_name ? notificationTemplate.notification_action_name : '');
    const [emailSubject, setEmailSubject] = useState(notificationTemplate && notificationTemplate.email_subject ? notificationTemplate.email_subject : '');
    const [mobileNotificationTitle, setMobileNotificationTitle] = useState(notificationTemplate && notificationTemplate.mobile_notification_title ? notificationTemplate.mobile_notification_title : '');
    const [channelStatus, setChannelStatus] = useState(() => {
        let status = notificationTemplate && notificationTemplate.channel_status ? notificationTemplate.channel_status : {};
        if (typeof status === 'string') {
            try {
                status = JSON.parse(status);
            } catch (e) {
                status = {};
            }
        }
        return status;
    });

    const [isSmsEnabled, setIsSmsEnabled] = useState(false);

    useEffect(() => {
        setTitle(notificationTemplate && notificationTemplate.title ? notificationTemplate.title : 'Type title here');
        setDescription(notificationTemplate && notificationTemplate.description ? notificationTemplate.description : '');
        setContent(notificationTemplate && notificationTemplate.content ? notificationTemplate.content : {});
        setNotificationAction(notificationTemplate && notificationTemplate.notification_action_name ? notificationTemplate.notification_action_name : '');
        setEmailSubject(notificationTemplate && notificationTemplate.email_subject ? notificationTemplate.email_subject : '')
        setMobileNotificationTitle(notificationTemplate && notificationTemplate.mobile_notification_title ? notificationTemplate.mobile_notification_title : '');

        let status = notificationTemplate && notificationTemplate.channel_status ? notificationTemplate.channel_status : {};
        if (typeof status === 'string') {
            try {
                status = JSON.parse(status);
            } catch (e) {
                status = {};
            }
        }
        setChannelStatus(status);

    }, [notificationTemplate]);
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

    const handleTemplateUpdate = () => {
        const newTemplateData = {
            title: title,
            created_by: loggedUserId,
            description: description,
            content: content,
            channel_status: channelStatus,
            notification_action_name: notificationAction,
            email_subject: emailSubject,
            mobile_notification_title: mobileNotificationTitle
        };

        if (newTemplateData.title !== '' && newTemplateData.title !== 'Type title here') {
            dispatch(updateNotificationTemplate({ id: notificationTemplate.id, data: newTemplateData })).then((response) => {
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
                    closeModal()
                }
            }
            );
            setTitle('Type title here');
            setDescription('');
            setContent([]);
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
                            <Title order={5}>{translate('Update Template')}</Title>
                            <Button variant="filled" color="orange" mr={10}
                                onClick={handleTemplateUpdate}
                                size='sm'
                            >
                                {translate('Update')}
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
                                    value={title}
                                />
                            </div>

                            <div className="mb-4">
                                {/*<Select
                                    placeholder="Select Action"
                                    data={notificationActions && Object.keys(notificationActions).map((action) => ({
                                        value: action,
                                        label: notificationActions[action]
                                    }))}
                                    clearable
                                    onChange={(e) => setNotificationAction(e)}
                                    value={notificationAction}
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
                                    value={notificationAction}
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
                                                        disabled={(notificationAction != 'lazytask_project_assigned_member' && notificationAction != 'lazytask_task_assigned_member') && channel.slug === 'mobile'}
                                                    >
                                                        {translate(channel.name)}
                                                    </Tabs.Tab>
                                                ))}
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
                                                        value={content && content[channel.slug] ? content[channel.slug] : ''}
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

export default EditTemplateModal;