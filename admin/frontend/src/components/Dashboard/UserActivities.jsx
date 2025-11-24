import { useEffect } from 'react';
import {
    ScrollArea,
    Text, Card, Group,
    Box,
    Stack,
} from '@mantine/core';
import { useSelector, useDispatch } from 'react-redux';
import { translate } from "../../utils/i18n";
import { fetchUserActivities } from '../Settings/store/taskSlice';
import UserAvatarSingle from '../ui/UserAvatarSingle';
import ActivityLogs from '../Elements/Project/TasksElements/ActivityLogs';

const UserActivities = () => {
    const dispatch = useDispatch();
    const { userActivities } = useSelector((state) => state.settings.task);
    const { loggedUserId } = useSelector((state) => state.auth.user);
    const { loggedInUser } = useSelector((state) => state.auth.session);

    useEffect(() => {
        dispatch(fetchUserActivities({ id: loggedInUser ? loggedInUser.loggedUserId : loggedUserId }));
    }, [dispatch, loggedInUser, loggedUserId]);

    return (
        <Card withBorder radius="sm" h={"100%"}>
            <Card.Section withBorder inheritPadding mt={-16} py="xs" className="bg-[#EBF1F4] mb-2">
                <Group justify="space-between" align="center">
                    <Text fw={600} size='md'>{translate('Recent Activities')}</Text>
                </Group>
            </Card.Section>

            <ScrollArea h={420} scrollbarSize={4}>
                <Stack gap="md">
                    {userActivities && userActivities.length > 0 ? userActivities.map((activity) => (
                        <Box key={activity.id} pos="relative">
                            <Group gap="sm" align="flex-start">
                                <UserAvatarSingle user={activity.user} size={32} />

                                <Box style={{ flex: 1, minWidth: 0 }}>
                                    <Text fw={600} size="sm" c="dark.8" mb={4}>
                                        {activity.user.name}
                                    </Text>

                                    {activity && (
                                        <Text c="#202020" size="sm">
                                            <ActivityLogs activity={activity} />
                                        </Text>
                                    )}

                                    <Text size="xs" c="dimmed" mt={4}>
                                        {activity.created_at_formatted}
                                    </Text>
                                </Box>
                            </Group>
                        </Box>
                    )): (
                        <Text c="dimmed" size="sm" align="center" mt={20}>
                            {translate('No recent activities found.')}
                        </Text>
                    )}
                </Stack>
            </ScrollArea>
        </Card>

    );
};

export default UserActivities;
