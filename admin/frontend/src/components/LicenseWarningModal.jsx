import React, { Fragment, useEffect, useState } from 'react';
import {
    Modal,
    Text,
    Button,
    Anchor,
    Group,
    Stack,
    ThemeIcon,
    UnstyledButton,
} from '@mantine/core';
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from 'react-router-dom';
import { updateLicenseModalStatus } from "./Settings/store/settingSlice";
import { translate } from "../utils/i18n";
import { IconExclamationCircle, IconRocket } from '@tabler/icons-react';

const LicenseWarningModal = () => {

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loggedUserId } = useSelector((state) => state.auth.user)
    const { loggedInUser } = useSelector((state) => state.auth.session);

    const [opened, setOpened] = useState(false);

    useEffect(() => {
        const timeout = setTimeout(async () => {
            if (
                window.lazytaskPremium &&
                appLocalizer &&
                appLocalizer.licenseStatus !== '1'
            ) {
                try {
                    const result = await dispatch(
                        updateLicenseModalStatus(
                            loggedInUser ? loggedInUser.loggedUserId : loggedUserId
                        )
                    ).unwrap();

                    if (result?.already_shown === false) {
                        setOpened(true);
                    }
                } catch (error) {
                    console.error('Modal check failed:', error);
                }
            }
        }, 1000);

        return () => clearTimeout(timeout);
    }, [loggedInUser]);

    useEffect(() => {
        if (opened) {
            window.isLicenseModalOpen = true;
        } else {
            if (window.isLicenseModalOpen) {
                window.isLicenseModalOpen = false;
                // Dispatch event so others can listen
                window.dispatchEvent(new Event('licenseModalClosed'));
            }
        }
    }, [opened]);

    const settingPagePath = '/license';
    const gotoLicense = () => {
        setOpened(false);
        navigate(settingPagePath);
    }

    return (
        <Fragment>
            <Modal
                opened={opened}
                onClose={() => setOpened(false)}
                title={
                    <Group spacing="xs">
                        <ThemeIcon color="orange" radius="xl" size="lg" variant="light">
                            <IconExclamationCircle size={24} />
                        </ThemeIcon>
                        <Text size="md" weight={500}>
                            {translate('License Warning')}
                        </Text>
                    </Group>
                }
                size="lg"
                centered
                trapFocus={false}
            >
                <Stack spacing="md">
                    <Text size="md">
                        Howdy! It looks like you've got the <strong>LazyTasks premium mobile plugin</strong> installed, but your license key seems to be missing or isn’t valid.
                    </Text>

                    <Group justify="center">
                        <Button
                            onClick={gotoLicense}
                            size="sm"
                            color={"#39758D"}
                            styles={{
                                label: {
                                    color: "#fff"
                                }
                            }}
                        >
                            Click here to input your license key
                        </Button>
                    </Group>

                    <Text size="md">
                        Don’t have a license key yet? No worries — head over to our{' '}
                        <Anchor
                            href="https://lazycoders.co/lazytasks"
                            target="_blank"
                            c="orange"
                            underline="always"
                        >
                            website
                        </Anchor>{' '}
                        to purchase one.
                    </Text>

                    <Text size="md">
                        If you've already purchased but lost or forgotten your key, simply log in to our customer portal on the{' '}
                        <Anchor
                            href="https://lazycoders.co"
                            target="_blank"
                            c="orange"
                            underline="always"
                        >
                            website
                        </Anchor>{' '}
                        to retrieve it.
                    </Text>

                    <Group justify="center" spacing="xs">
                        <Text size='md' fw={700}>Happy tasking on the go! </Text>
                        <ThemeIcon color="orange" radius="xl" size="lg" variant="light">
                            <IconRocket size={24} />
                        </ThemeIcon>
                    </Group>
                </Stack>
            </Modal>
        </Fragment>

    );
}

export default LicenseWarningModal;
