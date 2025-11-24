import React, { Fragment, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Switch,
    Button,
    Select,
    Container,
    FileInput, Flex,
    Grid,
    Group, Image,
    Paper,
    ScrollArea,
    Tabs,
    TextInput,
    Tooltip,
    Text,
    Box,
} from '@mantine/core';
import {
    IconHelp
} from '@tabler/icons-react';
import { useForm } from "@mantine/form";
import { editSetting, fetchSettings, editPortalSetting } from "../store/settingSlice";
import { showNotification } from "@mantine/notifications";
import { translate } from '../../../utils/i18n';
const PortalSettings = () => {
    // const users = useSelector((state) => state.users);
    const { loggedInUser } = useSelector((state) => state.auth.session)
    const { settings, portalSettings } = useSelector((state) => state.settings.setting)

    const [isPortalEnabled, setIsPortalEnabled] = useState(false);
    const [portalSlug, setPortalSlug] = useState('');
    const [portalSlugError, setPortalSlugError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(fetchSettings());
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
        if (portalSettings) {
            // Set portal enabled state based on status
            setIsPortalEnabled(portalSettings.status === 'publish');
            
            // Set portal slug
            if (portalSettings.slug) {
                setPortalSlug(portalSettings.slug);
            } else {
                setPortalSlug('lazytasks');
            }
        }
    }, [settings, portalSettings]);

    const validatePortalSlug = (slug) => {
        // Only allow letters, numbers, and hyphens
        const validSlugRegex = /^[a-zA-Z0-9-]+$/;
        return validSlugRegex.test(slug);
    };

    const handlePortalSlugChange = (event) => {
        const value = event.currentTarget.value;
        if (value === '') {
            setPortalSlugError('Portal Slug cannot be empty');
        }
        const sanitizedValue = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
        // sanitizedValue = sanitizedValue.slice(0, 12);
        
        if (sanitizedValue && !validatePortalSlug(sanitizedValue)) {
            setPortalSlugError('Only letters, numbers, and hyphens are allowed');
        } else if (sanitizedValue.length > 12) {
            setPortalSlugError('Maximum 12 characters allowed');
        } else {
            setPortalSlugError('');
        }
        
        setPortalSlug(sanitizedValue);
    };

    const handleSubmit = () => {
        setIsSubmitting(true);
        if (isPortalEnabled) {
            if (portalSlug === '') {
                setPortalSlugError('Portal Slug cannot be empty');
                setIsSubmitting(false);
                return;
            }else if(portalSlug.length > 12){
                setPortalSlugError('Maximum 12 characters allowed');
                setIsSubmitting(false);
                return;
            }
        }
        const portalData = {
            is_portal_enable: isPortalEnabled,
            portal_slug: portalSlug
        };

        dispatch(editPortalSetting({ data: portalData }))
            .unwrap()
            .then((response) => {
                setIsSubmitting(false);

                showNotification({
                    id: 'portal-settings',
                    title: 'Portal Settings',
                    message: response.message,
                    autoClose: 2000,
                    disallowClose: true,
                    color: response.status === 200 ? 'green' : 'red',
                });

                if (response.status === 200) {
                    // Short delay to show notification before redirect
                    setTimeout(() => {
                        if (!isPortalEnabled) {
                            window.location.href = '/wp-admin/admin.php?page=lazytasks-page#/settings';
                        } else if (!appLocalizer?.is_admin && response.data?.permalink) {
                            window.location.href = response.data.permalink+'#/settings';
                        }
                    }, 1000);
                }
            })
            .catch((error) => {
                setIsSubmitting(false);
                showNotification({
                    id: 'portal-settings',
                    title: 'Portal Settings',
                    message: error.message || 'An error occurred',
                    autoClose: 2000,
                    disallowClose: true,
                    color: 'red',
                });
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
                

                    <div className="mb-4">
                        <Grid>
                            <Grid.Col span={{ md: 4, lg: 4 }}>
                                
                                <Box>
                                    
                                    <Text size="sm" fw={500} mb={5}>
                                        {translate('Enable frontend portal for easy access?')}
                                    </Text>
                                    <Switch
                                        color="#ED7D31"
                                        size="lg"
                                        onLabel={translate('ON')}
                                        offLabel={translate('OFF')}
                                        checked={isPortalEnabled}
                                        onChange={(event) => setIsPortalEnabled(event.currentTarget.checked)}
                                        radius='sm'
                                    />
                                    
                                    <TextInput
                                        w={"100%"}
                                        size="sm"
                                        label={
                                            <Text size="sm"
                                                style={{
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    display: 'block',
                                                    maxWidth: '100%',
                                                }}
                                                title={translate('Frontend Portal URL %s').replace('%s', appLocalizer?.homeUrl)/portalSlug}
                                            >
                                                {translate('Frontend Portal URL %s').replace('%s', appLocalizer?.homeUrl)}/{portalSlug}
                                            </Text>
                                        }
                                        placeholder={translate('Enter Portal Slug')}
                                        value={portalSlug}
                                        onChange={handlePortalSlugChange}
                                        disabled={!isPortalEnabled}
                                        mt={5}
                                        style={{ opacity: isPortalEnabled ? 1 : 0.6 }}
                                        error={portalSlugError}
                                        {...commonInputProps}
                                    />


                                    {/* <Text size='sm' mt={5} fw={600}>
                                        Want to add reference numbers to your tasks for easy referencing? <br />
                                    </Text>
                                    <span className="italic text-sm">
                                    Enable this button and enter a starting number (1-500). Once the numbering starts, adjustments will no longer be possible.
                                    </span> */}
                                </Box>
                            </Grid.Col>

                        </Grid>

                    </div>


                    <Group justify="flex-start" mt="md">
                        <Button 
                            variant="filled" 
                            color="#ED7D31" 
                            onClick={handleSubmit}
                            loading={isSubmitting}
                            loaderProps={{ type: 'dots' }}
                            disabled={isSubmitting}
                        >
                            {translate('Submit')}
                        </Button>
                    </Group>
                
            </Paper>

        </Fragment>
    );
};

export default PortalSettings;
