import { Popover, Card, List, Code, Title, Text, Paper, Group, Flex, Button, Table, ActionIcon } from '@mantine/core';
import { IconFolderSymlink, IconEye, IconX } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHotkeys } from '@mantine/hooks';
import { translate } from '../../../utils/i18n';

const ShortcutPopover = () => {
    const dispatch = useDispatch();
    const [opened, setOpened] = useState(false);

    const { loggedUserId } = useSelector((state) => state.auth.user);
    const { loggedInUser } = useSelector((state) => state.auth.session);

    return (
        <Popover
            width={500}
            position="bottom-end"
            opened={opened}
            onChange={setOpened}
            withArrow
        >
            <Popover.Target>
                <ActionIcon variant="outline" color="#E9E9E9" size={36} aria-label="Settings"
                    onClick={() => setOpened((o) => !o)}
                >
                    <IconFolderSymlink size={26} stroke={1.5} color='#4D4D4D'/>
                </ActionIcon>
            </Popover.Target>
            <Popover.Dropdown
                style={{
                    border: 'none',
                    backgroundColor: 'transparent',
                    padding: 0,
                }}
            >
                <Card padding="lg" withBorder radius="md" shadow='md'>
                    <Card.Section withBorder inheritPadding py="xs" className="bg-[#FDFDFD] mb-2">
                        <Group justify='space-between' align='center'>
                            {/* <Title order={6}>Keyboard Shortcuts</Title> */}
                            <Text fw={600} size='md'>{translate('Keyboard Shortcuts')}</Text>
                            <ActionIcon variant='subtle' onClick={() => setOpened(false)} color="gray">
                                <IconX style={{ height: "70%", width: "70%" }} stroke={1.5} />
                            </ActionIcon>
                        </Group>
                    </Card.Section>
                    <Table striped withRowBorders={false} highlightOnHover>
                        <Table.Tbody>
                            <Table.Tr>
                                <Table.Td>{translate('Inline Task Edit')}</Table.Td>
                                <Table.Td><Code color={"#EBF1F4"} c="black">Single Click</Code></Table.Td>
                            </Table.Tr>
                            <Table.Tr>
                                <Table.Td>{translate('View Task Details Drawer')}</Table.Td>
                                <Table.Td><Code color={"#EBF1F4"} c="black">Double Click</Code></Table.Td>
                            </Table.Tr>
                            <Table.Tr>
                                <Table.Td>{translate('Close Inline Task Popups')}</Table.Td>
                                <Table.Td><Code color={"#EBF1F4"} c="black">Press Esc</Code></Table.Td>
                            </Table.Tr>
                            <Table.Tr>
                                <Table.Td>{translate('Close Task Details Drawer')}</Table.Td>
                                <Table.Td><Code color={"#EBF1F4"} c="black">Press Esc</Code></Table.Td>
                            </Table.Tr>
                            <Table.Tr>
                                <Table.Td>{translate('Create New Task')}</Table.Td>
                                <Table.Td><Code color={"#EBF1F4"} c="black">Option(⌥)/Alt + N</Code></Table.Td>
                            </Table.Tr>
                            <Table.Tr>
                                <Table.Td>{translate('Focus Task Search Field')}</Table.Td>
                                <Table.Td><Code color={"#EBF1F4"} c="black">Option(⌥)/Alt + F</Code></Table.Td>
                            </Table.Tr>
                            <Table.Tr>
                                <Table.Td>{translate('Open Project Dropdown')}</Table.Td>
                                <Table.Td><Code color={"#EBF1F4"} c="black">Option(⌥)/Alt + P</Code></Table.Td>
                            </Table.Tr>
                            <Table.Tr>
                                <Table.Td>{translate('Go to Dashboard')}</Table.Td>
                                <Table.Td><Code color={"#EBF1F4"} c="black">Option(⌥)/Alt + D</Code></Table.Td>
                            </Table.Tr>
                            <Table.Tr>
                                <Table.Td>{translate('Go to My Tasks')}</Table.Td>
                                <Table.Td><Code color={"#EBF1F4"} c="black">Option(⌥)/Alt + T</Code></Table.Td>
                            </Table.Tr>
                            <Table.Tr>
                                <Table.Td>{translate('Switch Views (List → Board → Calendar → Gantt)')}</Table.Td>
                                <Table.Td><Code color={"#EBF1F4"} c="black">Option(⌥)/Alt + K</Code></Table.Td>
                            </Table.Tr>
                            <Table.Tr>
                                <Table.Td>{translate('Open Notifications')}</Table.Td>
                                <Table.Td><Code color={"#EBF1F4"} c="black">Option(⌥)/Alt + Shift + N</Code></Table.Td>
                            </Table.Tr>
                        </Table.Tbody>
                    </Table>

                </Card>
            </Popover.Dropdown>
        </Popover>
    );

}
export default ShortcutPopover;