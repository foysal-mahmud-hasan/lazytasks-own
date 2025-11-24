import React, { useState, } from 'react';
import { Box, Card, Flex, Group, Select, Tabs, Text } from '@mantine/core';
import { IconSelector } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import TaskList from "./TaskList";
import { translate } from "../../utils/i18n";
import MyTaskCalendarView from './MyTaskCalendarView';

const TaskListTabs = () => {
    const { userTaskOrdered, userTaskListSections, userTaskColumns, allTasks } = useSelector((state) => state.settings.myTask);
    const [activeTab, setActiveTab] = useState('all');
    const [view, setView] = useState('list');

    return (
        <Card withBorder radius="sm" h={440}>
            <Card.Section withBorder inheritPadding className="bg-[#EBF1F4] mb-2">
                <Group justify='space-between' align='center' p={4}>
                    <Text fw={600} size='md'>{translate('My Tasks')}</Text>
                    <Box maw={120}
                        style={{
                            backgroundColor: '#fff',
                            borderRadius: 8,
                            paddingLeft: 8,
                            height: 35,
                        }}
                    >
                        <Select
                            size="sm"
                            variant="unstyled"
                            placeholder="Select View"
                            data={[
                                { value: 'list', label: 'List' },
                                { value: 'calendar', label: 'Calendar' }
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
            {view === 'list' ? (
                <Card.Section px="xs" pb="xs">
                    <Tabs variant="pills" radius="sm" value={activeTab}
                        className='my-tabs'
                        styles={{
                            tab: { color: '#202020', backgroundColor: '#F5F8F9' },
                        }}
                        onChange={setActiveTab}
                    >
                        <Tabs.List className="mb-3">
                            {userTaskOrdered && userTaskOrdered.length > 0 && userTaskOrdered.map((taskListSection, index) => (
                                <Tabs.Tab value={taskListSection} className="font-bold" key={index}>
                                    {translate(userTaskListSections && userTaskListSections[taskListSection] && userTaskListSections[taskListSection])}
                                </Tabs.Tab>
                            ))}
                        </Tabs.List>

                        {userTaskOrdered && userTaskOrdered.length > 0 ? (
                            <>
                                {userTaskOrdered.map((taskListSection, index) => (
                                    <Tabs.Panel key={index} value={taskListSection}>
                                        <TaskList slug={taskListSection} header={userTaskListSections && userTaskListSections[taskListSection]} />
                                    </Tabs.Panel>
                                ))}
                            </>
                        ) : (
                            <Box mih={355} w={"100%"}>
                                <Flex direction="column" align="center" justify="center">
                                    <Text c="dimmed" ta="center" py="xl">{translate('No Task Found')}</Text>
                                </Flex>
                            </Box>
                        )}

                    </Tabs>
                </Card.Section>
            ) : (
                <MyTaskCalendarView tasks={allTasks} />
            )}

        </Card>
    );
};

export default TaskListTabs;
