import { Fragment, useEffect, useState } from 'react';
import { Button, Container, Divider, Grid, Group, Modal, Overlay, ScrollArea, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { useDispatch, useSelector } from "react-redux";
import { fetchTasksByUser } from "./Settings/store/myTaskSlice";
import { fetchQuickTasksByUser } from "./Settings/store/quickTaskSlice";
import QuickTaskList from "./Dashboard/QuickTaskList";
import DashboardBarChart from "./Dashboard/DashboardBarChart";
import TaskListTabs from "./Dashboard/TaskListTabs";
import { fatchLazytasksConfig } from "./Settings/store/settingSlice";
import Onboarding from "./Onboarding/Onboarding";
import DashboardCard from './Dashboard/DashboardCard';
import { translate } from "../utils/i18n";
import DashboardPieChart from './Dashboard/DashboardPieChart';
import DashboardTaskProgress from './Dashboard/DashboardTaskProgress';
import UserActivities from './Dashboard/UserActivities';
import UserEngagementChart from './Dashboard/UserEngagementChart';
import { IconLock } from '@tabler/icons-react';

const Dashboard = () => {

    const dispatch = useDispatch();
    const { token } = useSelector((state) => state.auth.session);
    const { loggedUserId } = useSelector((state) => state.auth.user)
    const { loggedInUser } = useSelector((state) => state.auth.session);
    const { lazytasksConfig } = useSelector((state) => state.settings.setting);

    const [config, setConfig] = useState(lazytasksConfig);
    const [notEngagedModalOpen, setNotEngagedModalOpen] = useState(false);

    useEffect(() => {
        if (lazytasksConfig) {
            setConfig(lazytasksConfig);
        }
    }, [lazytasksConfig]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (loggedUserId) {
                    await dispatch(fetchTasksByUser({ id: loggedInUser ? loggedInUser.loggedUserId : loggedUserId }))
                    await dispatch(fetchQuickTasksByUser({ id: loggedInUser ? loggedInUser.loggedUserId : loggedUserId }))
                }

                await dispatch(fatchLazytasksConfig()).then((response) => {
                    if (response.payload.status === 200) {
                        setConfig(response.payload.data)
                    }
                });

            } catch (err) {
                console.error("Unexpected error:", err);
            }
        };
        fetchData();
    }, [dispatch, loggedInUser, loggedUserId]);

    useEffect(() => {
        if (loggedInUser) {
            const hasRoles = Array.isArray(loggedInUser?.llc_roles) && loggedInUser.llc_roles.length > 0;
            const hasPerms = Array.isArray(loggedInUser?.llc_permissions) && loggedInUser.llc_permissions.length > 0;
            setNotEngagedModalOpen(!hasRoles && !hasPerms);
        }
    }, [loggedInUser, loggedUserId]);

    return (
        <Fragment>
            {/*<Header /> */}

            <div className='dashboard'>
                <Container size="full">
                    <div className="settings-page-card bg-white rounded-xl p-5 pt-3 mt-5 mb-5">
                        <div className='mt-2 mb-3'>
                            {/* <Title order={4}>{ __('Dashboard', 'lazytasks-project-task-management') }</Title> */}
                            <Title order={4}>{translate('Dashboard')}</Title>
                        </div>
                        <ScrollArea scrollbars="y" className={`w-full px-2 ${appLocalizer?.is_admin ? 'h-[calc(100vh-233px)]' : 'h-[calc(100vh-186px)]'}`}
                            scrollbarSize={4}
                        >
                            <Grid mb={5} columns={12}>
                                <Grid.Col span={12}>
                                    <DashboardCard />
                                </Grid.Col>
                            </Grid>
                            <Grid mb={5} columns={12} align="stretch">
                                <Grid.Col span={6}>
                                    <DashboardPieChart />
                                </Grid.Col>
                                <Grid.Col span={6}>
                                    <DashboardTaskProgress />
                                </Grid.Col>
                            </Grid>
                            <Grid mb={5} columns={12}>
                                <Grid.Col span={6}>
                                    <DashboardBarChart />
                                </Grid.Col>
                                <Grid.Col span={6}>
                                    <TaskListTabs />
                                </Grid.Col>
                            </Grid>
                            <Grid mb={5} columns={12}>
                                <Grid.Col span={3}>
                                    <QuickTaskList />
                                </Grid.Col>
                                <Grid.Col span={3}>
                                    <UserActivities />
                                </Grid.Col>
                                <Grid.Col span={6}>
                                    <UserEngagementChart />
                                </Grid.Col>
                            </Grid>
                        </ScrollArea>
                    </div>
                </Container>

                <Modal
                    opened={config?.lazytasks_basic_info_guide_modal && appLocalizer?.is_admin}
                    onClose={() => setConfig({ ...config, lazytasks_basic_info_guide_modal: false })}
                    title=""
                    size="auto"
                    // scrollAreaComponent={ScrollArea.Autosize}
                    withCloseButton={false}
                    closeOnClickOutside={false}
                    centered
                >
                    <Onboarding />
                </Modal>

                {notEngagedModalOpen && (
                    <Modal
                        opened={notEngagedModalOpen}
                        title={
                            <>
                                <Group spacing="xs">
                                    <ThemeIcon color="orange" radius="xl" size="lg" variant="filled">
                                        <IconLock size={24} />
                                    </ThemeIcon>
                                    <Text size="md" weight={500}>
                                        {translate('You are not assigned to any project in LazyTask!')}
                                    </Text>
                                </Group>
                            </>
                        }
                        size="md"
                        withCloseButton={false}
                        closeOnClickOutside={false}
                        returnFocus={false}
                        centered
                        overlayProps={{
                            color: 'rgba(0, 0, 0, 0.85)', // dark semi-transparent background
                            blur: 3,                      // slightly blurred background
                            opacity: 1,                 // more visible dark overlay
                            zIndex: 200,
                        }}
                    >
                        <Divider size="xs" my={0} className='!-ml-4 w-[calc(100%+2rem)]' />
                        <Stack spacing="md" pt="md">
                            <Text size="sm" ta="center" pt={5} c="#4D4D4D">
                                {translate('You are currently added as a user in WordPress, but you are not assigned to any project in the LazyTask.')} <br />
                                <strong>
                                    {translate('To start working in LazyTask, please contact the admin so they can assign you to a project.')}
                                </strong>
                            </Text>
                            <Group mt="sm" justify="center">
                                <Button
                                    variant='filled'
                                    color='orange'
                                    tabIndex={-1}
                                    onFocus={(e) => e.target.blur()}
                                    onMouseDown={(e) => e.preventDefault()}
                                    style={{ outline: 'none', boxShadow: 'none' }}
                                    fullWidth
                                >
                                    {translate('Contact With Admin')}
                                </Button>
                            </Group>
                        </Stack>
                    </Modal>
                )}

            </div>

            {/* <Footer /> */}
        </Fragment>

    );
}

export default Dashboard;
