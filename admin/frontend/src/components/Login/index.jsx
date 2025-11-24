import React, { Fragment, useEffect, useState } from 'react';
import { Button, Container, Group, ScrollArea, Select, TextInput, Text, Box, Title, Image, PasswordInput } from '@mantine/core';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from '@mantine/form';
import { Link } from 'react-router-dom';
import useAuth from "../../utils/useAuth";
import logo from "../../img/logo.png"
import { showNotification } from "@mantine/notifications";
import { fatchLazytasksConfig } from "../Settings/store/settingSlice";
import LoginWithGoogle from './LoginWithGoogle';

const Login = () => {
    const dispatch = useDispatch();
    const { lazytasksSiteSettings, socialLoginConfiguration } = useSelector((state) => state.settings.setting);
    const [loading, setLoading] = useState(false);
    let siteTitle = '';
    let siteLogo = logo; // fallback to default logo
    if (lazytasksSiteSettings && lazytasksSiteSettings.core_setting) {
        try {
            const core = JSON.parse(lazytasksSiteSettings.core_setting);
            if (core.site_title) siteTitle = core.site_title;
            if (core.site_logo) siteLogo = core.site_logo;
        } catch (e) {
            // fallback to defaults
        }
    }

    useEffect(() => {
        dispatch(fatchLazytasksConfig());
    }, [dispatch]);

    const form = useForm({
        initialValues: {
            email: '',
            password: '',
        },

        validate: {
            // email: (value) => (value.length < 1 ? 'Email/Username is required' : (/^\S+@\S+$/.test(value) ? null : 'Invalid email')),
            email: (value) => (value.length < 2 ? 'Email/Username is required' : null),
            password: (value) => (value.length < 2 ? 'Password name is required' : null),
        },
    });

    const { signIn } = useAuth()
    const onSignIn = async (values) => {
        setLoading(true);
        const { email, password } = values

        // Simulate a delay for testing
        await new Promise((resolve) => setTimeout(resolve, 100));
        
        const result = await signIn({ email, password })
        setLoading(false);

        if (result.status !== 200) {
            showNotification({
                title: 'Error',
                message: result && result.message && result.message,
                color: 'red',
                autoClose: 2000,
                disallowClose: true,
            });

        }

    }
    const handleSubmit = (values) => {
        onSignIn(values)
        // form.reset();
        // Perform form submission or other actions here
    };

    return (
        <Fragment>
            <div className='dashboard h-screen'>
                <Container size="full">
                    <div className="h-screen lm-profile-form flex flex-col items-center justify-center">
                        <Title className="text-center" order={3} mb={8}>{siteTitle}</Title>
                        <Box m={4} p={32} radius="lg" bg="white" shadow="sm" style={{ maxWidth: '550px' }} className=" w-[416px]">
                            <Image
                                style={{ width: 'auto', marginLeft: 'auto', marginRight: 'auto', padding: '5px' }}
                                radius="md"
                                src={siteLogo}
                                alt={siteTitle}
                            />
                            <div className="items-center text-center mb-4 mt-4">
                                <Title className="text-center" order={3}>Login</Title>
                            </div>
                            <form onSubmit={form.onSubmit(handleSubmit)}>

                                <TextInput
                                    type="text"
                                    placeholder="Email/Username"
                                    mb={16}
                                    {...form.getInputProps('email')}
                                    radius="sm"
                                    size="md"
                                    styles={{
                                        width: '100%',
                                        borderColor: 'gray.3',
                                        backgroundColor: 'white',
                                        focus: {
                                            borderColor: 'blue.5',
                                        },
                                    }}
                                />

                                <PasswordInput
                                    size="md"
                                    mb={12}
                                    {...form.getInputProps('password')}
                                    radius="sm"
                                    placeholder="Password"
                                    styles={{
                                        width: '100%',
                                        borderColor: 'gray.3',
                                        backgroundColor: 'white',
                                        focus: {
                                            borderColor: 'blue.5',
                                        },
                                    }}
                                />


                                <div className="mb-3 text-right">
                                    <Link to="/forget-password"
                                        className="text-orange-500 font-semibold text-sm leading-normal text-center mt-24 mb-24 focus:shadow-none">
                                        Forgot Password?
                                    </Link>
                                </div>
                                <Button
                                    type="submit"
                                    variant="filled"
                                    color="orange"
                                    radius="sm"
                                    size="md"
                                    mb={15}
                                    style={{ width: '100%' }}
                                    loading={loading}
                                    disabled={loading}
                                    loaderProps={{ type: 'dots' }}
                                >
                                    Log in
                                </Button>
                                {socialLoginConfiguration?.social_login_enabled &&
                                    socialLoginConfiguration?.google?.is_enabled &&
                                    socialLoginConfiguration?.google?.client_id && (
                                        <LoginWithGoogle />
                                    )}
                            </form>
                        </Box>
                    </div>
                </Container>
            </div>
        </Fragment>
    );
};

export default Login;
