import React, { Fragment, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Anchor,
    Box,
    Button,
    Card,
    Stack,
    Switch,
    Group,
    Text,
    ThemeIcon,
} from '@mantine/core';
import { useForm } from "@mantine/form";
import { editSetting, fetchSettings } from "../../Settings/store/settingSlice";
import { showNotification } from "@mantine/notifications";
import { translate } from '../../../utils/i18n';
import { IconCircleCheck, IconMessage, IconSquareRoundedX } from '@tabler/icons-react';
const SMSConfiguration = () => {
    // const users = useSelector((state) => state.users);
    const { loggedInUser } = useSelector((state) => state.auth.session)
    const { settings, is_wpsms_active } = useSelector((state) => state.settings.setting)

    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(fetchSettings());
    }, [dispatch]);

    const [reveApiUrl, setReveApiUrl] = useState('');
    const [reveApiSecretKey, setReveApiSecretKey] = useState('');
    const [reveApiKey, setReveApiKey] = useState('');
    const [smsSenderName, setSmsSenderName] = useState('');

    const [activeSmsGateway, setActiveSmsGateway] = useState('wordpress');
    const [isSmsEnabled, setIsSmsEnabled] = useState(false);

    const form = useForm({
        mode: 'uncontrolled',
        initialValues: {
            sms_service_provider: 'reve',
            active_sms_gateway: activeSmsGateway || 'wordpress',
            is_sms_enabled: isSmsEnabled || false,
            sms_api_url: reveApiUrl || '',
            sms_api_secret_key: reveApiSecretKey || '',
            sms_api_key: reveApiKey || '',
            sms_sender_name: smsSenderName || '',
        },

        validate: {
            sms_api_url: (value) => (activeSmsGateway === 'lazytasks' && value.length < 1 ? 'Host is required' : null),
            sms_api_secret_key: (value) => (activeSmsGateway === 'lazytasks' && value.length < 1 ? 'Username is required' : null),
            sms_api_key: (value) => (activeSmsGateway === 'lazytasks' && value.length < 1 ? 'Password is required' : null),
        },
    });

    useEffect(() => {
        if (settings && settings.sms_configuration) {
            try {
                // Parse the JSON string
                const parsedData = JSON.parse(settings.sms_configuration);

                // Check if the parsedData is defined and contains the sms_api_secret_key key
                if (parsedData && parsedData.active_sms_gateway) {
                    setActiveSmsGateway(parsedData.active_sms_gateway);
                    form.setFieldValue('active_sms_gateway', parsedData.active_sms_gateway);
                }
                if (parsedData && parsedData.is_sms_enabled) {
                    setIsSmsEnabled(parsedData.is_sms_enabled);
                    form.setFieldValue('is_sms_enabled', parsedData.is_sms_enabled);
                }
                if (parsedData && parsedData.sms_api_url) {
                    setReveApiUrl(parsedData.sms_api_url);
                    form.setFieldValue('sms_api_url', parsedData.sms_api_url);
                }
                if (parsedData && parsedData.sms_api_secret_key) {
                    setReveApiSecretKey(parsedData.sms_api_secret_key);
                    form.setFieldValue('sms_api_secret_key', parsedData.sms_api_secret_key);
                }
                if (parsedData && parsedData.sms_api_key) {
                    setReveApiKey(parsedData.sms_api_key);
                    form.setFieldValue('sms_api_key', parsedData.sms_api_key);
                }
                if (parsedData && parsedData.sms_sender_name) {
                    setSmsSenderName(parsedData.sms_sender_name);
                    form.setFieldValue('sms_sender_name', parsedData.sms_sender_name);
                }
            } catch (error) {
                console.error("JSON parsing error:", error.message);
            }
        }

    }, [settings]);

    const handlerSMSConfigurationSubmit = (values) => {
        const formData = new FormData();
        formData.append('settings', JSON.stringify({ ...settings, sms_configuration: values, type: 'sms' }));
        dispatch(editSetting({ data: formData })).then((response) => {
            if (response.payload && response.payload.status && response.payload.status === 200) {
                showNotification({
                    id: 'load-data',
                    loading: true,
                    title: 'SMS Settings',
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
                    title: 'SMS Settings',
                    message: response.payload && response.payload.message && response.payload.message,
                    autoClose: 2000,
                    disallowClose: true,
                    color: 'red',
                });
            }
        });
        // dispatch(editSetting({ data: {...settings, sms_configuration: values , type:'sms'} }));
    };

    return (
        <Fragment>

            <form onSubmit={form.onSubmit((values) => handlerSMSConfigurationSubmit(values))}>
                <Stack
                    h={600}
                    align="stretch"
                    justify="space-between"
                >
                    <Box>
                        {/* <Box pb={10}>
                            <Radio.Group
                                label="SMS Mode"
                                value={activeSmsGateway}
                                onChange={setActiveSmsGateway}
                            >
                                <Radio value="wordpress" label="Use Recommended Plugin" mb={10} color='orange' checked />
                                <Radio value="lazytasks" label="Use this SMS" mt={10} mb={10} color='orange' />
                            </Radio.Group>
                        </Box> */}
                        {/* {activeSmsGateway === 'lazytasks' && (
                            <>
                                <Box pb={10}>
                                    <TextInput
                                        size="md"
                                        withAsterisk
                                        label="API URL"
                                        placeholder="Enter api url"
                                        key={form.key('sms_api_url')}
                                        {...form.getInputProps('sms_api_url')}
                                        defaultValue={reveApiUrl}
                                    />
                                </Box>
                                <Box pb={10}>
                                    <TextInput
                                        autoComplete={false}
                                        size="md"
                                        withAsterisk
                                        label="API Key"
                                        placeholder="Enter api key"
                                        key={form.key('sms_api_key')}
                                        {...form.getInputProps('sms_api_key')}
                                        defaultValue={reveApiKey}
                                    />
                                </Box>
                                <Box pb={10}>
                                    <TextInput
                                        autoComplete={false}
                                        size="md"
                                        withAsterisk
                                        label="API Secret Key"
                                        placeholder="Enter api secret key"
                                        key={form.key('sms_api_secret_key')}
                                        {...form.getInputProps('sms_api_secret_key')}
                                        defaultValue={reveApiSecretKey}
                                    />
                                </Box>
                                <Box>
                                    <TextInput
                                        size="md"
                                        withAsterisk
                                        label="Sender Name"
                                        placeholder="Enter sender name"
                                        key={form.key('sms_sender_name')}
                                        {...form.getInputProps('sms_sender_name')}
                                        defaultValue={smsSenderName}
                                    />
                                </Box>
                            </>
                        )} */}

                        {is_wpsms_active && is_wpsms_active === true ? (
                            <Box>
                                <Group mb={10}>
                                    <ThemeIcon color="green" variant="light" radius="xl" size="lg">
                                        <IconCircleCheck size={20} />
                                    </ThemeIcon>
                                    <Text size="md" weight={700}>{translate('Recommended Plugin WP SMS is active')}</Text>
                                </Group>
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
                                                {translate('SMS Notifications')}
                                            </Text>
                                            <Text size="xs" c="dimmed">
                                                {translate('Send SMS notifications to users for various events.')}
                                            </Text>
                                        </Box>
                                    </Group>
                                    <Switch
                                        checked={isSmsEnabled}
                                        onChange={(event) => {
                                            const checked = event.currentTarget.checked;
                                            setIsSmsEnabled(checked);
                                            form.setFieldValue('is_sms_enabled', checked);
                                        }}
                                        color="orange"
                                        size="sm"
                                        radius="sm"
                                    />
                                </Group>
                            </Box>
                        ) : (
                            <Box pb={10}>
                                <Group mb={10}>
                                    <ThemeIcon color="red" variant="light" radius="xl" size="lg">
                                        <IconSquareRoundedX size={20} />
                                    </ThemeIcon>
                                    <Text size="md" weight={700}>{translate('Recommended Plugin WP SMS is not installed')}</Text>
                                </Group>
                                <Text size="sm" c="dimmed">
                                    We recommend using <Anchor href="https://wordpress.org/plugins/wp-sms" target="_blank" underline="always">WP SMS</Anchor> plugin.
                                </Text>
                                <Card withBorder mt={10} p={10} radius="md" bg={"#F8F9FA"}>
                                    <Text size="sm" c="dimmed">
                                        1. Install and activate the "WP SMS" plugin from the WordPress plugin repository.<br /><br />
                                        2. Navigate to the WP SMS settings page in your WordPress admin dashboard.<br /> <br />
                                        3. Choose your preferred SMS gateway and configure the necessary settings (API keys, sender ID, etc.).<br /> <br />
                                        4. Save your settings.<br /> <br />
                                        5. Test the configuration by sending a test SMS from the WP SMS settings page.
                                    </Text>
                                </Card>
                            </Box>
                        )}

                    </Box>

                    <Group justify="flex-start" mt={10}>
                        <Button variant="filled" color="#ED7D31" type="submit">{translate('Submit')}</Button>
                    </Group>
                </Stack>
            </form>

        </Fragment>
    );
};

export default SMSConfiguration;
