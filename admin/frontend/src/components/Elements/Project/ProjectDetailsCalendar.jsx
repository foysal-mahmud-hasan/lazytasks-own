import React from 'react';
import { Badge, Box, Flex, LoadingOverlay, Overlay, ScrollArea } from "@mantine/core";
import TaskCalendar from "./TasksElements/TaskCalendar";
import { useSelector } from "react-redux";
import { IconArchive } from '@tabler/icons-react';
import { translate } from '../../../utils/i18n';

const ProjectDetailsCalendar = () => {
    const { isLoading, projectInfo } = useSelector((state) => state.settings.task);

    return (
        <Box style={{ position: 'relative' }}>
            {projectInfo && projectInfo?.status_name === 'archived' && (
                <>
                    <Overlay
                        blur={2}
                        opacity={0.7}
                        color="#fff"
                        zIndex={20}
                    />
                    <Box
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            zIndex: 25, // Ensure it is above the overlay
                            textAlign: 'center',
                        }}
                    >
                        <Badge size="lg" leftSection={<IconArchive stroke={1.25} />} color="orange">{translate('This project is archived')}</Badge>
                    </Box>
                </>
            )}
            <ScrollArea scrollbarSize={4} offsetScrollbars
                className={`${appLocalizer?.is_admin ? 'h-[calc(100vh-292px)]' : 'h-[calc(100vh-245px)]'} pb-[2px]`}
            >
                <LoadingOverlay
                    visible={isLoading}
                    zIndex={1000}
                    overlayProps={{ radius: 'sm', blur: 4 }}
                />
                <Flex justify="center" align="center" className="w-full h-full">
                    <div className="relative items-center w-full pt-2">
                        <TaskCalendar />
                    </div>
                </Flex>
            </ScrollArea>
        </Box>
    );
};

export default ProjectDetailsCalendar;
