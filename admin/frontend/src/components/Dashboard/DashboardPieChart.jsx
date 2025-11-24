import { useState, useEffect } from 'react';
import {
    Box,
    Card, Divider, Flex, Grid, Group, Select,
    Text,ScrollArea
} from '@mantine/core';
import { useSelector, useDispatch } from 'react-redux';
import { PieChart } from "@mantine/charts";
import { IconSelector } from '@tabler/icons-react';
import { translate } from "../../utils/i18n";
import { fetchProjectsPieChartsData } from "../Settings/store/taskSlice";

function LegendItem({ label, color }) {
    return (
        <Group gap="xs" style={{ flexWrap: "nowrap" }}>
            <Box
                w={12}
                h={12}
                style={{
                    backgroundColor: color,
                    borderRadius: "50%",
                    flexShrink: 0,
                }}
            />
            <Text size="sm" c="dimmed">
                {label}
            </Text>
        </Group>
    )
}

const DashboardPieChart = () => {
    const dispatch = useDispatch();
    const { pieChartData } = useSelector((state) => state.settings.task);
    const { loggedUserId } = useSelector((state) => state.auth.user);
    const { loggedInUser } = useSelector((state) => state.auth.session);

    const [selectedProject, setSelectedProject] = useState(null);
    const [projectPriorityData, setProjectPriorityData] = useState([]);
    const [projectStatusData, setProjectStatusData] = useState([]);

    const userId = loggedInUser?.loggedUserId ?? loggedUserId;
    const isAdmin = loggedInUser?.llc_roles?.some(role => ['superadmin', 'admin'].includes(role.slug));

    useEffect(() => {
        if (!pieChartData || Object.keys(pieChartData).length === 0) {
            dispatch(fetchProjectsPieChartsData({ id: isAdmin ? null : userId }));
        }
    }, [dispatch, loggedInUser, loggedUserId]);

    useEffect(() => {
        if (pieChartData && pieChartData.length > 0) {
            setSelectedProject(pieChartData[0]?.id.toString());
            setProjectPriorityData(pieChartData[0]?.priorities || []);
            setProjectStatusData(pieChartData[0]?.statuses || []);
        }
    }, [pieChartData]);

    useEffect(() => {
        if (selectedProject && pieChartData && pieChartData.length > 0) {
            const project = pieChartData.find(p => p.id.toString() === selectedProject);
            setProjectPriorityData(project?.priorities || []);
            setProjectStatusData(project?.statuses || []);
        }
    }, [selectedProject, pieChartData]);

    return (
        <Card padding="md" withBorder radius="md" h={"100%"}>
            <Card.Section withBorder inheritPadding className="bg-[#EBF1F4] mb-2">
                <Group justify='space-between' align='center' p={4}>
                    <Text fw={600} size='md'>{translate('Priority & Status Overview')}</Text>
                    <Box style={{
                        backgroundColor: '#fff',
                        borderRadius: 8,
                        paddingLeft: 8,
                        height: 35,
                    }}>
                        <Select
                            size="sm"
                            variant="unstyled"
                            placeholder="Select Project"
                            onChange={setSelectedProject}
                            data={
                                pieChartData && pieChartData.length > 0
                                && pieChartData.map((project) => ({
                                    value: project.id.toString(),
                                    label: project.name,
                                }))
                            }
                            value={selectedProject && selectedProject}
                            allowDeselect={false}
                            rightSection={<IconSelector size={16} stroke={2} color="#202020" />}
                        />
                    </Box>
                </Group>
            </Card.Section>
            <Grid columns={12}>
                <Grid.Col span={{ base: 12, sm: 12, md: 6, lg: 6, xl: 6 }}>
                    <Card padding="md" radius="md" bg={"#F9F9F9"} h={"auto"}>
                        <Card.Section withBorder inheritPadding py="xs" className="bg-[#F9D7BF] mb-2">
                            <Group justify='space-between' align='center'>
                                <Text fw={500} size='md'>{translate('Priority')}</Text>
                            </Group>
                        </Card.Section>
                        <Box
                            mih={280}
                            h={"auto"}
                            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'visible', padding: '1.5rem', color: 'white' }}
                        >
                            {projectPriorityData.filter(item => item.task_count > 0).length > 0 ? (
                                <PieChart
                                    data={projectPriorityData
                                        .filter(item => item.task_count > 0)
                                        .map(item => ({
                                            name: item.priority_name,
                                            value: item.task_count,
                                            color: item.color_code
                                        }))
                                    }
                                    withLabels
                                    withLabelsLine={false}
                                    labelColor="black"
                                    labelsPosition="outside"
                                    labelsType="percent"
                                    withTooltip tooltipDataSource="segment"
                                    styles={{
                                        label: { fontSize: 16, fontWeight: 700 },
                                    }}
                                    h={280}
                                    w={280}
                                />
                            ) : (
                                <Box mih={280} py={84} w={"100%"}>
                                    <Flex direction="column" align="center" justify="center">
                                        <Text c="dimmed" ta="center" py="xl">{translate('No tasks available')}</Text>
                                    </Flex>
                                </Box>
                            )}
                        </Box>
                        <Divider my="sm" />
                        <ScrollArea h={60} scrollbarSize={4} w={"100%"}>
                            <Group position="center" justify='center' spacing="xl">
                                {projectPriorityData && projectPriorityData.length > 0 && projectPriorityData.map((item) => (
                                    <LegendItem key={item.priority_name} label={translate(item.priority_name)} color={item.color_code} />
                                ))}
                            </Group>
                        </ScrollArea>
                    </Card>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 12, md: 6, lg: 6, xl: 6 }}>
                    <Card padding="md" radius="md" bg={"#F9F9F9"} h={"auto"}>
                        <Card.Section withBorder inheritPadding py="xs" className="bg-[#F9D7BF] mb-2">
                            <Group justify='space-between' align='center'>
                                <Text fw={500} size='md'>{translate('Status')}</Text>
                            </Group>
                        </Card.Section>
                        <Box
                            mih={280}
                            h={"auto"}
                            w={"100%"}
                            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'visible', padding: '1.5rem', color: 'white' }}
                        >
                            {projectStatusData.filter(item => item.task_count > 0).length > 0 ? (
                                <PieChart
                                    data={projectStatusData
                                        .filter(item => item.task_count > 0)
                                        .map(item => ({
                                            name: item.status_name,
                                            value: item.task_count,
                                            color: item.color_code
                                        }))
                                    }
                                    withLabels
                                    withLabelsLine={false}
                                    labelColor="black"
                                    labelsPosition="outside"
                                    labelsType="percent"
                                    withTooltip tooltipDataSource="segment"
                                    styles={{
                                        label: { fontSize: 16, fontWeight: 700 },
                                    }}
                                    h={280}
                                    w={280}
                                />
                            ) : (
                                <Box mih={280} py={84} w={"100%"}>
                                    <Flex direction="column" align="center" justify="center">
                                        <Text c="dimmed" ta="center" py="xl">{translate('No tasks available')}</Text>
                                    </Flex>
                                </Box>
                            )}
                        </Box>
                        <Divider my="sm" />
                        <ScrollArea h={60} scrollbarSize={4} w={"100%"}>
                            <Group position="center" justify='center' spacing="xl">
                                {projectStatusData && projectStatusData.length > 0 && projectStatusData.map((item) => (
                                    <LegendItem key={item.status_name} label={translate(item.status_name)} color={item.color_code} />
                                ))}
                            </Group>
                        </ScrollArea>
                    </Card>
                </Grid.Col>
            </Grid>

        </Card>
    );
};

export default DashboardPieChart;
