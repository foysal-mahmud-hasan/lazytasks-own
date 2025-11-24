import React from 'react';
import { Avatar, Text, Group, Stack } from '@mantine/core';
import { IconCalendar } from '@tabler/icons-react';
import useTwColorByName from "../../../../ui/useTwColorByName";
import acronym from "../../../../ui/acronym";

export default function CustomTooltip({ task }) {
    if (!task) return null;

    const bgColor = useTwColorByName();
    const start = new Date(task.start);
    const end = new Date(task.end);

    const durationDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)); // difference in days
    
    // Format dates as DD-MMM-YYYY
    const formatDate = (date) =>
        date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });

    return (
        <Stack gap="xs" p="xs" bg={'white'} style={{ minWidth: 180, border: '1px solid #ddd', borderRadius: 8, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            {/* Task title */}
            <Text fw={600} size="sm">
                {task.fullName}
            </Text>

            {/* Assigned user */}
            {task.assigned_to && (
                <Group gap="xs">
                    <Avatar
                        color={`${bgColor(task.assigned_to.name)["font-color"]}`}
                        bg={`${bgColor(task.assigned_to.name)["bg-color"]}`}
                        size={26}
                        radius={26}
                        src={task.assigned_to.avatar || null}
                    >
                        {!task.assigned_to.avatar && (
                            <Text style={{ lineHeight: "14px" }} size="xs">
                                {acronym(task.assigned_to.name)}
                            </Text>
                        )}
                    </Avatar>
                    <Text size="xs">{task.assigned_to.name}</Text>
                </Group>
            )}

            {/* Duration */}
            <Group gap={6} mt={2} align="center" justify='flex-start'>
                <IconCalendar size={14} />
                <Text size="xs">
                    {formatDate(start)} → {formatDate(end)}
                </Text>
            </Group>

            <Text size="xs" c="dimmed">
                Duration: {durationDays} {durationDays > 1 ? 'days' : 'day'}
            </Text>
        </Stack>
    );
}
