import React, { Fragment, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    Button,
    Group, NumberInput,
    Paper, PasswordInput,
    Radio,
    ScrollArea,
    Stack,
    Switch,
    Text,
    TextInput
} from '@mantine/core';
import { useForm } from "@mantine/form";
import { editSetting, fetchSettings } from "../../Settings/store/settingSlice";
import { showNotification } from "@mantine/notifications";
import { translate } from '../../../utils/i18n';
const SMTPConfiguration = () => {
    // const users = useSelector((state) => state.users);
    const { loggedInUser } = useSelector((state) => state.auth.session)
    const { settings } = useSelector((state) => state.settings.setting)

    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(fetchSettings());
    }, [dispatch]);

    const [zohoHost, setZohoHost] = useState('');
    const [zohoUsername, setZohoUsername] = useState('');
    const [zohoPassword, setZohoPassword] = useState('');
    const [zohoSenderName, setZohoSenderName] = useState('');
    const [zohoSenderEmail, setZohoSenderEmail] = useState('');
    const [zohoPort, setZohoPort] = useState(587);

    const [activeMailer, setActiveMailer] = useState(null);
    const [isSmtpEnabled, setIsSmtpEnabled] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm({
        name: 'smtp-configuration',
        mode: 'uncontrolled',
        initialValues: {
            smtp_service_provider: 'zoho',
            active_mailer: activeMailer || '',
            is_smtp_enabled: isSmtpEnabled || '',
            smtp_host: zohoHost || '',
            smtp_username: zohoUsername || '',
            smtp_password: zohoPassword || '',
            smtp_sender_name: zohoSenderName || '',
            smtp_sender_email: zohoSenderEmail || '',
            smtp_port: zohoPort || 587,
        },

        validate: {
            active_mailer: (value) => (isSmtpEnabled && !value ? 'Please select an SMTP mode' : null),
            smtp_host: (value) => (activeMailer === 'lazytasks' && value.length < 1 ? 'Host is required' : null),
            smtp_username: (value) => (activeMailer === 'lazytasks' && value.length < 1 ? 'Username is required' : null),
            smtp_password: (value) => (activeMailer === 'lazytasks' && value.length < 1 ? 'Password is required' : null),
        },
    });


    useEffect(() => {
        if (settings && settings.smtp_configuration) {
            try {
                // Parse the JSON string
                const parsedData = JSON.parse(settings.smtp_configuration);

                // Check if the parsedData is defined and contains the smtp_username key
                if (parsedData && parsedData.is_smtp_enabled) {
                    setIsSmtpEnabled(parsedData.is_smtp_enabled);
                    form.setFieldValue('is_smtp_enabled', parsedData.is_smtp_enabled);
                }
                if (parsedData && parsedData.active_mailer) {
                    setActiveMailer(parsedData.active_mailer);
                    form.setFieldValue('active_mailer', parsedData.active_mailer);
                }
                if (parsedData && parsedData.smtp_host) {
                    setZohoHost(parsedData.smtp_host);
                    form.setFieldValue('smtp_host', parsedData.smtp_host);
                }
                if (parsedData && parsedData.smtp_username) {
                    setZohoUsername(parsedData.smtp_username);
                    form.setFieldValue('smtp_username', parsedData.smtp_username);
                }
                if (parsedData && parsedData.smtp_password) {
                    setZohoPassword(parsedData.smtp_password);
                    form.setFieldValue('smtp_password', parsedData.smtp_password);
                }
                if (parsedData && parsedData.smtp_sender_name) {
                    setZohoSenderName(parsedData.smtp_sender_name);
                    form.setFieldValue('smtp_sender_name', parsedData.smtp_sender_name);
                }
                if (parsedData && parsedData.smtp_sender_email) {
                    setZohoSenderEmail(parsedData.smtp_sender_email);
                    form.setFieldValue('smtp_sender_email', parsedData.smtp_sender_email);
                }
                if (parsedData && parsedData.smtp_port) {
                    setZohoPort(parsedData.smtp_port);
                    form.setFieldValue('smtp_port', parsedData.smtp_port);
                }
            } catch (error) {
                console.error("JSON parsing error:", error.message);
            }
        }

    }, [settings]);

    useEffect(() => {
        form.setFieldValue('active_mailer', activeMailer);
    }, [activeMailer]);

    const handleSubmit = async (values) => {
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('settings', JSON.stringify({ ...settings, smtp_configuration: values, type: 'smtp' }));
            const response = await dispatch(editSetting({ data: formData }));
            if (response.payload && response.payload.status && response.payload.status === 200) {
                showNotification({
                    id: 'load-data',
                    loading: true,
                    title: 'SMTP Settings',
                    message: response.payload && response.payload.message && response.payload.message,
                    autoClose: 2000,
                    disallowClose: true,
                    color: 'green',
                });
            } else {
                showNotification({
                    id: 'load-data',
                    loading: true,
                    title: 'SMTP Settings',
                    message: response.payload && response.payload.message && response.payload.message,
                    autoClose: 2000,
                    disallowClose: true,
                    color: 'red',
                });
            }
        } catch (error) {
            showNotification({
                title: 'SMTP Settings',
                message: error.message,
                color: 'red',
            });
        }
        setIsSubmitting(false);
    };

    return (
        <Fragment>
            <Paper>
                <form onSubmit={form.onSubmit((values) => handleSubmit(values))}>
                    <Stack
                        h={600}
                        align="stretch"
                        justify="space-between"
                    >
                        <Box>

                            <Group
                                position="apart"
                                spacing="xs"
                                justify='space-between'
                                style={{
                                    padding: '12px 16px',
                                    border: '1px solid #E0E0E0',
                                    borderRadius: 8,
                                    backgroundColor: '#FFFFFF',
                                    cursor: 'pointer',
                                    opacity: 1,
                                    width: '100%',
                                }}
                            >
                                <Group spacing="sm" justify='space-between'>
                                    <Box>
                                        <Text size="md" weight={700}>
                                            {translate('SMTP Notifications')}
                                        </Text>
                                        <Text size="xs" c="dimmed">
                                            {translate('Send Email notifications to users for various events.')}
                                        </Text>
                                    </Box>
                                </Group>
                                <Switch
                                    checked={isSmtpEnabled}
                                    onChange={(event) => {
                                        const checked = event.currentTarget.checked;
                                        setIsSmtpEnabled(checked);
                                        form.setFieldValue('is_smtp_enabled', checked);
                                    }}
                                    color="orange"
                                    size="sm"
                                    radius="sm"
                                />
                            </Group>

                            {isSmtpEnabled && (

                                <Box mt={10} pb={10}>
                                    <Radio.Group
                                        label={translate('SMTP Mode')}
                                        value={activeMailer}
                                        onChange={setActiveMailer}
                                    >
                                        <Radio value="wordpress" label={translate('Use Wordpress default')} mb={10} color='orange'/>
                                        <Radio value="lazytasks" label={translate('Use this SMTP')} mt={10} mb={10} color='orange'/>
                                    </Radio.Group>
                                </Box>
                            )}

                            {isSmtpEnabled && activeMailer === 'lazytasks' ? (
                                <ScrollArea h={320} scrollbarSize={4}>
                                    <Box pb={10}>
                                        <TextInput
                                            size="md"
                                            withAsterisk
                                            label={translate('SMTP Host')}
                                            placeholder={translate('Enter SMTP Host')}
                                            key={form.key('smtp_host')}
                                            {...form.getInputProps('smtp_host')}
                                            defaultValue={zohoHost}
                                        />
                                    </Box>
                                    <Box pb={10}>
                                        <TextInput
                                            autoComplete={false}
                                            size="md"
                                            withAsterisk
                                            label={translate('Username')}
                                            placeholder={translate('Enter Username')}
                                            key={form.key('smtp_username')}
                                            {...form.getInputProps('smtp_username')}
                                            defaultValue={zohoUsername}
                                        />
                                    </Box>
                                    <Box pb={10}>
                                        <PasswordInput
                                            autoComplete={false}
                                            size="md"
                                            withAsterisk
                                            label={translate('Password')}
                                            placeholder={translate('Enter Password')}
                                            key={form.key('smtp_password')}
                                            {...form.getInputProps('smtp_password')}
                                            defaultValue={zohoPassword}
                                        />
                                    </Box>
                                    <Box pb={10}>
                                        <TextInput
                                            size="md"
                                            withAsterisk
                                            label={translate('Sender Name')}
                                            placeholder={translate('Enter sender name')}
                                            key={form.key('smtp_sender_name')}
                                            {...form.getInputProps('smtp_sender_name')}
                                            defaultValue={zohoSenderName}
                                        />
                                    </Box>
                                    <Box pb={10}>
                                        <TextInput
                                            autoComplete={false}
                                            size="md"
                                            withAsterisk
                                            label={translate('Sender Email')}
                                            placeholder={translate('Enter sender email')}
                                            key={form.key('smtp_sender_email')}
                                            {...form.getInputProps('smtp_sender_email')}
                                            defaultValue={zohoSenderEmail}
                                        />
                                    </Box>
                                    <Box>
                                        <NumberInput
                                            size="md"
                                            label={translate('SMTP Port')}
                                            placeholder={translate('Enter SMTP Port')}
                                            min={1} max={65535}
                                            defaultValue={zohoPort}
                                            key={form.key('smtp_port')}
                                            {...form.getInputProps('smtp_port')}
                                        />
                                    </Box>
                                </ScrollArea>
                            ) : (
                                isSmtpEnabled && (
                                    <Box pb={10}>
                                        <Text size="sm" c="dimmed">
                                            {translate('WordPress default mailer will be used for notifications.')}
                                        </Text>
                                    </Box>
                                )
                            )}




                        </Box>

                        <Group justify="flex-start" mt={10}>
                            <Button variant="filled" color="#ED7D31" type="submit" loading={isSubmitting} loaderProps={{ type: 'dots' }}
                                disabled={isSubmitting || (isSmtpEnabled && !activeMailer)}
                            >
                                {translate('Submit')}
                            </Button>
                        </Group>
                    </Stack>

                </form>
            </Paper>

        </Fragment >
    );
};

export default SMTPConfiguration;
