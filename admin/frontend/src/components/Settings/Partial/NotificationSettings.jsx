import React, { Fragment, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Card, Container, Grid, Group, ScrollArea, Stack, Tabs, Text } from '@mantine/core';
import { hasPermission } from "../../ui/permissions";
import { translate } from '../../../utils/i18n';
import SMTPConfiguration from '../../Notification/Template/SMTPConfiguration';
import SMSConfiguration from '../../Notification/Template/SMSConfiguration';
import FirebaseConfiguration from '../../Notification/Template/FirebaseConfiguration';

const NotificationSettings = () => {
    const { loggedInUser } = useSelector((state) => state.auth.session)
    const permissions = loggedInUser?.llc_permissions || [];
    const hasGeneral = permissions.includes('general-settings');
    const hasRolePermission = permissions.includes('manage-rolls-permissions');
    const hasManageTags = permissions.includes('manage-tags');

    // Determine where to go based on permissions
    let settingsLink = null;

    if (hasGeneral && hasRolePermission && hasManageTags) {
        settingsLink = 'general-setting';
    } else if (hasGeneral) {
        settingsLink = 'general-setting';
    } else if (hasRolePermission) {
        settingsLink = 'roles-permissions';
    } else if (hasManageTags) {
        settingsLink = 'managed-tags';
    }

    return (
        <Fragment>
            <Grid columns={12}>
                <Grid.Col span={4}>
                    <Card p="lg" radius="md" withBorder h={"100%"}>
                        <Group position="apart" mb="sm">
                            <Text weight={600}>{translate('SMTP Configuration')}</Text>
                        </Group>
                        <Stack spacing="sm">
                            <SMTPConfiguration />
                        </Stack>
                    </Card>

                </Grid.Col>
                <Grid.Col span={4}>
                    <Card p="lg" radius="md" withBorder h={"100%"}>
                        <Group position="apart" mb="sm">
                            <Text weight={600}>{translate('SMS Configuration')}</Text>
                        </Group>
                        <Stack spacing="sm">
                            <SMSConfiguration />
                        </Stack>
                    </Card>
                </Grid.Col>
                <Grid.Col span={4}>
                    <Card p="lg" radius="md" withBorder h={"100%"}>
                        <Group position="apart" mb="sm">
                            <Text weight={600}>{translate('Firebase Configuration')}</Text>
                        </Group>
                        <Stack spacing="sm">
                            <FirebaseConfiguration />
                        </Stack>
                    </Card>
                </Grid.Col>
            </Grid>
        </Fragment>
    );
};

export default NotificationSettings;
