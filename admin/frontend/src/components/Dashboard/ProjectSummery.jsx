import React from 'react';
import {
    ScrollArea,
    Table, Text, Card, Group,
    Box,
    Flex,
    ThemeIcon
} from '@mantine/core';
import { useSelector } from 'react-redux';
import { IconCircleFilled } from "@tabler/icons-react";
import { NavLink } from "react-router-dom";
import { translate } from "../../utils/i18n";
import UsersAvatarGroup from '../ui/UsersAvatarGroup';

const ProjectSummery = () => {
    const { userProjects, allProjects } = useSelector((state) => state.settings.myTask);
    const { loggedUserId } = useSelector((state) => state.auth.user);
    const { loggedInUser } = useSelector((state) => state.auth.session);

    const userId = loggedInUser?.loggedUserId ?? loggedUserId;
    const isAdmin = loggedInUser?.llc_roles?.some(role => ['superadmin', 'admin'].includes(role.slug));
    const projects = isAdmin ? allProjects : userProjects;

    const rows = userProjects && userProjects.length > 0 && userProjects.map((element) => (
        <Table.Tr key={element.id} title={element.name}>
            <Table.Td title={element.name}>
                <Text fz="sm" title={element.name} lineClamp={1}>
                    <NavLink to={`/project/task/list/${element.id}`}>
                        {element.name}
                    </NavLink>
                </Text>
            </Table.Td>
            <Table.Td style={{ textAlign: 'center' }}>{element.ACTIVE}</Table.Td>
            <Table.Td style={{ textAlign: 'center' }}>{element.COMPLETED}</Table.Td>
            <Table.Td style={{ textAlign: 'center' }}>{parseInt(element.ACTIVE ? element.ACTIVE : 0) + parseInt(element.COMPLETED ? element.COMPLETED : 0)}</Table.Td>
        </Table.Tr>
    ));
    return (

        <Box
            justify="center"
            align="center"
            mih={350}
            h={"auto"}
        >
            <ScrollArea className="relative h-[360px] pb-[2px]" scrollbarSize={4}>
                {/* <Table striped withRowBorders={false} highlightOnHover>
                    <Table.Thead>
                        <Table.Tr className={`!bg-[#B365B8] text-white`}>
                            <Table.Th>{translate('Name')}</Table.Th>
                            <Table.Th style={{ textAlign: 'center' }}>{translate('Active')}</Table.Th>
                            <Table.Th style={{ textAlign: 'center' }}>{translate('Completed')}</Table.Th>
                            <Table.Th style={{ textAlign: 'center' }}>{translate('Total')}</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>{rows}</Table.Tbody>
                </Table> */}
                {projects && projects.length > 0 && projects.map((project) => (
                    <NavLink to={`/project/task/list/${project.id}`}>
                        <Card key={project.id} padding="sm" className='mb-2 mt-0' shadow="sm" radius="sm"
                            withBorder style={{ borderColor: '#39758d', cursor: 'pointer', backgroundColor: 'white' }}
                        >
                            <Group position="apart" justify='space-between' mt={-7} mb="xs">
                                <Text size="sm" fw={500}>
                                    {project.name}
                                </Text>
                                <UsersAvatarGroup users={project.members} size={30} maxCount={2} />

                            </Group>

                            <Group justify="space-between" align="flex-end" mb={5}>
                                <Group gap={20}>
                                    {/* Company Name */}
                                    <Flex align="center" gap={6}>
                                        <ThemeIcon color="#2D9CDB" size={10} radius="xl">
                                            <IconCircleFilled size={8} color="#2D9CDB" />
                                        </ThemeIcon>
                                        <Text size="xs">{project.company_name}</Text>
                                    </Flex>
                                    {/* Users engaged */}
                                    <Flex align="center" gap={6}>
                                        <ThemeIcon color="orange" size={10} radius="xl">
                                            <IconCircleFilled size={8} color="#F1975A" />
                                        </ThemeIcon>
                                        <Text size="xs">{project.members?.length || 0} users engaged</Text>
                                    </Flex>
                                    {/* Tasks count */}
                                    <Flex align="center" gap={6}>
                                        <ThemeIcon color="#39758D" size={10} radius="xl">
                                            <IconCircleFilled size={8} color="#39758D" />
                                        </ThemeIcon>
                                        <Text size="xs">{project.total_tasks} task</Text>
                                    </Flex>
                                </Group>
                                <Group gap={20}>
                                    {/* Project Status */}
                                    <Flex align="center" gap={6}>
                                        <ThemeIcon color="#fab005" size={10} radius="xl">
                                            <IconCircleFilled size={8} color="#fab005" />
                                        </ThemeIcon>
                                        <Text size="xs">{translate('Active')} - {project.ACTIVE || 0}</Text>
                                    </Flex>
                                    <Flex align="center" gap={6}>
                                        <ThemeIcon color="#27AE60" size={10} radius="xl">
                                            <IconCircleFilled size={8} color="#27AE60" />
                                        </ThemeIcon>
                                        <Text size="xs">{translate('Completed')} - {project.COMPLETED || 0}</Text>
                                    </Flex>
                                </Group>
                            </Group>
                        </Card>
                    </NavLink>
                ))}
            </ScrollArea>
        </Box>
    );
};

export default ProjectSummery;
