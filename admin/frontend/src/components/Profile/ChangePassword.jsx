import React, { useEffect, useState } from 'react';
import {
    TextInput,
    PasswordInput,
    Text,
    Paper,
    Group,
    PaperProps,
    Button,
    Avatar,
    FileInput,
    Divider,
    Box,
    Select, LoadingOverlay,
} from '@mantine/core';
import { IconPhoto, IconDeviceFloppy } from '@tabler/icons-react';
import { useDispatch, useSelector } from "react-redux";
import { useNavigate} from 'react-router-dom';
import PhoneInput from 'react-phone-number-input';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { fetchAllRoles } from "../../store/auth/roleSlice";
import { useForm } from '@mantine/form';
import appConfig from "../../configs/app.config";
import { showNotification } from "@mantine/notifications";
const ChangePassword = ({ onSuccess }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { loggedInUser } = useSelector((state) => state.auth.session);

    const [message, setMessage] = useState('');
    const [visible, setVisible] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm({
        initialValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
        validate: {
            currentPassword: (value) => (
                value.length < 1 ? 'Password is required' : (value.length < 6 ? 'Password is min 6 character' : null)
            ),
            newPassword: (value) => (
                value.length < 1 ? 'Password is required' : (value.length < 6 ? 'Password is min 6 character' : null)
            ),
            confirmPassword: (value, values) => (
                value !== values.newPassword ? 'Confirm passwords do not match' : null
            ),
        },
    });

    const handlePasswordReset = async (values) => {
        setIsSubmitting(true);
        setVisible(true);

        const data = {
            currentPassword: values.currentPassword,
            newPassword: values.newPassword,
            confirmPassword: values.confirmPassword,
            user_id: loggedInUser?.loggedUserId,
        };

        const response = await fetch(`${appConfig.liveApiUrl}/change-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        const result = await response.json();
        console.log(result);

        if (response.status === 200) {
            setVisible(false);
            setIsSubmitting(false);
            showNotification({
                id: 'load-data',
                loading: false,
                title: 'User',
                message: result.message || 'Password Changed successfully.',
                autoClose: 2000,
                disallowClose: true,
                color: 'green',
            });
            navigate('/dashboard');
            if (onSuccess) {
                onSuccess();
            }
        } else {
            setIsSubmitting(false);
            showNotification({
                id: 'load-data',
                loading: false,
                title: 'User',
                message: result.message || 'Failed to change password.',
                autoClose: 2000,
                disallowClose: true,
                color: 'red',
            });
            setVisible(false);
        }

    };

    return (
        <>
            <LoadingOverlay
                visible={visible}
                zIndex={1000}
                overlayProps={{ radius: 'sm', blur: 2 }}
            />
            <form onSubmit={form.onSubmit(handlePasswordReset)}>
                <Paper radius="md" p="lg" withBorder maw={500} mx="auto">
                    <Text size="lg" ta="center" fw={700}>
                        Change Password
                    </Text>

                    <Box mb="md">
                        <PasswordInput
                            label="Current Password"
                            placeholder="Current Password"
                            mt="sm"
                            {...form.getInputProps('currentPassword')}
                        />

                        <PasswordInput
                            label="New Password"
                            placeholder="New Password"
                            mt="sm"
                            {...form.getInputProps('newPassword')}
                        />

                        <PasswordInput
                            label="Confirm Password"
                            placeholder="Confirm New Password"
                            mt="sm"
                            {...form.getInputProps('confirmPassword')}
                        />
                    </Box>

                    <Button type="submit"
                        leftIcon={<IconDeviceFloppy size="1rem" />}
                        fullWidth
                        color="#ED7D31"
                    >
                        Confirm
                    </Button>
                </Paper>
            </form>
        </>
    );

}

export default ChangePassword;