import React, { Fragment, useEffect } from 'react';
import { Grid, LoadingOverlay, ScrollArea, Text, Overlay, Box, Badge } from "@mantine/core";
import { useSelector, useDispatch } from "react-redux";
import { fetchSettings } from "../../Settings/store/settingSlice";
import { fetchTasksByMember } from '../../Settings/store/taskSlice';
import { translate } from '../../../utils/i18n';
import { IconArchive } from '@tabler/icons-react';
import TaskListByMember from './TasksElements/GroupByPriority/TaskListByMember';

const ProjectDetailsListByMember = (props) => {
    const dispatch = useDispatch();
    const { isLoading, loadedMember, projectInfo, boardMembers } = useSelector((state) => state.settings.task);
    const { serialSettings } = useSelector((state) => state.settings.setting);
    const { loggedUserId } = useSelector((state) => state.auth.user);
    const { loggedInUser } = useSelector((state) => state.auth.session);
    const userId = loggedInUser ? loggedInUser.loggedUserId : loggedUserId;

    useEffect(() => {
        if (!serialSettings) {
            dispatch(fetchSettings());
        }
    }, [dispatch, serialSettings]);

    useEffect(() => {
        if (boardMembers && boardMembers.length > 0 && projectInfo?.id) {
            boardMembers.forEach((member) => {
                const isAlreadyLoaded = !!loadedMember?.[member.id];
                if (!isAlreadyLoaded) {
                    dispatch(fetchTasksByMember({
                        projectId: projectInfo.id,
                        memberId: member.id,
                        limit: 15,
                        offset: 0,
                        append: true,
                        userId: userId
                    }));
                }
            });
            // Fetch tasks that have no priority assigned
            const isNoAssignLoaded = !!loadedMember?.['no-assigned'];
            if (!isNoAssignLoaded) {
                dispatch(fetchTasksByMember({
                    projectId: projectInfo.id,
                    memberId: null,
                    limit: 15,
                    offset: 0,
                    append: true,
                    userId: userId,
                }));
            }
        }
    }, [boardMembers, projectInfo?.id]);

    return (
        <Fragment>
            <div className="border rounded-t-lg px-2 py-1.5 bg-[#39758D] !pl-[25px]">

                <Grid gutter="0" columns={24}>
                    <Grid.Col span={22}>
                        <Grid columns={24}>
                            {serialSettings && serialSettings.enabled && (
                                <Grid.Col span={1.5}>
                                    <Text c={`#ffffff`} className={`!pl-[20px]`} fz="md" fw={700}>{translate('Ref.#')}</Text>
                                </Grid.Col>
                            )}
                            <Grid.Col span={7}>
                                <Text c={`#ffffff`} className={serialSettings && serialSettings.enabled ? '!pl-[0px]' : '!pl-[30px]'} fz="md" fw={700}>{translate('Task Title')}</Text>
                            </Grid.Col>
                            <Grid.Col span={2.5}>
                                <Text c={`#ffffff`} className={`!pl-[0px]`} fz="md" fw={700}>{translate('Assigned')}</Text>
                            </Grid.Col>
                            <Grid.Col span={0.3}></Grid.Col>
                            <Grid.Col span={2.5}>
                                <Text c={`#ffffff`} ta="center" fz="md" fw={700}>{translate('Following')}</Text>
                            </Grid.Col>
                            <Grid.Col span={2}>
                                <Text c={`#ffffff`} ta="center" fz="md" fw={700}>{translate('Due Date')}</Text>
                            </Grid.Col>
                            <Grid.Col span={2}>
                                <Text c={`#ffffff`} ta="center" fz="md" fw={700}>{translate('Priority')}</Text>
                            </Grid.Col>
                            <Grid.Col span={2}>
                                <Text c={`#ffffff`} ta="center" fz="md" fw={700}>{translate('Status')}</Text>
                            </Grid.Col>
                            {serialSettings && serialSettings.enabled ? (
                                <Grid.Col span={4} className="!pl-10">
                                    <Text c={`#ffffff`} fz="md" fw={700}>{translate('Tags')}</Text>
                                </Grid.Col>
                            ) : (
                                <Grid.Col span={5.5} className="!pl-10">
                                    <Text c={`#ffffff`} fz="md" fw={700}>{translate('Tags')}</Text>
                                </Grid.Col>
                            )}
                        </Grid>

                    </Grid.Col>
                </Grid>

            </div>
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
                <ScrollArea scrollbars={`y`} scrollbarSize={4}
                    className={`${appLocalizer?.is_admin ? 'h-[calc(100vh-330px)]' : 'h-[calc(100vh-283px)]'} pb-[1px] !pr-1`}
                >
                    <LoadingOverlay
                        visible={isLoading}
                        zIndex={1000}
                        overlayProps={{ radius: 'sm', blur: 4 }}
                    />
                    <div className="relative w-full">
                        <TaskListByMember />
                    </div>
                </ScrollArea>
            </Box>
        </Fragment>
    );
}

export default ProjectDetailsListByMember;
