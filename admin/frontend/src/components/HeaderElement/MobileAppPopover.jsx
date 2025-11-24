import {
    Modal,
    Anchor,
    Text,
    Flex,
    List,
    Title,
    Button,
    Image,
    Grid,
    Box,
    Card,
    Stack,
    ActionIcon,
} from '@mantine/core';
import {
    IconBrandWhatsapp,
    IconCircleCheckFilled, IconInfoCircle,
    IconMessages,
    IconPencilStar,
    IconX
} from '@tabler/icons-react';
import React, { useState, useEffect, Fragment } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fatchLazytasksConfig } from "../Settings/store/settingSlice";
import androidQR from '../../assets/android.png';
import iosQR from '../../assets/ios.png';
import appleStoreIcon from '../../assets/app-store-icon.png';
import googlePlayIcon from '../../assets/google-play-icon.png';
import lazytasksPriceSection from '../../assets/lazytasks-purchase-section-bg.webp';
import lazytasksGuideLineBefore from '../../assets/lazytasks-guide-line-before-license.webp';
import lazytasksGuideLineThreeStep from '../../assets/lazytasks-guide-line-3step.webp';
import { translate } from "../../utils/i18n";
import { useDisclosure } from "@mantine/hooks";
import { FeedbackForm } from "./FeedbackForm";
import { AboutModal } from "./AboutModal";
import FluentFormIframe from "./FluentFormIframe";

export function MobileAppPopover() {
    const [opened, setOpened] = useState(false);
    const dispatch = useDispatch();
    const { lazytasksConfig } = useSelector((state) => state.settings.setting);
    const [config, setConfig] = useState(lazytasksConfig);
    const [activeSection, setActiveSection] = useState('demo_app');
    const { loggedInUser } = useSelector((state) => state.auth.session)
    const [feedbackModalOpened, { open: feedbackModalOpen, close: feedbackModalClose }] = useDisclosure(false);
    const [aboutModalOpened, { open: aboutModalOpen, close: aboutModalClose }] = useDisclosure(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                await dispatch(fatchLazytasksConfig()).then((response) => {
                    if (response.payload.status === 200) {
                        setConfig(response.payload.data)
                    }
                });
            } catch (err) {
                console.error("Unexpected error:", err);
            }
        };
        fetchData();
    }, [dispatch]);

    const hasRoleAdministrator = loggedInUser && loggedInUser.llc_roles && loggedInUser.llc_roles.length > 0 && loggedInUser.llc_roles.some(role => role.slug.toLowerCase() === "superadmin");
    const remainingDays = appLocalizer.remainingDays || 0;

    return (
        <>
            <Button
                size="md"
                className="font-semibold"
                onClick={() => setOpened(true)}
                variant="filled"
                color="#39758D"
                h={34}
            >
                {translate('Mobile App')}
            </Button>

            <Modal opened={opened} onClose={() => setOpened(false)} size="1180px" centered withCloseButton={false} zIndex={10000}>
                <Flex align={"flex-end"} justify={"right"} mt={-10} >
                    <ActionIcon variant='transparent' onClick={() => setOpened(false)} color="black">
                        <IconX style={{ height: "70%", width: "70%" }} stroke={1.5} />
                    </ActionIcon>
                </Flex>
                <Grid>
                    {appLocalizer.premiumInstalled === '' && window.appLocalizerPremium === undefined &&
                        <Title className={`text-center w-full`} order={4} >{translate('How to download and connect “LazyTasks” mobile app with installed plugin')}</Title>
                    }

                    {hasRoleAdministrator && remainingDays >= 10 && appLocalizer.licenseStatus === '' && appLocalizer.premiumInstalled !== '' && window.appLocalizerPremium &&
                        <Grid.Col span={12} mb={0}>
                            <Card radius="md" bg="#F5F8F9" className="relative">
                                <Image
                                    radius="md"
                                    src={lazytasksPriceSection}
                                />
                                <Box className="absolute top-0 left-0 w-full h-full flex flex-col md:flex-row justify-between items-center md:p-8">

                                    <Box className="md:w-1/2 flex justify-center">

                                    </Box>
                                    <Box className="md:w-1/2 text-center md:text-left md:mb-0">
                                        <Title order={3} c="#000" className="font-bold mb-2">
                                            {translate('Your trial is about to expire.')}
                                        </Title>
                                        <Text c="#000" className="mb-4">
                                            {translate('Upgrade your experience with the Lazytasks mobile App and get even more out of your Tasks Management!')}
                                        </Text>
                                        <Anchor href="https://lazycoders.co/lazytasks/" target="_blank" underline='never'>
                                            <Button
                                                variant="gradient"
                                                bg={`#ED7D31`}
                                                // gradient={{ from: '#ED7D31', to: 'yellow', deg: 45 }}
                                                size="sm"
                                                px="xl"
                                                mt={`sm`}
                                            // style={{height: '48px'}}
                                            >
                                                {translate('Purchase Now')}
                                            </Button>
                                        </Anchor>
                                    </Box>
                                </Box>

                            </Card>
                        </Grid.Col>
                    }
                    {appLocalizer.premiumInstalled !== '' && window.appLocalizerPremium &&
                        <Title className={`text-center w-full`} order={4} >How to connect “LazyTasks” mobile app with installed plugin</Title>
                    }
                    {appLocalizer.premiumInstalled !== '' && window.appLocalizerPremium &&
                        <Grid.Col span={12} mb="sm">
                            <Card radius="md" bg="#F5F8F9">
                                <Image
                                    radius="md"
                                    src={lazytasksGuideLineThreeStep}
                                />
                            </Card>
                        </Grid.Col>
                    }

                    {appLocalizer.premiumInstalled === '' && window.appLocalizerPremium === undefined &&
                        <Grid.Col span={12} mb="sm">
                            <Card radius="md" bg="#F5F8F9">
                                <Image
                                    radius="md"
                                    src={lazytasksGuideLineBefore}
                                />
                            </Card>
                        </Grid.Col>
                    }
                    {appLocalizer.premiumInstalled === '' && window.appLocalizerPremium === undefined &&
                        <>
                            <Grid.Col span={4} mb="sm">
                                <Card flex={1} radius="md" bg="#F5F8F9" className="flex flex-col justify-center items-center !p-4 h-full">

                                    <Stack spacing="md" align="center">
                                        <Title order={5} ta="center">
                                            📱 {translate('Go Premium. Go Mobile.')}
                                        </Title>

                                        <Text size="sm" ta="center">
                                            {translate('Upgrade now to use the iOS & Android apps fully, get real-time task updates, and organize projects more effectively across your team on-the-go.')}
                                        </Text>

                                        <Text size="sm" ta="center" fw={700}>
                                            {translate('Visit us at')} {' '}
                                            <Anchor href="https://lazycoders.co" target="_blank" underline="always" c="blue.7">
                                                www.lazycoders.co
                                            </Anchor>
                                        </Text>
                                        <Anchor href="https://lazycoders.co/lazytasks/?product_name=lazy_task&plugin_slug=lazytasks-premium#buy-now" target="_blank" underline='never'>
                                            <Button
                                                variant="gradient"
                                                gradient={{ from: '#ED7D31', to: 'yellow', deg: 45 }}
                                                size="sm"
                                                mt="sm"
                                                px="xl"
                                                style={{ height: '42px' }}
                                            >
                                                {translate('Activate Premium Access')}
                                            </Button>
                                        </Anchor>
                                    </Stack>
                                </Card>
                            </Grid.Col>
                            <Grid.Col span={4} mb="sm">
                                {hasRoleAdministrator ? (
                                    <Card flex={1} radius="md" bg="#F5F8F9"
                                        className="flex flex-col justify-center items-center p-4 h-full">
                                        <Text size="md" fw={500} mb={`2px`} c="#000">
                                            {translate('Welcome to LazyTasks Premium')}
                                        </Text>
                                        <Text size="md" fw={700} mb={`5px`} c="#000">
                                            {translate('Activate Your Free Trial!')}
                                        </Text>
                                        <Box className="w-full">
                                            <FluentFormIframe />
                                        </Box>
                                    </Card>
                                ) : (
                                    <Card flex={1} radius="md" bg="#F5F8F9"
                                        className="flex flex-col justify-center items-center p-4 h-full">
                                        <Title mb={`md`} ta={'center'} order={4}>
                                            📱 {translate('Power Up Your Productivity Through LazyTasks Mobile')}
                                        </Title>
                                        <List
                                            spacing="xs"
                                            size="sm"
                                            center
                                            icon={
                                                <IconCircleCheckFilled color={`#269D77FF`} size={32} />
                                            }
                                        >
                                            <List.Item>Manage projects and tasks anywhere from your phone.</List.Item>
                                            <List.Item>Your projects, always in your pocket.</List.Item>
                                            <List.Item>Stay productive on the go with full project access.</List.Item>
                                            <List.Item>Collaborate instantly with assigning, comments, and notifications.</List.Item>
                                            <List.Item>Plan tasks visually and never miss a deadline.</List.Item>
                                        </List>
                                    </Card>
                                )

                                }
                            </Grid.Col>
                            <Grid.Col span={4} mb="sm">
                                <Card radius="md" bg="#F5F8F9"
                                    className="flex flex-row justify-center items-center gap-5 p-4 h-full">

                                    <Anchor className={`w-full`} href="https://wordpress.org/support/plugin/lazytasks-project-task-management/reviews/#new-post"
                                        target="_blank"
                                        underline='never'>
                                        <Button
                                            leftSection={
                                                <IconPencilStar size={24} />
                                            }
                                            variant="filled"
                                            bg={`#ED7D31`}
                                            size="md"
                                            px="sm"
                                            mb={`sm`}
                                            radius={`md`}
                                            style={{
                                                width: '100%',
                                                boxShadow: "0 2px 8px rgba(60, 60, 130, 0.12)",
                                                overflow: "hidden",
                                                cursor: "pointer",
                                            }}
                                        // style={{height: '48px'}}
                                        >
                                            {translate('Write a Review')}
                                        </Button>
                                    </Anchor>

                                    <Button
                                        onClick={feedbackModalOpen}
                                        leftSection={<IconMessages size={24} />}
                                        variant="filled"
                                        bg={`#162C35`}
                                        size="md"
                                        px="sm"
                                        mb={`sm`}
                                        radius={`md`}
                                        style={{
                                            width: '100%',
                                            boxShadow: "0 2px 8px rgba(60, 60, 130, 0.12)",
                                            overflow: "hidden",
                                            cursor: "pointer",
                                        }}
                                    // style={{height: '48px'}}
                                    >
                                        {translate('Feedback')}
                                    </Button>

                                    {hasRoleAdministrator &&
                                        <Anchor className={`w-full`} href="https://wa.me/+16478484547" target="_blank">
                                            <Button
                                                color="#39758D"
                                                radius="md"
                                                size="md"
                                                variant="filled"
                                                px="sm"
                                                mb={`sm`}
                                                leftSection={<IconBrandWhatsapp size={24} />}
                                                style={{
                                                    width: '100%',
                                                    boxShadow: "0 2px 8px rgba(60, 60, 130, 0.12)",
                                                    overflow: "hidden",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                {translate('Connect with Founder')}
                                            </Button>
                                        </Anchor>
                                    }

                                    <Button
                                        leftSection={
                                            <IconInfoCircle size={24} />
                                        }
                                        onClick={aboutModalOpen}
                                        variant="gradient"
                                        gradient={{ from: '#ED7D31', to: 'yellow', deg: 45 }}
                                        size="md"
                                        px="sm"
                                        mb={`sm`}
                                        radius={`md`}
                                        style={{
                                            width: '100%',
                                            boxShadow: "0 2px 8px rgba(60, 60, 130, 0.12)",
                                            overflow: "hidden",
                                            cursor: "pointer",
                                        }}
                                    >
                                        {translate('About')}
                                    </Button>

                                </Card>
                            </Grid.Col>

                            {feedbackModalOpened &&
                                <FeedbackForm feedbackModalOpen={feedbackModalOpened} setFeedbackModalOpen={feedbackModalClose} />
                            }
                            {aboutModalOpened &&
                                <AboutModal aboutModalOpen={aboutModalOpened} setAboutModalOpen={aboutModalClose} />
                            }
                        </>
                    }


                    {appLocalizer.premiumInstalled !== '' && window.appLocalizerPremium &&
                        <>
                            <Grid.Col span={7} mb="sm">
                                <Grid>
                                    <Grid.Col span={12}>
                                        <Card radius="md" bg="#F5F8F9"
                                            className="flex justify-center items-center p-4 w-full">
                                            <Grid className={`w-full`}>
                                                <Grid.Col span={12} pb={0}>
                                                    <Box className={`rounded-md`} bg="#fff" p={`sm`}>
                                                        <Text size="md" fw={700} mb={0} c="#000" ta="center">
                                                            <pill style={{
                                                                padding: '3px 8px 3px 15px',
                                                                backgroundColor: '#ED7D31',
                                                                borderRadius: '25px',
                                                                color: '#fff',
                                                                marginRight: '10px'
                                                            }}>Step-1: </pill> {translate('Download LazyTasks Mobile App')}
                                                        </Text>
                                                    </Box>
                                                </Grid.Col>
                                                <Grid.Col span={6} style={{ display: 'flex', justifyContent: 'center' }}>
                                                    <Anchor href="https://play.google.com/store/apps/details?id=com.lazytasks.lazycoders" target="_blank">
                                                        <Stack align="center" w="100%" bg="#fff" p="md" radius="lg" h={250}>
                                                            <Image
                                                                radius="sm"
                                                                h={180}
                                                                w={180}
                                                                fit="contain"
                                                                src={androidQR}
                                                            />
                                                            <Image
                                                                radius="sm"
                                                                h={32}
                                                                w="auto"
                                                                src={googlePlayIcon}
                                                            />
                                                        </Stack>
                                                    </Anchor>
                                                </Grid.Col>
                                                <Grid.Col span={6} style={{ display: 'flex', justifyContent: 'center' }}>
                                                    <Anchor href="https://apps.apple.com/us/app/lazytasks/id6499516984" target="_blank">
                                                        <Stack align="center" w="100%" bg="#fff" p="md" radius="md" h={250}>
                                                            <Image
                                                                radius="sm"
                                                                h={180}
                                                                w={180}
                                                                fit="contain"
                                                                src={iosQR}
                                                            />
                                                            <Image
                                                                radius="sm"
                                                                h={32}
                                                                w="auto"
                                                                src={appleStoreIcon}
                                                            />
                                                        </Stack>
                                                    </Anchor>
                                                </Grid.Col>
                                            </Grid>

                                        </Card>
                                    </Grid.Col>

                                </Grid>
                            </Grid.Col>

                            <Grid.Col span={5} mb="sm">

                                <Card radius="md" bg="#F5F8F9"
                                    className="flex flex-col justify-center items-end p-4">
                                    <Grid>
                                        <Grid.Col span={12} pb={0}>
                                            <Box className={`rounded-md`} bg="#fff" p={`sm`}>
                                                <Text size="md" fw={700} mb={0} c="#000" ta="center">
                                                    <pill style={{
                                                        padding: '3px 8px 3px 15px',
                                                        backgroundColor: '#ED7D31',
                                                        borderRadius: '25px',
                                                        color: '#fff',
                                                        marginRight: '10px'
                                                    }}>Step-2: </pill> {translate('Connect Your LazyTasks Mobile App')}
                                                </Text>
                                            </Box>
                                        </Grid.Col>
                                        <Grid.Col span={12}>
                                            <Stack justify="start" align="center" w="100%" bg="#fff" p="md" radius="lg" h={250}>
                                                <Image
                                                    radius="sm"
                                                    h={200}
                                                    w={200}
                                                    fit="contain"
                                                    src={lazytasksConfig && lazytasksConfig.qrCode}
                                                    style={{ marginTop: '-15px' }}
                                                />
                                            </Stack>
                                        </Grid.Col>
                                    </Grid>


                                </Card>
                            </Grid.Col>
                        </>
                    }

                </Grid>
            </Modal>
        </>
    );
}