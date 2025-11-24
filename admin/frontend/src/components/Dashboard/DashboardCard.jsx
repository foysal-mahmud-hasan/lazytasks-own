import { useEffect } from 'react';
import {
    Text, Card,
    Stack, Box,
    Grid,
    RingProgress,
    Flex
} from '@mantine/core';
import { useSelector, useDispatch } from 'react-redux';
import { fetchTaskCounts } from "../Settings/store/taskSlice";
import { translate } from "../../utils/i18n";

const DashboardCard = () => {
    const dispatch = useDispatch();
    const { taskCount } = useSelector((state) => state.settings.task);

    useEffect(() => {
        if (!taskCount || Object.keys(taskCount).length === 0) {
            dispatch(fetchTaskCounts());
        }
    }, [dispatch]);

    return (
        <Stack spacing="sm">
            <Grid columns={12}>
                <Grid.Col span={{ base: 12, sm: 6, md: 6, lg: 3, xl: 3 }}>
                    <Card
                        radius="md"
                        withBorder
                        padding="md"
                        bg="#FCEBE0"
                        h={'100%'}
                    >
                        <Grid columns={12}>
                            <Grid.Col span={6}>
                                <Flex justify="flex-start" align="center" h="100%">
                                    <Stack gap="xs" justify="space-between" h="100%">
                                        <Box>
                                            <Text size="xl" c="black" fw={500}>
                                                {translate('Total Tasks')}
                                            </Text>
                                            <Text style={{ fontSize: '32px' }} c="black" fw={600}>
                                                {taskCount && taskCount.total_tasks || 0}
                                            </Text>
                                            <Text size="sm" c="#6A6A6A" mt={2}>
                                                {translate('%d projects').replace('%d', taskCount && taskCount.projectsData && taskCount.projectsData.length)}
                                            </Text>
                                        </Box>
                                    </Stack>
                                </Flex>
                            </Grid.Col>
                            <Grid.Col span={6}>
                                <Flex justify="flex-end" align="center" h="100%">
                                    <RingProgress
                                        size={120}
                                        thickness={15}
                                        sections={
                                            taskCount && taskCount.projectsData && taskCount.projectsData.length > 0 ? taskCount.projectsData.map((project, index) => ({
                                                value: (project.total_tasks / taskCount.total_tasks) * 100,
                                                color: project.color || '#39758D',
                                                tooltip: project.project_name + ' (' + project.total_tasks + ' Tasks)'
                                            })) : [
                                                { value: 100, color: '#39758D' }
                                            ]
                                        }
                                        label={
                                            <Text c="black" fw={500} ta="center" size="sm">
                                                {taskCount && taskCount.total_tasks_percentage || 0}%
                                            </Text>
                                        }
                                        rootColor="white"
                                    />
                                </Flex>
                            </Grid.Col>
                        </Grid>
                    </Card>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 6, lg: 3, xl: 3 }}>
                    <Card
                        radius="md"
                        withBorder
                        padding="md"
                        bg="#DBE5FF"
                        h={'100%'}
                    >
                        
                        <Grid columns={12}>
                            <Grid.Col span={6}>
                                <Flex justify="flex-start" align="center" h="100%">
                                    <Stack gap="xs" justify="space-between" h="100%">
                                        <Box>
                                            <Text size="xl" c="black" fw={500}>
                                                {translate('Tasks In Progress')}
                                            </Text>
                                            <Text style={{ fontSize: '32px' }} c="black" fw={600}>
                                                {taskCount && taskCount.pending_tasks || 0}
                                            </Text>
                                            <Text size="sm" c="#6A6A6A" mt={2}>
                                                {translate('%d projects').replace('%d', taskCount && taskCount.projectsData && taskCount.projectsData.length)}
                                            </Text>
                                        </Box>
                                    </Stack>
                                </Flex>
                            </Grid.Col>
                            <Grid.Col span={6}>
                                <Flex justify="flex-end" align="center" h="100%">
                                    <RingProgress
                                        size={120}
                                        thickness={15}
                                        transitionDuration={250}
                                        sections={
                                            taskCount && taskCount.projectsData && taskCount.projectsData.length > 0 ? taskCount.projectsData.map((project, index) => ({
                                                value: (project.active_tasks / taskCount.pending_tasks) * 100,
                                                color: project.color || '#39758D',
                                                tooltip: project.project_name + ' (' + project.active_tasks + ' Tasks)'
                                            })) : [
                                                { value: 100, color: '#39758D' }
                                            ]
                                        }
                                        label={
                                            <Text c="black" fw={500} ta="center" size="sm">
                                                {taskCount && taskCount.pending_tasks_percentage || 0}%
                                            </Text>
                                        }
                                        rootColor="white"
                                    />
                                </Flex>
                            </Grid.Col>


                        </Grid>
                        
                    </Card>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 6, lg: 3, xl: 3 }}>
                    <Card
                        radius="md"
                        withBorder
                        padding="md"
                        bg="#E7F4E8"
                        h={'100%'}
                    >
                        <Grid columns={12}>
                            <Grid.Col span={6}>
                                <Flex justify="flex-start" align="center" h="100%">
                                    <Stack gap="xs" justify="space-between" h="100%">
                                        <Box>
                                            <Text size="xl" c="black" fw={500}>
                                                {translate('Tasks Completed')}
                                            </Text>
                                            <Text style={{ fontSize: '32px' }} c="black" fw={600}>
                                                {taskCount && taskCount.completed_tasks || 0}
                                            </Text>
                                            <Text size="sm" c="#6A6A6A" mt={2}>
                                                {translate('%d projects').replace('%d', taskCount && taskCount.projectsData && taskCount.projectsData.length)}
                                            </Text>
                                        </Box>
                                    </Stack>
                                </Flex>
                            </Grid.Col>
                            <Grid.Col span={6}>
                                <Flex justify="flex-end" align="center" h="100%">
                                    <RingProgress
                                        size={120}
                                        thickness={15}
                                        transitionDuration={250}
                                        sections={
                                            taskCount && taskCount.projectsData && taskCount.projectsData.length > 0 ? taskCount.projectsData.map((project, index) => ({
                                                value: (project.completed_tasks / taskCount.completed_tasks) * 100,
                                                color: project.color || '#39758D',
                                                tooltip: project.project_name + ' (' + project.completed_tasks + ' Tasks)'
                                            })) : [
                                                { value: 100, color: '#39758D' }
                                            ]
                                        }
                                        label={
                                            <Text c="black" fw={500} ta="center" size="sm">
                                                {taskCount && taskCount.completed_tasks_percentage || 0}%
                                            </Text>
                                        }
                                        rootColor="white"
                                    />
                                </Flex>
                            </Grid.Col>
                        </Grid>
                    </Card>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 6, lg: 3, xl: 3 }}>
                    <Card
                        radius="md"
                        withBorder
                        padding="md"
                        bg="#F9D9E0"
                        h={'100%'}
                    >
                        <Grid columns={12}>
                            <Grid.Col span={6}>
                                <Flex justify="flex-start" align="center" h="100%">
                                    <Stack gap="xs" justify="space-between" h="100%">
                                        <Box>
                                            <Text size="xl" c="black" fw={500}>
                                                {translate('Overdue Tasks')}
                                            </Text>
                                            <Text style={{ fontSize: '32px' }} c="black" fw={600}>
                                                {taskCount && taskCount.overdue_tasks || 0}
                                            </Text>
                                            <Text size="sm" c="#6A6A6A" mt={2}>
                                                {translate('%d projects').replace('%d', taskCount && taskCount.projectsData && taskCount.projectsData.length)}
                                            </Text>
                                        </Box>
                                    </Stack>
                                </Flex>
                            </Grid.Col>
                            <Grid.Col span={6}>
                                <Flex justify="flex-end" align="center" h="100%">
                                    <RingProgress
                                        size={120}
                                        thickness={15}
                                        transitionDuration={250}
                                        sections={
                                            taskCount && taskCount.projectsData && taskCount.projectsData.length > 0 ? taskCount.projectsData.map((project, index) => ({
                                                value: (project.overdue_tasks / taskCount.overdue_tasks) * 100,
                                                color: project.color || '#39758D',
                                                tooltip: project.project_name + ' (' + project.overdue_tasks + ' Tasks)'
                                            })) : [
                                                { value: 100, color: '#39758D' }
                                            ]
                                        }
                                        label={
                                            <Text c="black" fw={500} ta="center" size="sm">
                                                {taskCount && taskCount.overdue_tasks_percentage || 0}%
                                            </Text>
                                        }
                                        rootColor="white"
                                    />
                                </Flex>
                            </Grid.Col>
                        </Grid>
                    </Card>
                </Grid.Col>
            </Grid>
        </Stack>

    );
};

export default DashboardCard;
