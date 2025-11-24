import React, { Fragment, useEffect } from 'react';
import { Avatar, Button, Card, Container, Grid, Group, Modal, ScrollArea, Tabs, Title } from '@mantine/core';
import { useDispatch, useSelector } from "react-redux";
import Header from "../../Header";
import {
    fetchAllNotificationChannels,
    fetchAllNotificationTemplates,
    fetchNotificationActions
} from "../store/notificationTemplateSlice";
import TemplateListContent from "./TemplateListContent";
import { IconPlus } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import { useDisclosure } from "@mantine/hooks";
import CreateTemplateModal from "./CreateTemplateModal";
import SettingsNav from "../../Settings/SettingsNav";
import SMTPConfiguration from "./SMTPConfiguration";
import SMSConfiguration from "./SMSConfiguration";
import FirebaseConfiguration from "./FirebaseConfiguration";
import { translate } from '../../../utils/i18n';

const NotificationTemplate = () => {

    const dispatch = useDispatch();
    const { token } = useSelector((state) => state.auth.session);
    const { loggedUserId } = useSelector((state) => state.auth.user)

    useEffect(() => {
        dispatch(fetchAllNotificationTemplates());
        dispatch(fetchAllNotificationChannels());
        dispatch(fetchNotificationActions())
    }, [dispatch]);



    return (
        <Fragment>
            {/*<Header /> */}

            <div className='dashboard'>
                <Container size="full">
                    <div className="settings-page-card bg-white rounded-xl p-5 pt-3 my-5 pb-[2.3rem]">
                        <SettingsNav />

                        <ScrollArea scrollbars="y" scrollbarSize={4}
                            className={`w-full pr-1 ${appLocalizer?.is_admin ? 'h-[calc(100vh-300px)]' : 'h-[calc(100vh-250px)]'}`}
                            offsetScrollbars={true}
                        >

                            <Tabs color="orange" orientation="vertical" defaultValue="template-list">
                                <Tabs.List>
                                    {/* <Tabs.Tab value="template-list" >
                                        {translate('Template List')}
                                    </Tabs.Tab> */}
                                    {/* <Tabs.Tab value="smtp-configuration" >
                                        {translate('SMTP Configuration')}
                                    </Tabs.Tab> */}
                                    {/* <Tabs.Tab value="sms-configuration" >
                                        {translate('SMS Configuration')}
                                    </Tabs.Tab> */}
                                    {/* <Tabs.Tab value="firebase-configuration" >
                                        {translate('Firebase Configuration')}
                                    </Tabs.Tab> */}
                                </Tabs.List>
                                {/* <Tabs.Panel value="template-list" px={'md'}>
                                    <Grid className="mb-5" columns={12}>
                                        <Grid.Col span={12}>
                                            <TemplateListContent />
                                        </Grid.Col>
                                    </Grid>
                                </Tabs.Panel> */}
                                {/* <Tabs.Panel value="smtp-configuration" px={'md'}>
                                    <Grid className="mb-5" columns={12}>
                                        <Grid.Col span={12}>
                                            <SMTPConfiguration />
                                        </Grid.Col>
                                    </Grid>
                                </Tabs.Panel> */}
                                {/* <Tabs.Panel value="sms-configuration" px={'md'}>
                                    <Grid className="mb-5" columns={12}>
                                        <Grid.Col span={12}>
                                            <SMSConfiguration />
                                        </Grid.Col>
                                    </Grid>
                                </Tabs.Panel> */}
                                {/* <Tabs.Panel value="firebase-configuration" px={'md'}>
                                    <Grid className="mb-5" columns={12}>
                                        <Grid.Col span={12}>
                                            <FirebaseConfiguration />
                                        </Grid.Col>
                                    </Grid>
                                </Tabs.Panel> */}
                            </Tabs>

                            <Grid className="mb-5" columns={12}>
                                <Grid.Col span={12}>
                                    <TemplateListContent />
                                </Grid.Col>
                            </Grid>


                        </ScrollArea>
                    </div>
                </Container>
            </div>

            {/* <Footer /> */}

        </Fragment>

    );
}

export default NotificationTemplate;
