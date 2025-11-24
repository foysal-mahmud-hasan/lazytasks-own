import React, { Fragment, useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { editTask, fetchTasksByProject, removeSuccessMessage, closeTaskEditDrawer } from "../../../../Settings/store/taskSlice";
import { fetchProjectTaskSections } from "../../../../Settings/store/projectSlice";
import { Button, Text, List, Popover, useMantineTheme, ScrollArea, Flex } from '@mantine/core';
import { IconChevronDown, IconPlus, IconTrash, IconDotsVertical, IconArchiveFilled, IconArrowsMove, IconCircleCheck } from "@tabler/icons-react";
import { modals } from "@mantine/modals";
import { hasPermission } from "../../../../ui/permissions";
import { showNotification, updateNotification } from "@mantine/notifications";
import { translate } from '../../../../../utils/i18n';
const ChangeTaskSection = ({ task, taskId, isDrawer }) => {

    const theme = useMantineTheme();
    const dispatch = useDispatch();
    const { loggedUserId } = useSelector((state) => state.auth.user);
    const { loggedInUser } = useSelector((state) => state.auth.session);

    const [opened, setOpened] = useState(false);

    const { projectSections } = useSelector((state) => state.settings.project);

    const availableSections = projectSections && projectSections.length > 0 ? projectSections.filter(section =>
        section.id !== task.task_section_id
    ) : [];

    useEffect(() => {
        dispatch(fetchProjectTaskSections(task.project_id));
    }, [dispatch]);

    const handleSectionClick = (sectionId) => {
        setOpened(false);
        showNotification({
            id: 'load-data',
            loading: true,
            title: 'Task',
            message: "Changing Section ...",
            disallowClose: true,
            color: 'green',
            styles: () => ({
                root: {
                    zIndex: 3000,
                },
            }),
        });
        dispatch(editTask({
            id: taskId,
            data: {
                task_section_id: sectionId,
                updated_by: loggedInUser ? loggedInUser.loggedUserId : loggedUserId,
            }
        }))
            .then((response) => {
                console.log(response.payload);
                if (response.payload && response.payload.status && response.payload.status === 200) {
                    if (isDrawer) {
                        dispatch(closeTaskEditDrawer())
                    }
                    updateNotification({
                        id: 'load-data',
                        loading: true,
                        title: 'Task',
                        message: response.payload && response.payload.message && response.payload.message,
                        autoClose: 2000,
                        disallowClose: true,
                        color: 'green',
                    });
                    dispatch(fetchTasksByProject({ id: task.project_id }));
                } else {
                    updateNotification({
                        id: 'load-data',
                        loading: false,
                        title: 'Task',
                        message: response.payload && response.payload.message && response.payload.message,
                        autoClose: 2000,
                        disallowClose: true,
                        color: 'red',
                    });
                }
            })
            .catch((error) => {
                console.error('Error completing task:', error);
                alert('Failed to complete task.');
            });
    };

    return (
        <div
            onClick={(e) => e.stopPropagation()}
            role="button"
            className="cursor-pointer"
        >
            <Flex
                align="center"
                gap="sm"
            >
                <IconArrowsMove
                    size={20}
                    stroke={1.50}
                    color="#4d4d4d"
                />
                <Popover
                    opened={opened}
                    onChange={setOpened}
                    position="right"
                    width={200}
                    shadow="md"
                    withArrow
                    trapFocus={false}
                    closeOnClickOutside={true}
                >
                    <Popover.Target>
                        <Text
                            size="sm"
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                setOpened((o) => !o);
                            }}
                        >
                            {translate('Change Section')}
                        </Text>
                    </Popover.Target>

                    <Popover.Dropdown onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <ScrollArea
                            className={availableSections?.length > 5 ? "h-[200px]" : ""}
                            scrollbarSize={2}
                        >
                            <List spacing="xs" size="sm">
                                {availableSections && availableSections.length > 0 && availableSections.map((section) => (
                                    <List.Item
                                        key={section.id}
                                        className="cursor-pointer hover:bg-gray-100 py-1 px-2 rounded transition-colors"
                                        onClick={() => handleSectionClick(section.id)}
                                    >
                                        <Text size='sm'>{section.name}</Text>
                                    </List.Item>
                                ))}
                            </List>
                        </ScrollArea>
                    </Popover.Dropdown>
                </Popover>
            </Flex>
        </div>
    );
};

export default ChangeTaskSection;
