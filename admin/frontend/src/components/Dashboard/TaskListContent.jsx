import React, { useState, useEffect, Fragment, useRef } from 'react';
import {
    ActionIcon,
    Button,
    Input,
    Menu,
    rem,
    ScrollArea,
    Textarea,
    TextInput,
    Title,
    Text,
    Card, Group, Table,
    Box,
    Badge,
    Grid
} from '@mantine/core';
import { useSelector, useDispatch } from 'react-redux';
import { createQuickTask } from "../Settings/store/quickTaskSlice";
import dayjs from "dayjs";
import { IconCalendar, IconDeviceFloppy, IconEdit, IconMinus } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import TaskAssignTo from '../Elements/Project/TasksElements/Task/TaskAssignTo';
import TaskDueDate from '../Elements/Project/TasksElements/Task/TaskDueDate';
import { translate } from '../../utils/i18n';

const TaskListContent = ({ tasks, header }) => {
    return (
        <ScrollArea className={`relative ${appLocalizer?.is_admin ? 'h-[323px]' : 'h-[322px]'}`} scrollbarSize={4}>
            <Box>
                <Grid px="md" py={8} bg="#EBF1F4" gutter="xs" align="center">
                    <Grid.Col span={6}>
                        <Text fw={600} size="sm" c="black">{translate('Task Name')}</Text>
                    </Grid.Col>
                    <Grid.Col span={3} style={{ textAlign: 'center' }}>
                        <Text fw={600} size="sm" c="black">{translate('Priority')}</Text>
                    </Grid.Col>
                    <Grid.Col span={3} style={{ textAlign: 'center' }}>
                        <Text fw={600} size="sm" c="black">{translate('Due Date')}</Text>
                    </Grid.Col>
                </Grid>
                {tasks && tasks.length > 0 && tasks.filter(task => task.project && task.project.status == 1).map((task, index) => (
                    <Grid
                        key={task.id}
                        px="md"
                        py={8}
                        gutter="xs"
                        align="center"
                        style={{
                            background: index % 2 === 0 ? '#F5F8F9' : '#FDFDFD',
                        }}
                    >
                        <Grid.Col span={6}>
                            <Text size="sm" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} dangerouslySetInnerHTML={{ __html: task.name }} />
                        </Grid.Col>
                        <Grid.Col span={3} style={{ textAlign: 'center' }}>
                            {task.priority && task.priority.name ? (
                                <Badge color={task.priority.color_code} size="md">{task.priority.name}</Badge>
                            ) : (
                                <Badge color="#F4F4F4" size="md" >
                                    <IconMinus color="#4d4d4d" size="18" />
                                </Badge>
                            )}
                        </Grid.Col>
                        <Grid.Col span={3} style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <TaskDueDate
                                taskId={task.id}
                                startDate={task.start_date}
                                dueDate={task.end_date}
                                startDateIsVisible={task.start_date_is_visible}
                                dueDateIsVisible={task.end_date_is_visible}
                            />
                        </Grid.Col>
                    </Grid>
                ))}

            </Box>
            {/* {tasks && tasks.length > 5 &&
                <div className="absolute bottom-0 right-1 bg-white">
                    <Link to={`/my-task`}>
                        <Button color="#ED7D31" radius="xl" size="compact-xs">
                            More...
                        </Button>
                    </Link>
                </div>
            } */}
        </ScrollArea>
    );
};

export default TaskListContent;
