import { Modal, Tabs, Anchor, Text, Flex, List, Title, Button, Image, Grid, Box, Card, Stack, ActionIcon, TextInput, Textarea, Group, Divider, ThemeIcon } from '@mantine/core';
import { IconCheck, IconMessage2, IconX } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { sendFeedbackForm } from "../Settings/store/settingSlice";
import { showNotification, updateNotification } from '@mantine/notifications'

export function FeedbackFormWithoutModal() {
    const dispatch = useDispatch();

    const [form, setForm] = useState({ name: '', email: '', message: '' });
    const [errors, setErrors] = useState({ email: null });
    const [submitting, setSubmitting] = useState(false);

    // Basic email regex
    const isValidEmail = (email) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const handleChange = (field) => ({ target }) => {
        const value = target.value;
        setForm((prev) => ({ ...prev, [field]: value }));

        if (field === 'email') {
            setErrors((prev) => ({
                ...prev,
                email: isValidEmail(value) ? null : 'Invalid email address',
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        // Basic validation
        if (!form.name || !form.email || !form.message) {
            showNotification({
                title: 'Validation Error',
                message: 'Please fill in all fields.',
                color: 'red',
            });
            setSubmitting(false);
            return;
        }

        showNotification({
            id: 'load-data',
            loading: true,
            title: 'Feedback',
            message: "Sending the feedback...",
            disallowClose: true,
            color: 'green',
            styles: () => ({
                root: {
                    zIndex: 3000,
                },
            }),
        });

        dispatch(sendFeedbackForm(form)).then((response) => {
            setSubmitting(false);
            if (response.payload && response.payload.status && response.payload.status === 200) {
                // Simulate successful form submission
                updateNotification({
                    id: 'load-data',
                    title: 'Feedback Sent',
                    message: 'Thank you for your feedback!',
                    icon: <IconCheck />,
                    color: 'teal',
                    autoClose: 3000,
                });
                setForm({ name: '', email: '', message: '' });
            } else {
                updateNotification({
                    id: 'load-data',
                    loading: true,
                    title: 'Feedback Sent',
                    message: response.payload && response.payload.message && response.payload.message,
                    autoClose: 2000,
                    disallowClose: true,
                    color: 'red',
                });
            }
        }).catch((error) => {
            setSubmitting(false);
            updateNotification({
                id: 'load-data',
                loading: true,
                title: 'Feedback Error',
                message: response.payload && response.payload.message && response.payload.message,
                autoClose: 2000,
                disallowClose: true,
                color: 'red',
            });
        });
        // Reset form
        setForm({ name: '', email: '', message: '' });
    };

    return (
        <Box className={`w-full`} p="md" bg="#FAFAFA" style={{ borderRadius: 12, boxShadow: '0 2px 12px #0001' }}>
            <form onSubmit={handleSubmit}>
                <Stack gap={`xs`} spacing="xs">
                    <TextInput
                        label="Name"
                        placeholder="Your name"
                        value={form.name}
                        onChange={handleChange('name')}
                        withAsterisk
                        radius="md"
                        required
                    />
                    <TextInput
                        label="Email"
                        placeholder="your@email.com"
                        value={form.email}
                        error={errors.email}
                        onChange={handleChange('email')}
                        withAsterisk
                        radius="md"
                        required
                    />
                    <Textarea
                        label="Message"
                        placeholder="Write your message..."
                        value={form.message}
                        onChange={handleChange('message')}
                        minRows={3}
                        withAsterisk
                        autosize
                        required
                    />
                    <Button
                        variant="filled"
                        color="#ED7D31"
                        type="submit"
                        fullWidth
                        loaderProps={{ type: 'dots' }}
                        loading={submitting}
                        disabled={submitting}
                    >
                        Submit
                    </Button>
                </Stack>
            </form>
        </Box>
    );
}