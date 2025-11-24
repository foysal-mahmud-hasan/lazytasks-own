import React, { useState, useRef } from 'react';
import { Image, Anchor, Box, Affix, ThemeIcon, Button, Group, Transition } from '@mantine/core';
import { IconBrandWhatsapp, IconHeadset, IconMessages } from '@tabler/icons-react';
import { FeedbackForm } from './HeaderElement/FeedbackForm';
import { useDisclosure } from '@mantine/hooks';
import { translate } from '../utils/i18n';
import { hasPermission } from './ui/permissions';
import { useSelector } from 'react-redux';

const FloatingActionButtons = () => {
    const { loggedInUser } = useSelector((state) => state.auth.session);
    const [whatsappHovered, setWhatsappHovered] = useState(false);
    const [supportHovered, setSupportHovered] = useState(false);
    const [feedbackHovered, setFeedbackHovered] = useState(false);
    const btnRef = useRef(null);
    const buttonWidth = 120;
    const visiblePeek = 10;
    const [feedbackModalOpened, { open: feedbackModalOpen, close: feedbackModalClose }] = useDisclosure(false);
    return hasPermission(loggedInUser && loggedInUser.llc_permissions, ['feedback-support']) ? (
        <>
            <Anchor href="https://wa.me/+16478484547" target="_blank">
                <Box
                    pos="fixed"
                    bottom="5%"
                    right={0}
                    style={{
                        zIndex: 2000,
                        transform: `translateX(${whatsappHovered ? '0%' : '80%'})`,
                        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                    onMouseEnter={() => setWhatsappHovered(true)}
                    onMouseLeave={() => setWhatsappHovered(false)}
                >
                    <Button
                        ref={btnRef}
                        color="#39758D"
                        radius="md"
                        size="md"
                        variant="filled"
                        px="sm"
                        leftSection={<IconBrandWhatsapp size={24} />}
                        style={{
                            boxShadow: "0 2px 8px rgba(60, 60, 130, 0.12)",
                            overflow: "hidden",
                            cursor: "pointer",
                        }}
                    >
                        {translate('Connect with Founder')}
                    </Button>
                </Box>
            </Anchor>
            <Anchor href="https://lazycoders.co/support" target="_blank">
                <Box
                    pos="fixed"
                    bottom="12%"
                    right={0}
                    style={{
                        zIndex: 2000,
                        transform: `translateX(${supportHovered ? '0%' : '76%'})`,
                        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                    onMouseEnter={() => setSupportHovered(true)}
                    onMouseLeave={() => setSupportHovered(false)}
                >
                    <Button
                        ref={btnRef}
                        color="#ED7D31"
                        radius="md"
                        size="md"
                        variant="filled"
                        px="sm"
                        leftSection={<IconHeadset size={24} />}
                        style={{
                            boxShadow: "0 2px 8px rgba(60, 60, 130, 0.12)",
                            overflow: "hidden",
                            cursor: "pointer",
                        }}
                    >
                        {translate('Premium Support')}
                    </Button>
                </Box>
            </Anchor>
            <Box
                pos="fixed"
                bottom="19%"
                right={0}
                style={{
                    zIndex: 2000,
                    transform: `translateX(${feedbackHovered ? '0%' : '67%'})`,
                    transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
                onMouseEnter={() => setFeedbackHovered(true)}
                onMouseLeave={() => setFeedbackHovered(false)}
            >
                <Button
                    onClick={feedbackModalOpen}
                    ref={btnRef}
                    color="#162C35"
                    radius="md"
                    size="md"
                    variant="filled"
                    px="sm"
                    leftSection={<IconMessages size={24} />}
                    style={{
                        boxShadow: "0 2px 8px rgba(60, 60, 130, 0.12)",
                        overflow: "hidden",
                        cursor: "pointer",
                    }}

                >
                    {translate('Feedback')}
                </Button>
            </Box>

            <FeedbackForm feedbackModalOpen={feedbackModalOpened} setFeedbackModalOpen={feedbackModalClose} />
        </>
    ) : null;
};

export default FloatingActionButtons;
