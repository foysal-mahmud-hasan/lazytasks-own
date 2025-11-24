import { Popover, Card, List, Code, Title, Text, Paper, Group, Flex, Button, Table, ActionIcon } from '@mantine/core';
import { IconInfoCircle, IconX } from '@tabler/icons-react';
import { useState } from 'react';
import { translate } from '../../../utils/i18n';

const TemplateInfo = () => {
    const [opened, setOpened] = useState(false);

    return (
        <Popover
            width={500}
            position="bottom-end"
            opened={opened}
            onChange={setOpened}
            withArrow
        >
            <Popover.Target>
                <ActionIcon variant="filled" color="#EBF1F4" size="lg" title="Template Informations" aria-label="Settings"
                    radius={"xl"} onClick={() => setOpened((o) => !o)}
                >
                    <IconInfoCircle size={22} stroke={1.75} color="#4D4D4D" />
                </ActionIcon>
            </Popover.Target>
            <Popover.Dropdown
                style={{
                    border: 'none',
                    backgroundColor: 'transparent',
                    padding: 0,
                }}
            >
                <Card padding="lg" withBorder radius="md" shadow='xl'>
                    <Card.Section withBorder inheritPadding py="xs" className="bg-[#FDFDFD] mb-2">
                        <Group justify='space-between' align='center'>
                            <Text fw={600} size='md'>{translate('Template Variables')}</Text>
                            <ActionIcon variant='subtle' onClick={() => setOpened(false)} color="gray">
                                <IconX style={{ height: "70%", width: "70%" }} stroke={1.5} />
                            </ActionIcon>
                        </Group>
                    </Card.Section>
                    
                    <Table variant="vertical" layout="fixed" withTableBorder>
                        <Table.Tbody>
                            <Table.Tr>
                                <Table.Th w={230}>{translate('NAME')}</Table.Th>
                                <Table.Td>{translate('User\'s Name')}</Table.Td>
                            </Table.Tr>

                            <Table.Tr>
                                <Table.Th>{translate('LOGIN_URL')}</Table.Th>
                                <Table.Td>{translate('The sign-in link for the app or workspace')}</Table.Td>
                            </Table.Tr>
                            
                            <Table.Tr>
                                <Table.Th>{translate('USERNAME')}</Table.Th>
                                <Table.Td>{translate('USERNAME (login credentials)')}</Table.Td>
                            </Table.Tr>

                            <Table.Tr>
                                <Table.Th>{translate('PASSWORD')}</Table.Th>
                                <Table.Td>{translate('PASSWORD (login credentials)')}</Table.Td>
                            </Table.Tr>

                            <Table.Tr>
                                <Table.Th>{translate('MEMBER_NAME')}</Table.Th>
                                <Table.Td>{translate('Member Name')}</Table.Td>
                            </Table.Tr>

                            <Table.Tr>
                                <Table.Th>{translate('COMPANY_NAME')}</Table.Th>
                                <Table.Td>{translate('Workspace Name')}</Table.Td>
                            </Table.Tr>
                            
                            <Table.Tr>
                                <Table.Th>{translate('PROJECT_NAME')}</Table.Th>
                                <Table.Td>{translate('Project Name')}</Table.Td>
                            </Table.Tr>
                            
                            <Table.Tr>
                                <Table.Th>{translate('CREATOR_NAME')}</Table.Th>
                                <Table.Td>{translate('Creator Name')}</Table.Td>
                            </Table.Tr>
                            
                            <Table.Tr>
                                <Table.Th>{translate('MEMBER_ROLES')}</Table.Th>
                                <Table.Td>{translate('Member Role')}</Table.Td>
                            </Table.Tr>
                            
                            <Table.Tr>
                                <Table.Th>{translate('TASK_NAME')}</Table.Th>
                                <Table.Td>{translate('Task Name')}</Table.Td>
                            </Table.Tr>
                            
                            <Table.Tr>
                                <Table.Th>{translate('PREVIOUS_ASSIGNED_DATE')}</Table.Th>
                                <Table.Td>{translate('Previous Assigned Date')}</Table.Td>
                            </Table.Tr>
                            
                            <Table.Tr>
                                <Table.Th>{translate('NEW_ASSIGNED_DATE')}</Table.Th>
                                <Table.Td>{translate('New Assigned Date')}</Table.Td>
                            </Table.Tr>
                        </Table.Tbody>
                    </Table>
                </Card>
            </Popover.Dropdown>
        </Popover>
    );

}
export default TemplateInfo;