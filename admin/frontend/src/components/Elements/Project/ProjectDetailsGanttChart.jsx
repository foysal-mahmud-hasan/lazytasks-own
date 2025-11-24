import React, { Fragment } from 'react';
import { Badge, Box, LoadingOverlay, Overlay } from "@mantine/core";
import { useSelector } from "react-redux";

import TaskGanttChart from "./TasksElements/TaskGanttChart";
import { IconArchive } from '@tabler/icons-react';
import { translate } from '../../../utils/i18n';

const ProjectDetailsGanttChart = () => {
    const { isLoading, projectInfo } = useSelector((state) => state.settings.task);

    return (
        <Fragment>
            <Box pos={`relative`} className={`${appLocalizer?.is_admin ? 'h-[calc(100vh-292px)]' : 'h-[calc(100vh-245px)]'} pb-[2px]`}>
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
                <LoadingOverlay
                    visible={isLoading}
                    zIndex={1000}
                    overlayProps={{ radius: 'sm', blur: 4 }}
                />
                <TaskGanttChart />
            </Box>
        </Fragment>
    );
}

export default ProjectDetailsGanttChart;
