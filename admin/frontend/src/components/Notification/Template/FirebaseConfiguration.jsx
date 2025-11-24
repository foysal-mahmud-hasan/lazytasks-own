import React, { Fragment, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    Button,
    Group,
    Paper,
    Stack,
    Switch,
    Textarea,
    TextInput,
    Text,
    Overlay,
    Badge,
} from '@mantine/core';
import { useForm } from "@mantine/form";
import { editSetting, fetchSettings } from "../../Settings/store/settingSlice";
import { showNotification } from "@mantine/notifications";
import { translate } from '../../../utils/i18n';
import { IconDeviceMobileStar } from '@tabler/icons-react';
const FirebaseConfiguration = () => {
    // const users = useSelector((state) => state.users);
    const { loggedInUser } = useSelector((state) => state.auth.session)
    const { settings, is_lazytasks_premium_active } = useSelector((state) => state.settings.setting)

    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(fetchSettings());
    }, [dispatch]);

    const [firebaseClientEmail, setFirebaseClientEmail] = useState('');
    const [firebasePrivateKey, setFirebasePrivateKey] = useState('');
    const [isFirebaseEnabled, setIsFirebaseEnabled] = useState(false);
    const [wordpressClientEmail, setWordpressClientEmail] = useState('');
    const [wordpressPrivateKey, setWordpressPrivateKey] = useState('');

    const form = useForm({
        mode: 'uncontrolled',
        initialValues: {
            is_firebase_enabled: isFirebaseEnabled || false,
            firebase_client_email: firebaseClientEmail || '',
            firebase_private_key: firebasePrivateKey || '',
            wordpress_client_email: wordpressClientEmail || '',
            wordpress_private_key: wordpressPrivateKey || '',
        },

        validate: {
            firebase_client_email: (value) => (value.length < 1 ? 'Email is required' : null),
            firebase_private_key: (value) => (value.length < 1 ? 'Private key is required' : null),
        },
    });

    useEffect(() => {
        if (settings && settings.firebase_configuration) {
            try {
                // Parse the JSON string
                const parsedData = JSON.parse(settings.firebase_configuration);

                // Check if the parsedData is defined and contains the sms_api_secret_key key
                if (parsedData && parsedData.wordpress_client_email) {
                    setWordpressClientEmail(parsedData.wordpress_client_email);
                    form.setFieldValue('wordpress_client_email', parsedData.wordpress_client_email);
                }
                if (parsedData && parsedData.wordpress_private_key) {
                    setWordpressPrivateKey(parsedData.wordpress_private_key);
                    form.setFieldValue('wordpress_private_key', parsedData.wordpress_private_key);
                }
                if (parsedData && parsedData.is_firebase_enabled) {
                    setIsFirebaseEnabled(parsedData.is_firebase_enabled);
                    form.setFieldValue('is_firebase_enabled', parsedData.is_firebase_enabled);
                }
                if (parsedData && parsedData.firebase_client_email) {
                    setFirebaseClientEmail(parsedData.firebase_client_email);
                    form.setFieldValue('firebase_client_email', parsedData.firebase_client_email);
                }
                if (parsedData && parsedData.firebase_private_key) {
                    setFirebasePrivateKey(parsedData.firebase_private_key);
                    form.setFieldValue('firebase_private_key', parsedData.firebase_private_key);
                }

            } catch (error) {
                console.error("JSON parsing error:", error.message);
            }
        }
    }, [settings]);

    const handlerFirebaseConfigurationSubmit = (values) => {
        const formData = new FormData();
        formData.append('settings', JSON.stringify({ ...settings, firebase_configuration: values, type: 'firebase' }));
        dispatch(editSetting({ data: formData })).then((response) => {
            if (response.payload && response.payload.status && response.payload.status === 200) {
                showNotification({
                    id: 'load-data',
                    loading: true,
                    title: 'Firebase Settings',
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
                    title: 'Firebase Settings',
                    message: response.payload && response.payload.message && response.payload.message,
                    autoClose: 2000,
                    disallowClose: true,
                    color: 'red',
                });
            }
        });
        // dispatch(editSetting({ data: {...settings, firebase_configuration: values , type:'sms'} }));
    };

    return (
        <Fragment>
            <Paper>
                <form onSubmit={form.onSubmit((values) => handlerFirebaseConfigurationSubmit(values))}>
                    {is_lazytasks_premium_active === false && (
                        <>
                            <Overlay
                                blur={2}
                                opacity={0.7}
                                color="#fff"
                                zIndex={10}
                            />
                            <Group
                                pos="absolute"
                                top="50%"
                                left="50%"
                                style={{
                                    transform: 'translate(-50%, -50%)',
                                    zIndex: 20,
                                }}
                            >
                                <Badge size="lg" color="orange" variant="filled" radius="lg" leftSection={<IconDeviceMobileStar size={16} style={{ marginRight: 4 }} />}>
                                    {translate('Pro Feature')}
                                </Badge>
                            </Group>
                        </>
                    )}
                    <Stack
                        h={550}
                        align="stretch"
                        justify="flex-start"
                    >
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
                                        {translate('Firebase Notifications')}
                                    </Text>
                                    <Text size="xs" c="dimmed">
                                        {translate('Send Push notifications to users for various events.')}
                                    </Text>
                                </Box>
                            </Group>
                            <Switch
                                checked={isFirebaseEnabled}
                                onChange={(event) => {
                                    const checked = event.currentTarget.checked;
                                    setIsFirebaseEnabled(checked);
                                    form.setFieldValue('is_firebase_enabled', checked);
                                }}
                                color="orange"
                                size="sm"
                                radius="sm"
                            />
                        </Group>
                        {isFirebaseEnabled && (
                            <Box>
                                <Box pb={10}>
                                    <TextInput
                                        size="md"
                                        withAsterisk
                                        label={translate('Client Email')}
                                        placeholder={translate('Enter Client Email')}
                                        key={form.key('firebase_client_email')}
                                        {...form.getInputProps('firebase_client_email')}
                                        defaultValue={firebaseClientEmail}
                                    />
                                </Box>
                                <Box pb={10}>
                                    <Textarea
                                        resize="vertical"
                                        size="lg"
                                        rows={10}
                                        withAsterisk
                                        label={translate('Private Key')}
                                        placeholder={translate('Enter Private Key')}
                                        key={form.key('firebase_private_key')}
                                        {...form.getInputProps('firebase_private_key')}
                                        defaultValue={firebasePrivateKey}
                                    />
                                </Box>
                            </Box>
                        )}

                    </Stack>

                    <Group justify="flex-start" mt={10}>
                        <Button variant="filled" color="#ED7D31" type="submit">{translate('Submit')}</Button>
                    </Group>
                </form>
            </Paper>

        </Fragment>
    );
};

export default FirebaseConfiguration;
