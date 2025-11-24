import React, { useEffect, useState, } from 'react';
import {
    Box,
    Card, Group,
    ScrollArea,
    Select,
    Text, Paper
} from '@mantine/core';
import { useSelector } from 'react-redux';
import { BarChart } from "@mantine/charts";
import { translate } from "../../utils/i18n";
import { IconSelector } from '@tabler/icons-react';
import ProjectSummery from './ProjectSummery';
import { useElementSize } from '@mantine/hooks';
import { all } from 'axios';
import { set } from 'date-fns';

const DashboardBarChart = () => {
    const { userProjects, allProjects } = useSelector((state) => state.settings.myTask);
    const { loggedUserId } = useSelector((state) => state.auth.user);
    const { loggedInUser } = useSelector((state) => state.auth.session);
    const { ref, width, height } = useElementSize();

    const userId = loggedInUser?.loggedUserId ?? loggedUserId;
    const isAdmin = loggedInUser?.llc_roles?.some(role => ['superadmin', 'admin'].includes(role.slug));

    const [view, setView] = useState('chart');
    const [userProjectShort, setUserProjectShort] = useState([]);
    const [allProjectShort, setAllProjectShort] = useState([]);

    useEffect(() => {
        const shortened = allProjects.map(arr => {
            if(arr.name.toString().length > 4){
                return { ...arr, nameShortened: arr.name.toString().substring(0, 4) + '...'  }
            }
            return arr;
        })
        setAllProjectShort(shortened);
        
    },[allProjects]);
    
    useEffect(() => {
        const shortened = userProjects.map(arr => {
            if(arr.name.toString().length > 4){
                return { ...arr, nameShortened: arr.name.toString().substring(0, 4) + '...'  }
            }
            return arr;
        })
        setUserProjectShort(shortened);
    },[userProjects]);

    function ChartTooltip({ label, payload }) {
        if (!payload) return null;

        return (
            <Paper px="md" py="sm" withBorder shadow="md" radius="md">
            <Text fw={500} mb={5}>
                {payload[0]?.payload?.name}
            </Text>
            {payload.map(item => (
                <Text key={item.name} c={item.color} fz="sm">
                {item.name}: {item.value}
                </Text>
            ))}
            </Paper>
        );
    }

    return (
        <Card padding="xs" withBorder radius="sm" h={440} ref={ref}>
            <Card.Section withBorder inheritPadding className="bg-[#EBF1F4] ">
                <Group justify='space-between' align='center' p={4}>
                    <Text fw={600} size='md'>{translate('Project Summary')}</Text>
                    <Box maw={120}
                        style={{
                            backgroundColor: '#fff',
                            borderRadius: 8,
                            paddingLeft: 8,
                            height: 37,
                        }}
                    >
                        <Select
                            size="sm"
                            variant="unstyled"
                            placeholder="Select View"
                            data={[
                                { value: 'chart', label: translate('Chart') },
                                { value: 'list', label: translate('List') }
                            ]}
                            value={view}
                            onChange={setView}
                            allowDeselect={false}
                            comboboxProps={{ width: 120, position: 'bottom-start' }}
                            rightSection={<IconSelector size={16} stroke={2} color="#202020" />}
                        />
                    </Box>
                </Group>
            </Card.Section>
            {view === 'chart' ? (
                        <ScrollArea h={height} w={width} scrollbarSize={2}>
                            <Box w={3000} >
                                <BarChart
                                    h={350}
                                    data={isAdmin ? allProjectShort : userProjectShort}
                                    dataKey="nameShortened"
                                    type="stacked"
                                    withLegend
                                    legendProps={{ verticalAlign: 'bottom', height: 30 }}
                                    tooltipProps={{
                                        content: ({ label, payload }) => <ChartTooltip label={label} payload={payload} />,
                                    }}
                                    fillOpacity={1}
                                    series={[
                                        { name: translate('ACTIVE'), color: '#2D9CDB' },
                                        { name: translate('COMPLETED'), color: '#41C610' },
                                        { name: translate('OVERDUE'), color: '#E62727' },
                                    ]}
                                    barProps={{
                                        barSize: Math.max(20, 100 - (isAdmin ? (allProjects.length * 8) :(userProjects.length * 8))),
                                    }}
                                />
                            </Box>
                    </ScrollArea>

            ) : (
                <ProjectSummery />
            )}
        </Card>
    );
};

export default DashboardBarChart;
