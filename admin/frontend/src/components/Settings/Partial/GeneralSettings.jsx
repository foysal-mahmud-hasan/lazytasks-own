import React, { Fragment, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Button,
    Select,
    FileInput, Flex,
    Grid,
    Group, Image,
    Paper,
    TextInput,
    Text,
    Card
} from '@mantine/core';
import {
    IconUpload
} from '@tabler/icons-react';
import { useForm } from "@mantine/form";
import { editSetting, fetchSettings, fetchTimezoneOptions } from "../store/settingSlice";
import { showNotification } from "@mantine/notifications";
import { translate } from '../../../utils/i18n';
const GeneralSettings = () => {
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
    const icon = <IconUpload style={{ width: "20px", height: "20px" }} stroke={1.5} />;

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

        validate: {
            site_title: (value) => (value.length < 1 ? 'Site title is required' : null),
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
        setSelectedTimezone(currentTimezone);
    }, [settings, currentTimezone]);

    const handleSubmit = (values) => {
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('site_logo', file);
        formData.append('timezone', selectedTimezone);
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
                                <TextInput
                                    size="sm"
                                    withAsterisk
                                    label={translate('Portal Title')}
                                    placeholder={translate('Portal Title')}
                                    key={form.key('site_title')}
                                    {...form.getInputProps('site_title')}
                                    defaultValue={siteTitle}
                                    {...commonInputProps}
                                />

                                <Text size='md' mt={5}>{translate('Portal Logo')}</Text>
                                {siteLogoPath && (
                                    <Card p="sm" radius="md" withBorder mt={5} bg="#F4F4F4">
                                        <Flex justify="center" align="center">
                                            <Image
                                                radius="md"
                                                h={70}
                                                w={70}
                                                fit="contain"
                                                src={siteLogoPath}
                                            />
                                        </Flex>
                                    </Card>
                                )}


                                <FileInput
                                    w={"100%"}
                                    size="sm"
                                    accept="image/png,image/jpeg,image/jpg"
                                    placeholder={translate('Upload Portal Logo')}
                                    key={form.key('site_logo')}
                                    leftSection={icon}
                                    onChange={handleFileUpload}
                                    {...commonInputProps}
                                />
                                <span className="text-sm text-gray-500">{translate('Image size should be 160 X 160')}</span>

                                <Select
                                    label={translate('Select Timezone')}
                                    size="sm"
                                    placeholder={translate('Select Timezone')}
                                    data={timezones}
                                    value={selectedTimezone}
                                    onChange={setSelectedTimezone}
                                    searchable
                                    clearable
                                    nothingFoundMessage={translate('Not found...')}
                                    mt={5}
                                    {...commonInputProps}
                                />

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
                            disabled={isSubmitting}
                        >
                            {translate('Submit')}
                        </Button>
                    </Group>
                </form>
            </Paper>

        </Fragment>
    );
};

export default GeneralSettings;
