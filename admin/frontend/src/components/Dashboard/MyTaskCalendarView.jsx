import React, { useState, useEffect, } from 'react';
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay } from "date-fns"
import { Paper, Group, Text, ActionIcon, UnstyledButton, Stack, Flex, Box, Badge, Grid, ScrollArea } from "@mantine/core"
import { useSelector, useDispatch } from 'react-redux';
import { translate } from "../../utils/i18n";
import { fetchUserTasksByDate } from "../Settings/store/myTaskSlice";
import { IconChevronLeft, IconChevronRight, IconCircleFilled, IconMinus } from '@tabler/icons-react';

const MyTaskCalendarView = () => {
    const dispatch = useDispatch();
    const { selectedTasks } = useSelector((state) => state.settings.myTask);
    const { loggedUserId } = useSelector((state) => state.auth.user);
    const { loggedInUser } = useSelector((state) => state.auth.session);

    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Get the start of the week for the current date
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }) // Monday start

    // Generate week days
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

    const navigateWeek = (direction) => {
        if (direction === "prev") {
            setCurrentDate(subWeeks(currentDate, 1))
        } else {
            setCurrentDate(addWeeks(currentDate, 1))
        }
    }

    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    const tasks = [
        {
            id: "1",
            title: "Build information of App on global settings",
            backgroundColor: "#fed7aa", // orange-200
            textColor: "#9a3412", // orange-800
        },
        {
            id: "2",
            title: "Screenshots Collect",
            backgroundColor: "#dbeafe", // blue-200
            textColor: "#1e40af", // blue-800
        },
        {
            id: "3",
            title: "Integret Payment Gateway",
            backgroundColor: "#dcfce7", // green-200
            textColor: "#166534", // green-800
        },
        {
            id: "4",
            title: "Develop Login Authentication System",
            backgroundColor: "#fed7aa", // orange-200
            textColor: "#9a3412", // orange-800
        },
        {
            id: "5",
            title: "Fix Bugs In Notification System",
            backgroundColor: "#dbeafe", // blue-200
            textColor: "#1e40af", // blue-800
        },
        {
            id: "6",
            title: "Fix Bugs In Notification System",
            backgroundColor: "#dbeafe", // blue-200
            textColor: "#1e40af", // blue-800
        },
        {
            id: "7",
            title: "Fix Bugs In Notification System",
            backgroundColor: "#dbeafe", // blue-200
            textColor: "#1e40af", // blue-800
        },
        {
            id: "8",
            title: "Fix Bugs In Notification System",
            backgroundColor: "#dbeafe", // blue-200
            textColor: "#1e40af", // blue-800
        },
        {
            id: "9",
            title: "Screenshots Collect",
            backgroundColor: "#dbeafe", // blue-200
            textColor: "#1e40af", // blue-800
        },
        {
            id: "10",
            title: "Screenshots Collect",
            backgroundColor: "#dbeafe", // blue-200
            textColor: "#1e40af", // blue-800
        },
    ]

    useEffect(() => {
        dispatch(fetchUserTasksByDate({ id: loggedInUser ? loggedInUser.loggedUserId : loggedUserId, data: { date: format(selectedDate, "yyyy-MM-dd") } }));
    }, [dispatch, selectedDate, loggedInUser, loggedUserId]);

    return (
        <Paper>
            <Group justify="space-between" mb="sm">
                <Text size='sm' c={'#202020'}>{format(currentDate, "MMMM yyyy")}</Text>
                <Group gap="xs">
                    <ActionIcon
                        variant="filled"
                        color="#EBF1F4"
                        onClick={() => navigateWeek("prev")}
                        radius="xl"
                    >
                        <IconChevronLeft size={16} color='#4D4D4D' />
                    </ActionIcon>
                    <ActionIcon variant="filled" color="#ED7D31" onClick={() => navigateWeek("next")}
                        radius="xl"
                    >
                        <IconChevronRight size={16} />
                    </ActionIcon>
                </Group>
            </Group>

            {/* Week Calendar */}
            <Box>
                <Flex gap={4} justify="space-between">
                    {weekDays.map((day, index) => {
                        const isSelected = isSameDay(day, selectedDate);
                        const isToday = isSameDay(day, new Date());
                        const dayNumber = format(day, "d");
                        const dayName = dayNames[index];

                        return (
                            <UnstyledButton
                                key={day.toISOString()}
                                onClick={() => setSelectedDate(day)}
                                style={{
                                    flex: 1,
                                    padding: "4px 0",
                                    borderRadius: "8px",
                                    backgroundColor: isSelected ? "#39758D" : "transparent",
                                    border: isSelected ? "none" : "1px solid #E9E9E9",
                                    color: isSelected ? "white" : "#374151",
                                    transition: "all 0.2s",
                                }}
                            >
                                <Stack align="center" gap="xs">
                                    <Group gap={4} justify='center' align="center">
                                        <Text size="sm" c={isSelected ? "#fff" : "#6A6A6A"}>
                                            {dayName}
                                        </Text>
                                        {isToday && (
                                            <IconCircleFilled size={10} color="orange" />
                                        )}
                                    </Group>
                                    <Text size="md" c={isSelected ? "#fff" : "#202020"}>
                                        {dayNumber}
                                    </Text>
                                </Stack>
                            </UnstyledButton>
                        )
                    })}
                </Flex>
            </Box>

            {/* Today Section */}
            <Stack gap="md">
                <Text size="md" mt={10} c={"#202020"}>
                    {format(selectedDate, "do MMMM, yyyy")}
                </Text>

                <ScrollArea className="relative h-[200px] pb-[2px]" scrollbarSize={4}>
                    <Stack gap="sm">
                        {selectedTasks && selectedTasks.length > 0 ? (
                            selectedTasks.map((task, index) => {
                                return (
                                    <Grid
                                        key={task.id}
                                        px="md"
                                        py={8}
                                        gutter="xs"
                                        align="center"
                                        style={{
                                            background: index % 2 === 0 ? '#FCEBE0' : '#E7F4E8',
                                        }}
                                    >
                                        <Grid.Col span={6}>
                                            <Text
                                                size="sm"
                                                style={{
                                                    maxWidth: 180,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                                dangerouslySetInnerHTML={{ __html: task.name }}
                                            />
                                        </Grid.Col>
                                        <Grid.Col span={6} style={{ textAlign: 'center' }}>
                                            {task.priority_name ? (
                                                <Badge color={task.priority_color_code} size="md">
                                                    {task.priority_name}
                                                </Badge>
                                            ) : (
                                                <Badge color="#F4F4F4" size="md">
                                                    <IconMinus color="#4d4d4d" size="18" />
                                                </Badge>
                                            )}
                                        </Grid.Col>
                                    </Grid>
                                );
                            })
                        ) : (
                            <Box py={84} px={10} w="100%">
                                <Text size="sm" c="#6A6A6A" align="center">
                                    {translate('No tasks available for this date.')}
                                </Text>
                            </Box>
                        )}
                    </Stack>
                </ScrollArea>
            </Stack>
        </Paper>
    );
};

export default MyTaskCalendarView;