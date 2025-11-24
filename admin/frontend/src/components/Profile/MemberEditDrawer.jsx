import React, { Fragment, useEffect, useState } from 'react';
import {
    TextInput,
    Text,
    Paper,
    Group,
    Button,
    Avatar,
    FileInput,
    Box,
    Select, LoadingOverlay, Drawer, Title
} from '@mantine/core';
import { IconPhoto, IconDeviceFloppy } from '@tabler/icons-react';
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from 'react-router-dom';
import PhoneInput from 'react-phone-number-input';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { fetchAllRoles } from "../../store/auth/roleSlice";
import {
    closeProfileDrawer,
    editUser,
} from "../../store/auth/userSlice";
import { useForm } from '@mantine/form';
import { hasPermission } from "../ui/permissions";
import { showNotification } from "@mantine/notifications";
import useAuth from "../../utils/useAuth";
import appConfig from "../../configs/app.config";
import { translate } from '../../utils/i18n';
const MemberEditDrawer = () => {


    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { user, profileDrawerOpened, profileDrawerClose, isLoading } = useSelector((state) => state.auth.user);
    const { loggedInUser } = useSelector((state) => state.auth.session);
    const icon = <IconPhoto style={{ width: "32px", height: "32px" }} stroke={1.5} />;

    const { roles } = useSelector((state) => state.auth.role);
    const [file, setFile] = useState(null);
    const [isResetting, setIsResetting] = useState(false);
    const handleFileUpload = (file) => {
        setFile(file);
    };

    const form = useForm({
        name: user && user.id ? user.id : null,
        initialValues: {
            firstName: user && user.firstName ? user.firstName : '',
            lastName: user && user.lastName ? user.lastName : '',
            email: user && user.email ? user.email : '',
            phoneNumber: user && user.phoneNumber ? user.phoneNumber : '',
            roles: user && user.llc_roles && user.llc_roles.length > 0 ? [{ id: user.llc_roles[0].id, name: user.llc_roles[0].name }] : [],
        },
        enableReinitialize: true,
        validate: {
            firstName: (value) => (value.length < 2 ? translate('First name is required') : null),
            email: (value) => (value.length < 1 ? translate('Email is required') : (/^\S+@\S+$/.test(value) ? null : translate('Invalid email'))),
            phoneNumber: (value) => (value && !isValidPhoneNumber(value) ? translate('Invalid phone number') : null),
        },

    });

    const handleSubmit = (values) => {
        const formData = new FormData();

        formData.append('firstName', values.firstName);
        formData.append('lastName', values.lastName);
        formData.append('email', values.email);
        formData.append('phoneNumber', values.phoneNumber);
        formData.append('roles', JSON.stringify(values.roles));
        formData.append('file', file);

        dispatch(editUser({ id: user && user.id, data: formData })).then((response) => {
            if (response.payload && response.payload.status && response.payload.status === 200) {
                showNotification({
                    id: 'load-data',
                    loading: true,
                    title: 'User',
                    message: response.payload && response.payload.message && response.payload.message,
                    autoClose: 2000,
                    disallowClose: true,
                    color: 'green',
                });

                setFile(null);

                setTimeout(() => {
                    dispatch(closeProfileDrawer());
                }, 500);

            }
            if (response.payload && response.payload.status && response.payload.status !== 200) {
                showNotification({
                    id: 'load-data',
                    loading: true,
                    title: 'User',
                    message: response.payload && response.payload.message && response.payload.message,
                    autoClose: 2000,
                    disallowClose: true,
                    color: 'red',
                });
            }
        }
        );
    };

    useEffect(() => {
        if (user) {
            form.setFieldValue('firstName', user.firstName);
            form.setFieldValue('lastName', user.lastName);
            form.setFieldValue('email', user.email);
            form.setFieldValue('phoneNumber', user.phoneNumber);
            form.setFieldValue('roles', user && user.llc_roles && user.llc_roles.length > 0 ? [{ id: user.llc_roles[0].id, name: user.llc_roles[0].name }] : []);
        }
    }, [user]);

    const onUserRoleChangeHandler = (e) => {
        if (e) {
            form.setFieldValue('roles', [{ id: e.value, name: e.label }]);
        } else {
            form.setFieldValue('roles', []);
        }
    };

    const opened = useSelector((state) => state.auth.user.profileDrawerOpened);


    const { forgetPassword } = useAuth()
    const handleForgetPassword = async (value) => {
        setIsResetting(true);
        // const { email, password } = values
        const email = value;
        const result = await forgetPassword({ email })
        if (result.status === 200) {
            setIsResetting(false);
            dispatch(closeProfileDrawer());

            showNotification({
                id: 'load-data',
                loading: true,
                title: 'User',
                message: result.message,
                autoClose: 2000,
            });
        } else {
            setIsResetting(false);
            showNotification({
                id: 'load-data',
                loading: true,
                title: 'User',
                message: result.message || 'Something went wrong, please try again.',
                autoClose: 2000,
                disallowClose: true,
                color: 'red',
            });
        }

    }

    return (
        <>
            {opened &&
                <Drawer
                    opened={opened}
                    onClose={() => dispatch(closeProfileDrawer())}
                    position="right"
                    withCloseButton={false}
                    size="md"
                    overlayProps={{ backgroundOpacity: 0.5, blur: 1 }}
                // withinPortal={false}
                >

                    <div className={`workspace-create-card w-full p-2 ${appLocalizer?.is_admin ? 'mt-6' : ''}`}>
                        <div className="relative flex justify-between mb-4">
                            <Title order={4}>
                                {translate('Profile')}
                            </Title>
                            <Drawer.CloseButton />
                        </div>
                        <LoadingOverlay
                            visible={isLoading}
                            zIndex={1000}
                            overlayProps={{ radius: 'sm', blur: 4 }}
                        />
                        {!isLoading && (
                            <Fragment>
                                <Paper className={`mb-4`} radius="md" p="sm" withBorder maw={500}>

                                    <form onSubmit={form.onSubmit((values) => handleSubmit(values))}>

                                        <Group justify="space-between" mb="sm">
                                            <Text size="lg" fw={500}>
                                                {translate('Edit Member')}
                                            </Text>
                                            {user && user.avatar &&
                                                <Avatar src={user?.avatar} alt={user?.name} radius="xl" size={40} />
                                            }

                                        </Group>

                                        <FileInput
                                            className={`!w-full`}
                                            size="md"
                                            mb="xs"
                                            accept="image/png,image/jpeg,image/jpg"
                                            clearable
                                            placeholder={translate('Upload Profile Picture')}
                                            leftSection={icon}
                                            leftSectionPointerEvents="none"
                                            onChange={handleFileUpload}
                                        />

                                        <Box mb="md" mt="md">
                                            <Group grow>
                                                <TextInput
                                                    size="sm"
                                                    label={translate('First Name')}
                                                    placeholder={translate('First Name')}
                                                    {...form.getInputProps('firstName')}
                                                />
                                                <TextInput
                                                    size="sm"
                                                    label={translate('Last Name')}
                                                    placeholder={translate('Last Name')}
                                                    {...form.getInputProps('lastName')}
                                                />
                                            </Group>

                                            {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['manage-users']) &&
                                                <div className="mb-2 mt-2">
                                                    <Select
                                                        label={translate('Select Role')}
                                                        size="sm"
                                                        placeholder={translate('Select Role')}
                                                        data={roles && roles.length > 0 && roles.map((role) => ({
                                                            value: role.id,
                                                            label: role.name
                                                        }))}
                                                        defaultValue={user && user.llc_roles && user.llc_roles.length > 0 ? user.llc_roles[0].id.toString() : null}
                                                        searchable
                                                        allowDeselect={false}
                                                        onChange={(e, option) => {
                                                            onUserRoleChangeHandler(option);
                                                        }}
                                                    />
                                                </div>
                                            }

                                            <div className="mt-4">
                                                <Text size="sm" fw={500}>
                                                    {translate('Phone')}
                                                </Text>
                                                <PhoneInput
                                                    international
                                                    defaultCountry="BD"
                                                    className="w-full"
                                                    numberInputProps={{
                                                        className: "border !border-gray-300 rounded-md focus:outline-none focus:ring focus:border-blue-300 h-[40px]"
                                                    }}
                                                    countrySelectProps={{
                                                        className: "border !border-gray-300 rounded-l-md focus:outline-none focus:ring focus:border-blue-300 h-[40px]"
                                                    }}
                                                    placeholder="+12 344 678 98"
                                                    label={translate('Phone')}
                                                    {...form.getInputProps('phoneNumber')}
                                                />
                                                {form.errors.phoneNumber && (
                                                    <Text c="red" mt={2}>
                                                        {form.errors.phoneNumber}
                                                    </Text>
                                                )}

                                            </div>

                                            <TextInput
                                                label={translate('Email')}
                                                placeholder={translate('Your email')}
                                                mt="sm"
                                                {...form.getInputProps('email')}
                                            />
                                        </Box>

                                        <Button
                                            type="submit"
                                            leftIcon={<IconDeviceFloppy size="1rem" />}
                                            fullWidth
                                            color="#ED7D31"
                                        >
                                            {translate('Save Changes')}
                                        </Button>
                                    </form>

                                </Paper>

                                <Group justify="center">
                                    <Button
                                        onClick={() => handleForgetPassword(user.email)}
                                        variant="outline" color="orange"
                                        disabled={isResetting}
                                        loading={isResetting}
                                        loaderProps={{ type: 'dots' }}
                                    >
                                        {translate('Reset Password')}
                                    </Button>
                                </Group>
                            </Fragment>
                        )}
                    </div>
                </Drawer>
            }


        </>
    );

}

export default MemberEditDrawer;