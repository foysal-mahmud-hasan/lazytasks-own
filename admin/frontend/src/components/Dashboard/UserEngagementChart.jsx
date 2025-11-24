import {
    Text, Card, Group,
    Box,
    Badge,
    Overlay,
} from '@mantine/core';
import { translate } from "../../utils/i18n";
import { ScatterChart } from '@mantine/charts';
import { IconRocket } from '@tabler/icons-react';

const UserEngagementChart = () => {

    const data = [
        {
            color: '#40c057',
            name: 'Charlie',
            data: [
                { task: 25, project: 20 },
                { task: 30, project: 22 },
                { task: 35, project: 18 },
                { task: 40, project: 25 },
                { task: 45, project: 30 },
                { task: 28, project: 15 },
                { task: 22, project: 12 },
                { task: 50, project: 28 },
                { task: 32, project: 19 },
                { task: 48, project: 31 },
                { task: 26, project: 24 },
                { task: 38, project: 27 },
                { task: 42, project: 29 },
                { task: 29, project: 16 },
                { task: 34, project: 23 },
                { task: 44, project: 33 },
                { task: 23, project: 14 },
                { task: 37, project: 26 },
                { task: 49, project: 34 },
                { task: 27, project: 17 },
            ],
        },
        {
            color: '#be4bdb',
            name: 'Alice',
            data: [
                { task: 26, project: 21 },
                { task: 31, project: 24 },
                { task: 37, project: 19 },
                { task: 42, project: 27 },
                { task: 29, project: 32 },
                { task: 35, project: 18 },
                { task: 40, project: 23 },
                { task: 45, project: 30 },
                { task: 27, project: 15 },
                { task: 33, project: 20 },
                { task: 38, project: 25 },
                { task: 43, project: 29 },
                { task: 30, project: 16 },
                { task: 36, project: 22 },
                { task: 41, project: 28 },
                { task: 46, project: 33 },
                { task: 28, project: 17 },
                { task: 34, project: 22 },
                { task: 39, project: 26 },
            ],
        },
    ];
    return (
        <Card withBorder radius="sm" h={"100%"}>
            <Overlay
                blur={2}
                opacity={0.7}
                color="#fff"
                zIndex={10}
            />
            <Group
                pos="absolute"
                top="50%"
                left="50%"
                style={{
                    transform: 'translate(-50%, -50%)',
                    zIndex: 20,
                }}
            >
                <Badge size="lg" color="orange" variant="filled" radius="lg" leftSection={<IconRocket size={16} style={{ marginRight: 4 }} />}>
                    {translate('Upcoming')}
                </Badge>
            </Group>
            <Card.Section withBorder inheritPadding py="xs" mt={-15} className="bg-[#EBF1F4] mb-2">
                <Group justify="space-between" align="center">
                    <Text fw={600} size='md'>{translate('User Engagement Scatter Plot')}</Text>
                </Group>
            </Card.Section>
            <Box p="sm" bg="#FBFCFD">
                <ScatterChart
                    h={400}
                    data={data}
                    dataKey={{ x: 'task', y: 'project' }}
                    xAxisLabel="Projects"
                    yAxisLabel="Tasks"
                />
            </Box>
        </Card>

    );
};

export default UserEngagementChart;
