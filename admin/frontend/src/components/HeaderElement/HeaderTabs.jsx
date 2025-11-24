import cx from 'clsx';
import { Link, useLocation, NavLink, useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import {
    IconPaperclip,
    IconBell,
    IconAppWindow,
    IconListCheck,
    IconTable,
    IconArrowsMaximize,
    IconArrowsMinimize,
    IconPencil,
    IconPencilStar,
    IconMessages,
    IconInfoCircle,
    IconLogout,
    IconSettings,
    IconChevronDown,
} from '@tabler/icons-react';
import {
    Container,
    Avatar,
    UnstyledButton,
    Group,
    Text,
    Menu,
    Burger,
    rem,
    Button,
    useMantineTheme,
    Drawer, Title, ScrollArea,
    Tooltip, 
    Box,
} from '@mantine/core';
import { useDisclosure, useFullscreen, useHotkeys } from '@mantine/hooks';
import '@mantinex/mantine-logo/styles.css';
import classes from './HeaderTabs.module.css';
import WorkspaceLists from '../Elements/Workspace/WorkspaceLists';
import ProfileEditDrawer from '../Profile/ProfileEditDrawer';
import ChangePassword from '../Profile/ChangePassword';
import { useDispatch, useSelector } from "react-redux";
import useAuth from "../../utils/useAuth";
import { hasPermission } from "../ui/permissions";
import my_zen from '../../img/my-zen-black.svg';
import appConfig from "../../configs/app.config";
import { NotificationPopover } from './NotificationPopover';
import { MobileAppPopover } from './MobileAppPopover';
import { FeedbackForm } from './FeedbackForm';
import { fatchLazytasksConfig, fetchSettings } from "../Settings/store/settingSlice";
import { translate } from "../../utils/i18n";
import LicenseWarningModal from '../LicenseWarningModal';
import { AboutModal } from './AboutModal';

export function HeaderTabs() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const theme = useMantineTheme();
    // const [opened, { toggle }] = useDisclosure(false);
    const [userMenuOpened, setUserMenuOpened] = useState(false);
    const [mobileAppPopoverOpened, setMobileAppPopoverOpened] = useState(false);

    const { loggedInUser } = useSelector((state) => state.auth.session);
    const { lazytasksConfig, portalSettings } = useSelector((state) => state.settings.setting);
    const [config, setConfig] = useState(lazytasksConfig);
    useEffect(() => {
        dispatch(fetchSettings());
    }, [dispatch]);

    const [isVisible, setIsVisible] = useState(false);
    const handleProjectCreateSlide = () => {
        setIsVisible(!isVisible);
    };
    const { loggedUserId } = useSelector((state) => state.auth.user)
    const icon = <IconPaperclip style={{ width: rem(18), height: rem(18) }} stroke={1.5} />;
    const [opened, { open, close, toggle }] = useDisclosure(false);
    const [profileDrawerOpened, { open: profileDrawerOpen, close: profileDrawerClose }] = useDisclosure(false);
    const { signOut } = useAuth();
    let location = useLocation();

    const { toggle: toggleFullscreen, fullscreen } = useFullscreen();

    const permissions = loggedInUser?.llc_permissions || [];
    const workspacePermissions = [
        'create-workspace',
        'edit-workspace',
        'delete-workspace',
        'create-project',
        'edit-project',
        'delete-project',
        'add-member-to-project-send-invite',
        'remove-member-from-project'
    ];
    const hasWorkspace = permissions.length > 0 && permissions.some(p => workspacePermissions.includes(p));
    const hasGeneral = permissions.length > 0 && permissions.includes('general-settings');
    const hasProjects = permissions.length > 0 && permissions.includes('manage-workspace-projects');
    const hasNotifications = permissions.length > 0 && permissions.includes('manage-notifications');
    const hasManageTags = permissions.length > 0 && permissions.includes('manage-tags');

    // Determine where to go based on permissions
    let settingsLink = null;

    if (hasGeneral && hasProjects && hasNotifications) {
        settingsLink = '/settings';
    } else if (hasGeneral) {
        settingsLink = '/settings';
    } else if (hasManageTags) {
        settingsLink = '/settings';
    } else if (hasProjects) {
        settingsLink = '/workspace/projects';
    } else if (hasWorkspace) {
        settingsLink = '/workspace/projects';
    } else if (hasNotifications) {
        settingsLink = '/notification-template';
    }


    const goToDashboard = () => {
        if (location.pathname !== '/dashboard') {
            navigate('/dashboard');
        }
    }
    const goToMyTask = () => {
        if (location.pathname !== '/my-task') {
            navigate('/my-task');
        }
    }
    useHotkeys([
        ['alt+D', () => goToDashboard()]
    ]);
    useHotkeys([
        ['alt+T', () => goToMyTask()]
    ]);

    const [feedbackModalOpened, { open: feedbackModalOpen, close: feedbackModalClose }] = useDisclosure(false);
    const [aboutModalOpened, { open: aboutModalOpen, close: aboutModalClose }] = useDisclosure(false);
    return (
        <div className={`relative ${classes.header}`}>


            <Container className="py-1" size="full">
                <Group className={` h-[60px]`} justify="space-between">
                    {/* <MantineLogo size={28} /> */}
                    <div className='flex space-x-4'>


                        <NavLink to={`/dashboard`} className="nav-link" activeClassName="active-link">
                            <Button
                                size="sm"
                                color={location.pathname === '/dashboard' ? "#18313B" : "#EBF1F4"}
                                styles={{
                                    label: {
                                        color: location.pathname === '/dashboard' ? "#fff" : "#202020"
                                    }
                                }}
                            >
                                <IconTable stroke={1.25} size={24} color={location.pathname === '/dashboard' ? "#fff" : "#202020"} className="pr-1" /> {translate('Dashboard')}
                            </Button>
                        </NavLink>

                        <NavLink to={`/my-task`} className="nav-link" activeClassName="active-link">
                            <Button
                                size="sm"
                                color={location.pathname === '/my-task' ? "#18313B" : "#EBF1F4"}
                                styles={{
                                    label: {
                                        color: location.pathname === '/my-task' ? "#fff" : "#202020"
                                    }
                                }}
                            >
                                <IconListCheck stroke={1.25} size={24} color={location.pathname === '/my-task' ? "#fff" : "#202020"} className="pr-1" /> {translate('My Tasks')}
                            </Button>
                        </NavLink>

                        {appLocalizer?.is_admin && portalSettings && portalSettings.status === 'publish' &&
                            // <a className={`!flex !items-center justify-center`} target="_blank" href={`${appConfig.liveSiteUrl}/lazytasks`}>
                            //     <div className='mr-1'>
                            //         <IconHome stroke={1.25} size={24} color={`#202020`} />
                            //     </div>
                            //     <span>Portal</span>
                            // </a>
                            <a className={`!flex !items-center justify-center`} target="_blank" href={portalSettings && portalSettings.permalink ? portalSettings.permalink : `${appConfig.liveSiteUrl}/lazytasks`}>
                                <Button
                                    size="sm"
                                    color={"#EBF1F4"}
                                    styles={{
                                        label: {
                                            color: "#202020"
                                        }
                                    }}
                                >
                                    <IconAppWindow stroke={1.25} size={24} color={"#202020"} className="mr-1" /> {translate('Portal')}
                                </Button>
                            </a>
                        }

                        {!appLocalizer?.is_admin &&
                            <Tooltip label={fullscreen ? 'Exit Full Screen' : 'Full Screen'} position="bottom" withArrow>
                                <Button
                                    className={`!px-2`}
                                    size="sm"
                                    variant="filled"
                                    color="orange"
                                    onClick={toggleFullscreen}
                                >
                                    {fullscreen ?
                                        <IconArrowsMinimize stroke={1.5} size={24} color={"#fff"} />
                                        :
                                        <IconArrowsMaximize stroke={1.5} size={24} color={"#fff"} />
                                    }
                                </Button>
                            </Tooltip>
                        }

                    </div>

                    <div className='flex items-center gap-2'>
                        {/* <ButtonMenu /> */}

                        <MobileAppPopover />

                        <Button size="md" h={34} className={`font-semibold`} onClick={open} variant="filled"
                            color="#ED7D31">{translate('Workspace')}</Button>

                        <NotificationPopover>
                            <Box className='h-[35px] w-[35px] border border-[#C2D4DC] ml-[6px] mr-[-2px] mt-[8px] rounded-full p-[6px] cursor-pointer'>
                                <IconBell size={20} stroke={1.25} />
                            </Box>
                        </NotificationPopover>

                        <Burger opened={opened} onClick={toggle} hiddenFrom="xs" size="sm" />
                        <Menu
                            width={200}
                            position="bottom-end"
                            transitionProps={{ transition: 'pop-top-right' }}
                            onClose={() => setUserMenuOpened(false)}
                            onOpen={() => setUserMenuOpened(true)}
                            withinPortal
                        >
                            <Menu.Target>
                                <UnstyledButton
                                    className={cx(classes.user, { [classes.userActive]: userMenuOpened })}
                                >
                                    <Group gap={7}>
                                        <Avatar src={loggedInUser?.avatar} alt={loggedInUser?.name} radius="xl"
                                            size={32} />
                                        <Text fw={500} size="sm" lh={1} mr={3}>
                                            {loggedInUser ? loggedInUser.name : ''}
                                        </Text>
                                        <IconChevronDown style={{ width: rem(12), height: rem(12) }} stroke={1.5} />
                                    </Group>
                                </UnstyledButton>
                            </Menu.Target>
                            <Menu.Dropdown>

                                {/* <Link to={`/profile/${loggedInUser ? loggedInUser.loggedUserId : loggedUserId}`}> */}
                                <Menu.Item onClick={profileDrawerOpen}
                                    leftSection={
                                        <IconPencil
                                            style={{ width: rem(16), height: rem(16) }}
                                            stroke={1.5}
                                        />
                                    }
                                >
                                    {translate('Profile')}
                                </Menu.Item>
                                {/* </Link> */}

                                {settingsLink &&
                                    <Link to={settingsLink}>
                                        <Menu.Item
                                            leftSection={
                                                <IconSettings style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
                                            }
                                        >
                                            {translate('Settings')}
                                        </Menu.Item>
                                    </Link>
                                }

                                <Menu.Item
                                    onClick={signOut}
                                    leftSection={
                                        <IconLogout style={{ width: rem(16), height: rem(16) }} color={"#ED7D31"} stroke={1.5} />
                                    }
                                    c={"#ED7D31"}
                                >
                                    {translate('Logout')}
                                </Menu.Item>

                                <Menu.Divider />

                                <Menu.Item
                                    leftSection={
                                        <IconPencilStar style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
                                    }
                                    component="a"
                                    href="https://wordpress.org/support/plugin/lazytasks-project-task-management/reviews/#new-post"
                                    target="_blank"
                                >
                                    {translate('Write a Review')}
                                </Menu.Item>

                                <Menu.Item
                                    leftSection={
                                        <IconMessages style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
                                    }
                                    onClick={feedbackModalOpen}
                                >
                                    {translate('Feedback')}
                                </Menu.Item>

                                <Menu.Item
                                    leftSection={
                                        <IconInfoCircle style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
                                    }
                                    onClick={aboutModalOpen}
                                >
                                    {translate('About')}
                                </Menu.Item>
                            </Menu.Dropdown>
                        </Menu>
                    </div>
                </Group>
            </Container>

            <FeedbackForm feedbackModalOpen={feedbackModalOpened} setFeedbackModalOpen={feedbackModalClose} />
            <AboutModal aboutModalOpen={aboutModalOpened} setAboutModalOpen={aboutModalClose} />

            <LicenseWarningModal />

            <div className="drawer mt-[16]">
                <Drawer opened={opened} onClose={close}
                    position="right"
                    withCloseButton={false}
                    size="md"
                    overlayProps={{ backgroundOpacity: 0, blur: 0 }}
                    zIndex={10000000}
                    withinPortal={false}
                    keepMounted
                    styles={{
                        inner: {
                            transform: appLocalizer?.is_admin ? 'translateX(-160px)' : 'translateX(0px)',
                        }
                    }}
                >
                    <Drawer.Body>

                        <div className='workspace-create-card w-full'>
                            <div className="relative flex justify-between mb-4">
                                <Title order={4}>
                                    {translate('Workspace')}
                                </Title>
                                <Drawer.CloseButton />
                            </div>
                            <div className='border-t border-gray-400 w-[calc(100%+4rem)] -ml-8 pt-4 px-4' style={{ borderColor: '#EBF1F4' }}></div>
                            <WorkspaceLists onClose={close} />
                        </div>

                    </Drawer.Body>

                </Drawer>

            </div>

            <div className="drawer mt-[16]">
                {/* Drawer */}
                <Drawer
                    opened={profileDrawerOpened}
                    onClose={profileDrawerClose}
                    position="right"
                    withCloseButton={false}
                    size="md"
                    overlayProps={{ backgroundOpacity: 0.5, blur: 1 }}
                    zIndex={10000000}
                    withinPortal={false}
                    styles={{
                        inner: {
                            transform: appLocalizer?.is_admin ? 'translateX(-160px)' : 'translateX(0px)',
                        }
                    }}
                >
                    <Drawer.Body>
                        <div className='workspace-create-card w-full'>
                            <div className="relative flex justify-between mb-4">
                                <Title order={4}>
                                    {translate('Profile')}
                                </Title>
                                <Drawer.CloseButton />
                            </div>
                            <ScrollArea scrollbarSize={4} scrollbars="y" offsetScrollbars={true}
                                className="h-[calc(100vh-109px)]"
                            >
                                <div className='border-t border-gray-400 w-[calc(100%+4rem)] -ml-8 pt-4 px-4' style={{ borderColor: '#EBF1F4' }}></div>
                                <ProfileEditDrawer onSuccess={profileDrawerClose}/>
                                <div className='border-t border-gray-400 w-[calc(100%+4rem)] -ml-8 pt-4 px-4' style={{ borderColor: '#EBF1F4', marginTop: '20px' }}></div>
                                <ChangePassword onSuccess={profileDrawerClose} />
                            </ScrollArea>
                        </div>
                    </Drawer.Body>
                </Drawer>
            </div>

        </div>
    );
}