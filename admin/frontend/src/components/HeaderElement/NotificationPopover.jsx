import { Popover, Tabs, ScrollArea, Text, Stack, Paper, Indicator, Flex, Button, Card, Group, Title, ActionIcon, UnstyledButton, Box } from '@mantine/core';
import { IconCheck, IconChecks, IconEye, IconX } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHotkeys } from '@mantine/hooks';
import { fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "../Settings/store/settingSlice";
import { onSignOutSuccess } from "../../store/auth/sessionSlice";
import { translate } from '../../utils/i18n';

const getTimeAgo = (dateString) => {
    try {
        const now = new Date();
        const past = new Date(dateString);
        const msPerMinute = 60 * 1000;
        const msPerHour = msPerMinute * 60;
        const msPerDay = msPerHour * 24;
        const msPerMonth = msPerDay * 30;
        const msPerYear = msPerDay * 365;

        const elapsed = now - past;

        if (elapsed < msPerMinute) {
            return translate('just now');
        } else if (elapsed < msPerHour) {
            const minutes = Math.round(elapsed / msPerMinute);
            if (minutes === 1) {
                return translate('minute ago', { count: minutes });
            } else {
                return translate('minutes ago', { count: minutes });
            }
        } else if (elapsed < msPerDay) {
            const hours = Math.round(elapsed / msPerHour);
            if (hours === 1) {
                return translate('hour ago', { count: hours });
            } else {
                return translate('hours ago', { count: hours });
            }
        } else if (elapsed < msPerMonth) {
            const days = Math.round(elapsed / msPerDay);
            if (days === 1) {
                return translate('day ago', { count: days });
            } else {
                return translate('days ago', { count: days });
            }
        } else if (elapsed < msPerYear) {
            const months = Math.round(elapsed / msPerMonth);
            if (months === 1) {
                return translate('month ago', { count: months });
            } else {
                return translate('months ago', { count: months });
            }
        } else {
            const years = Math.round(elapsed / msPerYear);
            if (years === 1) {
                return translate('year ago', { count: years });
            } else {
                return translate('years ago', { count: years });
            }
        }
    } catch (error) {
        return dateString;
    }
};

export function NotificationPopover({ children }) {
    const dispatch = useDispatch();
    const [opened, setOpened] = useState(false);
    const [activeTab, setActiveTab] = useState('unread');

    const { loggedUserId } = useSelector((state) => state.auth.user);
    const { loggedInUser } = useSelector((state) => state.auth.session);
    // const { notifications } = useSelector((state) => state.settings.setting?.notifications || []);
    const notifications = useSelector((state) => state.settings.setting?.notifications || []);

    useHotkeys([
        ['alt+shift+n', () => setOpened(true)],
        ['Escape', () => setOpened(false)]
    ]);

    // Fetch notifications when component mounts
    useEffect(() => {
        dispatch(fetchNotifications({
            user_id: loggedInUser ? loggedInUser.loggedUserId : loggedUserId,
            channels: 'web-app'
        }));

        // check for new notifications
        const interval = setInterval(() => {
            dispatch(fetchNotifications({
                user_id: loggedInUser ? loggedInUser.loggedUserId : loggedUserId,
                channels: 'web-app'
            })).then((response) => {

            });
        }, 120000); // 120 seconds

        return () => clearInterval(interval);
    }, [dispatch, loggedInUser]);

    useEffect(() => {
        if (opened) {
            dispatch(fetchNotifications({
                user_id: loggedInUser ? loggedInUser.loggedUserId : loggedUserId,
                channels: 'web-app'
            }));
        }
    }, [opened, dispatch]);

    const calculateScrollHeight = (notifications) => {
        const notificationCount = notifications && notifications.length === 0 ? 1 : notifications.length;
        const itemHeight = 100;
        const maxHeight = 300;
        const contentHeight = notificationCount * itemHeight;
        return Math.min(contentHeight, maxHeight);
    };

    const notificationsTab = activeTab === 'all'
        ? (notifications || []) : (notifications || []).filter(n => n.is_read === "0");
    const unreadCount = notifications?.filter(n => n.is_read === "0")?.length || 0;


    const scrollHeight = calculateScrollHeight(notificationsTab || []);

    const handleNotificationClick = (notification) => {
        if (notification.is_read === "0") {
            dispatch(markNotificationAsRead({
                id: notification.id,
                data: {
                    user_id: loggedInUser?.loggedUserId,
                    channels: 'web-app'
                }
            }));
        }
    };

    const handleMarkAllAsRead = () => {
        const unreadNotifications = notifications.filter(n => n.is_read === "0");
        // Only proceed if there are unread notifications
        if (unreadNotifications.length > 0) {
            const notificationIds = unreadNotifications.map(n => n.id);
            dispatch(markAllNotificationsAsRead({
                notification_ids: notificationIds,
                user_id: loggedInUser ? loggedInUser.loggedUserId : loggedUserId,
                channels: 'web-app'
            }));
        }
    }

    return (
        <Popover
            width={500}
            position="bottom"
            offset={4}
            opened={opened}
            onChange={setOpened}
            withArrow
        >
            <Popover.Target>
                <div onClick={() => setOpened((o) => !o)}>
                    <Indicator
                        inline
                        label={notifications?.filter(n => n.is_read === "0")?.length || 0}
                        size={16}
                        disabled={!notifications?.filter(n => n.is_read === "0")?.length}
                        color="red"
                        position="top-end"
                        offset={4}
                    >
                        {children}
                    </Indicator>
                </div>
            </Popover.Target>

            <Popover.Dropdown
                style={{
                    border: 'none',
                    backgroundColor: 'transparent',
                    padding: 0,
                }}
            >
                <Card padding="lg" withBorder radius="md" shadow='md'>
                    <Card.Section withBorder inheritPadding py="xs" className="bg-[#FDFDFD] mb-2">
                        <Group justify='space-between' align='center'>
                            <Text size='md'>{translate('Notification')}</Text>
                            <ActionIcon variant='subtle' onClick={() => setOpened(false)} color="gray">
                                <IconX style={{ height: "70%", width: "70%" }} stroke={1.5} />
                            </ActionIcon>
                        </Group>
                    </Card.Section>
                    <Flex
                        gap="md"
                        justify="space-between"
                        align="center"
                        direction="row"
                        wrap="wrap"
                        mb={10}
                    >
                        <Box
                            p={4}
                            bg="#EDF2F4"
                            style={{
                                display: 'inline-block',
                                borderRadius: '4px',
                            }}
                            radius="sm"
                        >
                            <Group gap={0}>
                                {[
                                    { label: `${translate('Unread')}${unreadCount > 0 ? ` (${unreadCount})` : ''}`, value: 'unread' },
                                    { label: translate('All'), value: 'all' },
                                ].map(({ label, value }, index) => (
                                    <Button
                                        key={value}
                                        variant={activeTab === value ? 'white' : 'subtle'}
                                        onClick={() => setActiveTab(value)}
                                        color="dark"
                                        fw={500}
                                        px="md"
                                        style={{ width: 120 }}
                                        styles={{
                                            root: {
                                                backgroundColor: activeTab === value ? 'white' : 'transparent',
                                                border: activeTab === value ? '1px solid #BABABA' : 'none',
                                                color: activeTab === value ? '#000' : '#666',
                                            }
                                        }}
                                    >
                                        {label}
                                    </Button>
                                ))}
                            </Group>
                        </Box>

                        <UnstyledButton onClick={handleMarkAllAsRead} color="#39758D">
                            <Group gap={4}>
                                <IconChecks size={20} stroke={1.5} color="#39758D" />
                                <Text size="sm" fw={500} c="#39758D">{translate('Mark all as read')}</Text>
                            </Group>
                        </UnstyledButton>
                    </Flex>

                    <ScrollArea h={scrollHeight} scrollbarSize={2}
                        style={{
                            transition: 'height 0.2s ease-in-out'
                        }}
                    >
                        {notificationsTab.length === 0 ? (
                            <Text c="dimmed" ta="center" py="md">No notifications </Text>
                        ) : (
                            notificationsTab.map(notification => (
                                <Paper
                                    key={notification.id}
                                    p="sm"
                                    shadow='none'
                                    mb="xs"
                                    bg={notification.is_read === "1" ? 'transparent' : '#F5F8F9'}
                                    onClick={() => handleNotificationClick(notification)}
                                    style={{
                                        cursor: 'pointer',
                                        border: notification.is_read === "0" ? '1px solid transparent' : '1px solid #BABABA',
                                    }}
                                >
                                    <Stack gap="xs">
                                        <Text size="sm" fw={500} style={{ wordBreak: 'break-word', flex: 1 }}
                                            dangerouslySetInnerHTML={{ __html: notification.content }}
                                        >

                                        </Text>
                                        <Text size="sm" c="dimmed" style={{ flexShrink: 0 }}>
                                            {getTimeAgo(notification.created_at)}
                                        </Text>
                                    </Stack>
                                </Paper>
                            ))
                        )}
                    </ScrollArea>
                </Card>
            </Popover.Dropdown>
        </Popover>
    );
}