import React, { Fragment, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Button,
    Grid,
    Group,
    Paper,
    TextInput,
    Text,
    Box,
    Card,
    List,
    ThemeIcon,
    Anchor,
    ScrollArea,
    Switch,
    Badge,
    PasswordInput,
} from '@mantine/core';
import {
    IconBrandFacebook,
    IconBrandGoogle,
    IconBrandLinkedin,
    IconCircleCheck,
} from '@tabler/icons-react';
import { activateSocialLogin } from "../store/settingSlice";
import { showNotification } from "@mantine/notifications";
import { translate } from '../../../utils/i18n';
const SocialLoginSettings = () => {
    const dispatch = useDispatch();

    // const users = useSelector((state) => state.users);
    const { loggedInUser } = useSelector((state) => state.auth.session);
    const { socialLoginConfiguration } = useSelector((state) => state.settings.setting);

    const [isEnabledGoogle, setIsEnabledGoogle] = useState(false);
    const [isEnabledFacebook, setIsEnabledFacebook] = useState(false);
    const [isEnabledLinkedIn, setIsEnabledLinkedIn] = useState(false);
    const [clientId, setClientId] = useState('');
    const [clientSecret, setClientSecret] = useState('');

    const handleGoogleSubmit = (values) => {
        if (!clientId || !clientSecret) {
            showNotification({
                title: 'Validation Error',
                message: 'Please fill in all required fields.',
                color: 'red',
            });
            return;
        }
        const googleSettings = {
            google: {
                is_enabled: isEnabledGoogle,
                client_id: clientId,
                client_secret: clientSecret
            }
        };
        dispatch(activateSocialLogin({ social_login_settings: googleSettings })).then((response) => {
            if (response.payload && response.payload.status && response.payload.status === 200) {
                showNotification({
                    id: 'load-data',
                    loading: true,
                    title: 'Social Login Settings',
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
                    title: 'Social Login Settings',
                    message: response.payload && response.payload.message && response.payload.message,
                    autoClose: 2000,
                    disallowClose: true,
                    color: 'red',
                });
            }
        });
    };

    const handleGoogleSwitchChange = (checked) => {
        setIsEnabledGoogle(checked);
        const googleSettings = {
            google: {
                is_enabled: checked,
                client_id: clientId,
                client_secret: clientSecret
            }
        };
        dispatch(activateSocialLogin({ social_login_settings: googleSettings })).then((response) => {
            showNotification({
                title: 'Social Login Settings',
                message: response.payload?.message || 'Google login status updated',
                color: response.payload?.status === 200 ? 'green' : 'red',
            });
        });
    };

    useEffect(() => {
        if (socialLoginConfiguration && socialLoginConfiguration.google) {
            try {
                const googleData = socialLoginConfiguration.google;
                if (googleData && googleData.is_enabled) {
                    setIsEnabledGoogle(googleData.is_enabled);
                }
                if (googleData && googleData.client_id) {
                    setClientId(googleData.client_id);
                }
                if (googleData && googleData.client_secret) {
                    setClientSecret(googleData.client_secret);
                }
            } catch (error) {
                console.error("error:", error.message);
            }
        }

    }, [socialLoginConfiguration]);

    return (
        <Fragment>
            <Paper>
                <Box className="mb-4">
                    <Grid>
                        <Grid.Col span={{ sm: 12, md: 4, lg: 4, xl: 4 }}>
                            <Card p="lg" radius="md" withBorder h={"100%"}>
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
                                    <Group spacing="sm" justify='space-between' align='center'>
                                        <ThemeIcon variant='light' color="orange" size="lg" radius="xl">
                                            <IconBrandGoogle size={22} />
                                        </ThemeIcon>
                                        <Box>
                                            <Text size="md" weight={700}>
                                                {translate('Login with Google')}
                                            </Text>
                                            <Text size="xs" c="dimmed">
                                                {translate('Enable users to log in using their Google account.')}
                                            </Text>
                                        </Box>
                                    </Group>
                                    <Switch
                                        checked={isEnabledGoogle}
                                        onChange={(event) => handleGoogleSwitchChange(event.currentTarget.checked)}
                                        color="orange"
                                        size="sm"
                                        radius="sm"
                                    />
                                </Group>
                                {isEnabledGoogle && (

                                    <>
                                        <Box pt={10}>
                                            <Box pb={10}>
                                                <TextInput
                                                    autoComplete={false}
                                                    size="sm"
                                                    withAsterisk
                                                    label="Client ID"
                                                    placeholder="Enter Client ID"
                                                    value={clientId}
                                                    onChange={(event) => setClientId(event.currentTarget.value)}
                                                />
                                            </Box>
                                            <Box pb={10}>
                                                <PasswordInput
                                                    autoComplete={false}
                                                    size="sm"
                                                    withAsterisk
                                                    label="Client Secret"
                                                    placeholder="Enter Client Secret"
                                                    value={clientSecret}
                                                    onChange={(event) => setClientSecret(event.currentTarget.value)}
                                                />
                                            </Box>
                                        </Box>

                                        <Card withBorder p="md" radius="md" bg="#F8F9FA">
                                            <ScrollArea h={250} scrollbarSize={4}>
                                                <List spacing="xs" size="sm" center icon={<ThemeIcon color="#39758D" size={18} radius="xl"><IconCircleCheck size={14} /></ThemeIcon>}>
                                                    <List.Item>
                                                        <Text span fw={500}>Create a project from <Anchor href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer">Google Developers Console</Anchor> if none exists.</Text>
                                                    </List.Item>
                                                    <List.Item>
                                                        <Text span fw={500}>Go to Credentials tab, then create credential for OAuth client.</Text>
                                                    </List.Item>
                                                    <List.Item>
                                                        <Text span fw={500}>Select Web Application as Application type</Text>
                                                    </List.Item>
                                                    <List.Item>
                                                        <Text span fw={500}>Application type will be Web Application</Text>
                                                    </List.Item>
                                                    <List.Item>
                                                        <Text span fw={500}>Add {appLocalizer?.homeUrl} in Authorized redirect URIs</Text>
                                                    </List.Item>
                                                    <List.Item>
                                                        <Text span fw={500}>This will give you Client ID and Secret key.</Text>
                                                    </List.Item>
                                                    <List.Item>
                                                        Copy your <Text span fw={500}>Client ID</Text> and <Text span fw={500}>Client Secret</Text> for use in your application.
                                                    </List.Item>
                                                </List>
                                            </ScrollArea>
                                        </Card>
                                        <Group justify="flex-start" mt={5}>
                                            <Button variant="filled" color="#ED7D31" onClick={handleGoogleSubmit}>{translate('Save Changes')}</Button>
                                        </Group>
                                    </>
                                )}


                            </Card>
                        </Grid.Col>

                        <Grid.Col span={{ sm: 12, md: 4, lg: 4, xl: 4 }}>
                            <Card p="lg" radius="md" withBorder bg={"#EBF1F4"}>
                                <Badge
                                    color="orange"
                                    variant="filled"
                                    style={{
                                        position: 'absolute',
                                        top: 10,
                                        right: 10,
                                        zIndex: 1,
                                    }}
                                >
                                    {translate('Coming Soon')}
                                </Badge>
                                <Group
                                    position="apart"
                                    spacing="xs"
                                    justify='space-between'
                                    style={{
                                        padding: '12px 16px',
                                        border: '1px solid #fff',
                                        borderRadius: 8,
                                        backgroundColor: '#EBF1F4',
                                        cursor: 'pointer',
                                        opacity: 1,
                                        width: '100%',
                                    }}
                                >
                                    <Group spacing="sm" justify='space-between'>
                                        <ThemeIcon variant='light' color="#1877F2" size="lg" radius="xl">
                                            <IconBrandFacebook size={22} />
                                        </ThemeIcon>

                                        <Box>
                                            <Text size="md" weight={700}>
                                                {translate('Login with Facebook')}
                                            </Text>
                                            <Text size="xs" c="dimmed">
                                                {translate('Enable users to log in using their Facebook account.')}
                                            </Text>
                                        </Box>
                                    </Group>
                                    <Switch
                                        checked={isEnabledFacebook}
                                        onChange={(event) => {
                                            const checked = event.currentTarget.checked;
                                            setIsEnabledFacebook(checked);
                                        }}
                                        color="orange"
                                        size="sm"
                                        radius="sm"
                                        disabled
                                    />
                                </Group>


                            </Card>
                        </Grid.Col>

                        <Grid.Col span={{ sm: 12, md: 4, lg: 4, xl: 4 }}>
                            <Card p="lg" radius="md" withBorder bg={"#EBF1F4"}>
                                <Badge
                                    color="orange"
                                    variant="filled"
                                    style={{
                                        position: 'absolute',
                                        top: 10,
                                        right: 10,
                                        zIndex: 1,
                                    }}
                                >
                                    {translate('Coming Soon')}
                                </Badge>
                                <Group
                                    position="apart"
                                    spacing="xs"
                                    justify='space-between'
                                    style={{
                                        padding: '12px 16px',
                                        border: '1px solid #fff',
                                        borderRadius: 8,
                                        backgroundColor: '#EBF1F4',
                                        cursor: 'pointer',
                                        opacity: 1,
                                        width: '100%',
                                    }}
                                >
                                    <Group spacing="sm" justify='space-between'>

                                        <ThemeIcon variant='light' color="#0A66C2" size="lg" radius="xl">
                                            <IconBrandLinkedin size={22} />
                                        </ThemeIcon>

                                        <Box>
                                            <Text size="md" weight={700}>
                                                {translate('Login with LinkedIn')}
                                            </Text>
                                            <Text size="xs" c="dimmed">
                                                {translate('Enable users to log in using their LinkedIn account.')}
                                            </Text>
                                        </Box>
                                    </Group>
                                    <Switch
                                        checked={isEnabledLinkedIn}
                                        onChange={(event) => {
                                            const checked = event.currentTarget.checked;
                                            setIsEnabledLinkedIn(checked);
                                        }}
                                        color="orange"
                                        size="sm"
                                        radius="sm"
                                        disabled
                                    />
                                </Group>


                            </Card>
                        </Grid.Col>
                    </Grid>
                </Box>
            </Paper>
        </Fragment >
    );
};

export default SocialLoginSettings;
