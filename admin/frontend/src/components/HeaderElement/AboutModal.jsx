import { Modal, Anchor, Text, Box, Group, Divider, ThemeIcon, Space } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import { translate } from '../../utils/i18n';

export function AboutModal({ aboutModalOpen, setAboutModalOpen }) {
    
    const { lazytasksConfig } = useSelector((state) => state.settings.setting);

    return (
        <>
            <Modal opened={aboutModalOpen} onClose={() => setAboutModalOpen(false)} centered zIndex={10000}
                title={
                    <Group spacing="xs">
                        <ThemeIcon color="orange" size={36} radius="xl" variant="light">
                            <IconInfoCircle size={24} />
                        </ThemeIcon>
                        <Text fw={600}>{translate('About LazyTasks')}</Text>
                    </Group>
                }
                radius="lg"
                size="lg"
                overlayProps={{ blur: 2 }}
            >
                <Divider size="xs" my={0} className='!-ml-4 w-[calc(100%+2rem)]' />
                <Box mx="auto" p="md">
                    <Text size="md" mb={4}>{translate('Version')}: {lazytasksConfig && lazytasksConfig.lazytasks_version}</Text>
                    <Text size="md" mb={4}>{translate('Developed by')}: LazyCoders Inc.</Text>
                    <Text size="md" mb={4}>
                        {translate('Website')}: <Anchor href="https://www.lazycoders.co" target="_blank" c='orange'>www.lazycoders.co</Anchor>
                    </Text>
                    <Text size="md" mb="md">
                        {translate('LazyTasks is brought to you by LazyCoders Inc., designed to streamline communication and project management. Combining ease of use with powerful features, we\'re committed to enhancing your collaborative experience.')}
                    </Text>
                    <Text size="md" mb={4}>
                        {translate('For support or feedback, please visit our website or contact us at')} <Space w="sm" />
                        <Anchor href="mailto:support@lazycoders.co" c='orange'>
                            support@lazycoders.co
                        </Anchor>.
                    </Text>
                    <Text size="md" c="dimmed" mt="md">
                        © {new Date().getFullYear()} LazyCoders Inc. All Rights Reserved.
                    </Text>

                </Box>
            </Modal>
        </>
    );
}