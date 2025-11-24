import React, { Fragment, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Switch,
    Button,
    Grid,
    Group,
    Paper,
    TextInput,
    Text,
    Box,
} from '@mantine/core';
import { useForm } from "@mantine/form";
import { editSetting, fetchSettings, fetchTimezoneOptions } from "../store/settingSlice";
import { showNotification } from "@mantine/notifications";
import { translate } from '../../../utils/i18n';
const SerialSettings = () => {
    // const users = useSelector((state) => state.users);
    const { loggedInUser } = useSelector((state) => state.auth.session)
    const { settings, currentTimezone } = useSelector((state) => state.settings.setting)
    const { timezones } = useSelector((state) => state.settings.setting)
    const { serialSettings } = useSelector((state) => state.settings.setting)
    const [selectedTimezone, setSelectedTimezone] = useState('');
    const [isSerialEnabled, setIsSerialEnabled] = useState(false);
    const [serialNumber, setSerialNumber] = useState('');
    const [serialError, setSerialError] = useState('');
    const [isSerialSubmitted, setIsSerialSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(fetchSettings());
        dispatch(fetchTimezoneOptions());
    }, [dispatch]);

    const [siteTitle, setSiteTitle] = useState('');
    const [siteLogoPath, setSiteLogoPath] = useState('');

    const [file, setFile] = useState(null);
    const handleFileUpload = (file) => {
        setFile(file);
    };

    const form = useForm({
        mode: 'uncontrolled',
        initialValues: {
            site_title: siteTitle || '',
        },

    });

    useEffect(() => {
        if (settings && settings.core_setting) {
            try {
                // Parse the JSON string
                const parsedData = JSON.parse(settings.core_setting);
                // Check if the parsedData is defined and contains the site_title key
                if (parsedData && parsedData.site_title) {
                    setSiteTitle(parsedData.site_title);
                    form.setFieldValue('site_title', parsedData.site_title);
                }
                if (parsedData && parsedData.site_logo) {
                    setSiteLogoPath(parsedData.site_logo);
                }
            } catch (error) {
                console.error("JSON parsing error:", error.message);
            }
        }
        if (serialSettings) {
            setIsSerialEnabled(serialSettings.enabled);
            if (serialSettings.enabled) {
                setSerialNumber(serialSettings.number || '1');
            } else if (serialSettings.number) {
                setSerialNumber(serialSettings.number || '1');
            }
            else {
                setSerialNumber('');
            }
            if (serialSettings.number) {
                setIsSerialSubmitted(true);
            }
        }
    }, [settings, serialSettings]);

    const handleSerialNumberChange = (event) => {
        const value = event.currentTarget.value;
        setSerialError('');
        // Allow only numbers and prevent first digit from being 0
        if (/^\d{0,4}$/.test(value)) {
            if (value === '') {
                setSerialError('Reference number cannot be empty');
                setSerialNumber(value);
            } else {
                const numValue = parseInt(value, 10);
                if (numValue === 0) {
                    setSerialError('Reference number cannot be 0');
                    setSerialNumber(value);
                } else if (numValue > 4000) {
                    setSerialError('Reference number cannot be greater than 4000');
                    setSerialNumber(value);
                } else {
                    setSerialNumber(numValue.toString());
                    setSerialError('');
                }
            }
        }
    };

    const handleSubmit = (values) => {
        setIsSubmitting(true);
        const formData = new FormData();
        // formData.append('site_logo', file);
        // formData.append('timezone', selectedTimezone);
        formData.append('serial_number', serialNumber);
        formData.append('is_serial_enabled', isSerialEnabled);
        if (isSerialEnabled) {
            if (serialNumber !== '') {
                setIsSerialSubmitted(true);
            }
            if (serialNumber === '') {
                setSerialError('Reference number cannot be empty');
                setIsSubmitting(false);
                return;
            }
            if (serialNumber > 4000) {
                setSerialError('Reference number cannot be greater than 4000');
                setIsSubmitting(false);
                return;
            }
        }
        formData.append('settings', JSON.stringify({ ...settings, core_setting: values, type: 'general' }));
        dispatch(editSetting({ data: formData })).then((response) => {
            setIsSubmitting(false);
            if (response.payload && response.payload.status && response.payload.status === 200) {
                setIsSerialSubmitted(true);
                showNotification({
                    id: 'load-data',
                    loading: true,
                    title: 'General Settings',
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
                    title: 'General Settings',
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

    // Add these common label styles
    const labelStyles = {
        fontSize: '16px',
        fontWeight: 500,
        marginBottom: '4px',
        color: '#212529'
    };

    // Add this shared props object for all inputs
    const commonInputProps = {
        size: "sm",
        w: "100%",
        mt: "md",
        labelProps: { style: labelStyles }
    };

    return (
        <Fragment>
            <Paper>
                <form onSubmit={form.onSubmit((values) => handleSubmit(values))}>

                    <div className="mb-4">
                        <Grid>
                            <Grid.Col span={{ md: 4, lg: 4 }}>
                                
                                <Box>
                                    <Text size="sm" fw={500} mb={5}>
                                        {translate('Enable reference numbers for tasks?')}
                                    </Text>
                                    <Switch
                                        color="#ED7D31"
                                        size="lg"
                                        onLabel={translate('ON')}
                                        offLabel={translate('OFF')}
                                        checked={isSerialEnabled}
                                        onChange={(event) => setIsSerialEnabled(event.currentTarget.checked)}
                                        radius='xs'
                                    />
                                    <TextInput
                                        w={"100%"}
                                        size="sm"
                                        label={
                                            <Text size="sm">{translate('Task Reference Number')}</Text>
                                        }
                                        placeholder="0001"
                                        value={serialNumber}
                                        onChange={handleSerialNumberChange}
                                        disabled={!isSerialEnabled || isSerialSubmitted}
                                        mt={5}
                                        style={{ opacity: isSerialEnabled ? 1 : 0.6 }}
                                        error={serialError}
                                        {...commonInputProps}
                                    />


                                    <Text mt={5} size="xs" fs="italic">{translate('Enter a starting number (1–500). Once set, it can\'t be changed.')}</Text>
                                </Box>
                            </Grid.Col>

                        </Grid>

                    </div>


                    <Group justify="flex-start" mt="md">
                        <Button
                            variant="filled"
                            color="#ED7D31"
                            type="submit"
                            loading={isSubmitting}
                            loaderProps={{ type: 'dots' }}
                            disabled={isSubmitting || (isSerialEnabled && (serialNumber === '0' || parseInt(serialNumber) > 4000))}
                        >
                            {translate('Submit')}
                        </Button>
                    </Group>
                </form>
            </Paper>

        </Fragment>
    );
};

export default SerialSettings;
