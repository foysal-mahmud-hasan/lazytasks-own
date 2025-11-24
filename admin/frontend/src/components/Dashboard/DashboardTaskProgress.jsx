import { useState, useEffect } from 'react';
import {
    Avatar,
    Box,
    Card,
    Group,
    Progress,
    ScrollArea,
    Select,
    Stack,
    Table,
    Text,
    Tooltip
} from '@mantine/core';
import { useSelector, useDispatch } from 'react-redux';
import { IconSelector } from '@tabler/icons-react';
import { translate } from "../../utils/i18n";
import { fetchMembersTasksCounts } from "../Settings/store/taskSlice";

function LegendItem({ label, color, value }) {
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
            {value && (
                <Text size="sm" c="#202020">
                    : {value}
                </Text>
            )}
        </Group>
    )
}

const DashboardTaskProgress = () => {

    const dispatch = useDispatch();
    const { membersTasksCounts } = useSelector((state) => state.settings.task);
    const { loggedUserId } = useSelector((state) => state.auth.user);
    const { loggedInUser } = useSelector((state) => state.auth.session);

    const [selectedProject, setSelectedProject] = useState(null);
    const [projectInfo, setProjectInfo] = useState({});
    const [memberTasks, setMemberTasks] = useState([]);

    const userId = loggedInUser?.loggedUserId ?? loggedUserId;
    const isAdmin = loggedInUser?.llc_roles?.some(role => ['superadmin', 'admin'].includes(role.slug));
    useEffect(() => {
        if (!membersTasksCounts || Object.keys(membersTasksCounts).length === 0) {
            dispatch(fetchMembersTasksCounts({ id: isAdmin ? null : userId }));
        }
    }, [dispatch, loggedInUser, loggedUserId]);

    useEffect(() => {
        if (membersTasksCounts && membersTasksCounts.length > 0) {
            setSelectedProject(membersTasksCounts[0]?.id.toString());
            setProjectInfo(membersTasksCounts[0] || {});
            setMemberTasks(membersTasksCounts[0]?.members || []);
        }
    }, [membersTasksCounts]);

    useEffect(() => {
        if (selectedProject && membersTasksCounts && membersTasksCounts.length > 0) {
            const project = membersTasksCounts.find(p => p.id.toString() === selectedProject);
            setMemberTasks(project?.members || []);
            setProjectInfo(project || {});
        }
    }, [selectedProject, membersTasksCounts]);

    return (
        <Card padding="md" withBorder radius="md" h={"100%"}
            style={{ display: 'flex', flexDirection: 'column', paddingTop: 16, paddingBottom: 16 }}
        >
            <Card.Section withBorder inheritPadding className="bg-[#EBF1F4] mb-2">
                <Group justify='space-between' align='center' p={4}>
                    <Text fw={600} size='md'>{translate('Task Distribution Matrix (By Project)')}</Text>
                    <Box style={{
                        backgroundColor: '#fff',
                        borderRadius: 8,
                        paddingLeft: 8,
                        height: 35,
                    }}>
                        <Select
                            size="sm"
                            c={"#202020"}
                            variant="unstyled"
                            placeholder="Select Project"
                            data={
                                membersTasksCounts && membersTasksCounts.length > 0
                                && membersTasksCounts.map((project) => ({
                                    value: project.id.toString(),
                                    label: project.name,
                                }))
                            }
                            value={selectedProject && selectedProject}
                            onChange={setSelectedProject}
                            allowDeselect={false}
                            rightSection={<IconSelector size={16} stroke={2} color="#202020" />}
                        />
                    </Box>
                </Group>
            </Card.Section>
            <Box style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Table.ScrollContainer style={{minHeight : 400, }} maxHeight={400} >
                    <Table layout="fixed" striped withRowBorders={false} highlightOnHover>
                        <Table.Tbody>
                            {memberTasks.map((member) => {
                                const getVisiblePercent = (percent) => {
                                    if (percent === 0) return 0;
                                    if (percent > 0 && percent < 1) return 0;
                                    if (percent < 5) return 5; // min 5% visible
                                    return percent;
                                };

                                // const total = member.total_tasks || 0;
                                const active = member.active_tasks || 0;
                                const completed = member.completed_tasks || 0;
                                const overdue = member.overdue_tasks || 0;
                                // const total = active + completed + overdue;

                                const total = projectInfo.total_assigned_tasks || 0; // Use total tasks from project

                                // Calculate percentages
                                let activePercent = total > 0 ? (active / total) * 100 : 0;
                                let completedPercent = total > 0 ? (completed / total) * 100 : 0;
                                let overduePercent = total > 0 ? (overdue / total) * 100 : 0;

                                const activeVisible = getVisiblePercent(activePercent);
                                const completedVisible = getVisiblePercent(completedPercent);
                                const overdueVisible = getVisiblePercent(overduePercent);

                                return (
                                    <Table.Tr key={member.id}>
                                        <Table.Td style={{ width: "220px" }}>
                                            <Group spacing="sm">
                                                <Avatar variant="light" name={member.name} radius="xl" size="md" color='orange' src={member.avatar} />
                                                <Text size="sm" c="dimmed" truncate="end" maw={120}>{member.name}</Text>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td style={{ width: "100%" }}>
                                            <Box style={{ minWidth: "300px" }}>
                                                <Progress.Root striped animated size={24} transitionDuration={400}
                                                    styles={{
                                                        label: { color: 'white', fontWeight: 'bold', fontSize: 12 },
                                                    }}
                                                >
                                                    {active > 0 ? (
                                                        <Tooltip label={`In Progress Task: ${active}`}>
                                                            <Progress.Section value={activeVisible} color="#2D9CDB">
                                                                <Progress.Label>{activePercent.toFixed(0)}%</Progress.Label>
                                                            </Progress.Section>
                                                        </Tooltip>
                                                    ) : null}
                                                    {overdue > 0 ? (
                                                        <Tooltip label={`Overdue Task: ${overdue}`}>
                                                            <Progress.Section value={overdueVisible} color="#E62727">
                                                                <Progress.Label>{overduePercent.toFixed(0)}%</Progress.Label>
                                                            </Progress.Section>
                                                        </Tooltip>
                                                    ) : null}
                                                </Progress.Root>
                                            </Box>
                                        </Table.Td>
                                    </Table.Tr>
                                );
                            })}
                        </Table.Tbody>
                    </Table>
                    </Table.ScrollContainer>
            </Box>
            <Group justify="space-between" align="center" mt="auto" style={{ width: '100%', paddingTop: '14px' }}>
                <Stack gap={8}>
                    <Group gap={5}>
                        <Text size="sm" c="dimmed">{translate('Total Tasks')}: </Text>
                        <Text size="sm" c="#202020">{projectInfo && projectInfo.total_tasks}</Text>
                    </Group>
                    <Group gap={5}>
                        <Text size="sm" c="dimmed">{translate('Total Assigned Tasks')}: </Text>
                        <Text size="sm" c="#202020">{projectInfo && projectInfo.total_assigned_tasks}</Text>
                    </Group>
                </Stack>
                <Group gap={10}>
                    <LegendItem label={translate('In Progress')} color="#2D9CDB" value={projectInfo && projectInfo.active_tasks} />
                    <LegendItem label={translate('Overdue')} color="#E62727" value={projectInfo && projectInfo.overdue_tasks}/>
                </Group>
            </Group>
        </Card>
    );
};

export default DashboardTaskProgress;
