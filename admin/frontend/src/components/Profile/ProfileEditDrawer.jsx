import React, { useEffect, useState } from 'react';
import {
    TextInput,
    Text,
    Paper,
    Group,
    Button,
    Avatar,
    FileInput,
    Box,
    Select, LoadingOverlay
} from '@mantine/core';
import { IconDeviceFloppy, IconUpload } from '@tabler/icons-react';
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from 'react-router-dom';
import PhoneInput from 'react-phone-number-input';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { fetchAllRoles } from "../../store/auth/roleSlice";
import { createUser, editUser, fetchUser, uploadProfilePhoto } from "../../store/auth/userSlice";
import { useForm } from '@mantine/form';
import { hasPermission } from "../ui/permissions";
import { showNotification } from "@mantine/notifications";
import { translate } from '../../utils/i18n';
import { setLoggedInUser } from '../../store/auth/sessionSlice';
const ProfileEditDrawer = ({ onSuccess }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const { user } = useSelector((state) => state.auth.user);
    const { loggedInUser } = useSelector((state) => state.auth.session);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const icon = <IconUpload size={22} stroke={1.25} />;

    const id = loggedInUser?.loggedUserId;

    // console.log(id);
    // return;

    useEffect(() => {
        dispatch(fetchAllRoles());
        dispatch(fetchUser(id)).then((response) => {
            if (response.payload && response.payload.status && response.payload.status === 200) {
                setTimeout(() => {
                    setLoading(false);
                }, 500);
            }
        });
    }, [dispatch, id, refreshKey]);
    const { roles } = useSelector((state) => state.auth.role);
    const [file, setFile] = useState(null);
    const handleFileUpload = (file) => {
        setFile(file);
    };

    const form = useForm({
        name: user && user.id ? user.id : id,
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
        setIsSubmitting(true);
        const formData = new FormData();

        formData.append('firstName', values.firstName);
        formData.append('lastName', values.lastName);
        formData.append('email', values.email);
        formData.append('phoneNumber', values.phoneNumber);
        formData.append('roles', JSON.stringify(values.roles));
        formData.append('file', file);

        dispatch(editUser({ id: id, data: formData })).then((response) => {
            setIsSubmitting(false);
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

                setRefreshKey((prevKey) => prevKey + 1);
                setFile(null);
                const userData = response.payload.data;
                const user = {
                    "authority": userData.roles,
                    "loggedUserId": userData.user_id,
                    "name": userData.name,
                    "email": userData.email,
                    "roles": userData.roles,
                    "llc_roles": userData.llc_roles,
                    "llc_permissions": userData.llc_permissions,
                    "avatar": userData.avatar
                }
                dispatch(setLoggedInUser(user || {}))

                if (onSuccess) {
                    onSuccess();
                }
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
        }).catch(() => {
            setIsSubmitting(false);
        });
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

    return (
        <>
            <LoadingOverlay
                visible={loading}
                zIndex={1000}
                overlayProps={{ radius: 'sm', blur: 4 }}
            />
            {!loading && (
                <form onSubmit={form.onSubmit((values) => handleSubmit(values))}>
                    <Paper radius="md" p="lg" withBorder maw={500}>

                        <Group justify="space-between" mb="sm">
                            <Text size="lg" fw={500}>
                                {translate('Edit Profile')}
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
                            loading={isSubmitting}
                            loaderProps={{ type: 'dots' }}
                            disabled={isSubmitting}
                        >
                            {translate('Save Changes')}
                        </Button>
                    </Paper>
                </form>
            )}
        </>
    );

}

export default ProfileEditDrawer;