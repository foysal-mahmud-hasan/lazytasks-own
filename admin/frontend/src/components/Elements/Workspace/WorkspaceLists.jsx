import React, { useEffect, useState } from 'react';
import { Accordion, ScrollArea, Card, Group, Text, Avatar, LoadingOverlay, Box } from '@mantine/core';
import UsersAvatarGroup from "../../ui/UsersAvatarGroup";
import { useSelector, useDispatch } from 'react-redux';
import { fetchAllCompanies } from "../../Settings/store/companySlice";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { translate } from '../../../utils/i18n';


const WorkspaceLists = ({ onClose }) => {

    const dispatch = useDispatch();
    const location = useLocation();
    const navigate = useNavigate()
    const { loggedInUser } = useSelector((state) => state.auth.session);
    const { companies } = useSelector((state) => state.settings.company);

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        dispatch(fetchAllCompanies())
            .then(() => {
                setIsLoading(false);
            })
            .catch(() => {
                setIsLoading(false);
            });
    }, [dispatch]);


    const id = useParams().id;

    const [projectId, setProjectId] = useState(id);

    const goToTasksList = (id) => {
        // dispatch(fetchTasksByProject({id:id}))
        navigate(`/project/task/list/${id}`)
        setProjectId(id)
        onClose();
    }
    return (
        <>
            {/*{hasPermission(loggedInUser && loggedInUser.llc_permissions, ['superadmin']) &&
        <Link to="/workspace">
            <button className="w-full border border-solid border-black text-black bg-white rounded-md p-1 mb-4 hover:bg-[#39758D] hover:text-white">
                Manage Workspace
            </button>
        </Link>
        // <WorkspaceModal />
    }*/}

            {/* <div className='border-t border-gray-300 pt-4'></div> */}

            <Box style={{ position: 'relative' }}>
                <LoadingOverlay visible={isLoading} overlayBlur={2} />

                <ScrollArea scrollbarSize={4} offsetScrollbars={true}
                    className={`w-full pr-1 ${appLocalizer?.is_admin ? 'h-[calc(100vh-125px)]' : 'h-[calc(100vh-125px)]'}`}
                >

                    {/* <CreateWorkspaceModal /> */}

                    {companies && companies.length > 0 ? (
                        <Accordion variant="separated" defaultValue={companies.find(company =>
                            company.projects?.some(project =>
                                location && (
                                    location.pathname === `/project/task/list/${project.id}` ||
                                    location.pathname === `/project/task/board/${project.id}` ||
                                    location.pathname === `/project/task/calendar/${project.id}`
                                )
                            )
                        )?.id?.toString() || ''} classNames={{
                            label: '!py-3 !font-semibold !text-sm',
                            item: '!mt-2 !border-solid !border !border-gray-300',
                            control: '!bg-white font-bold !rounded-md',
                            /* content: '!px-0',
                             label: '!py-0 !pt-1',
                             chevron: '!mx-0 !ml-1',*/
                            // chevron: classes.chevron
                        }}>
                            {companies && companies.length > 0 && companies.map((item) => (
                                <Accordion.Item key={item.id} value={item.id.toString()}>
                                    {/*chevron none*/}
                                    <Accordion.Control chevron={item.projects && item.projects.length === 0 && <span />}>
                                        <Text size="md" weight={900}>{item.name}</Text>
                                        <Group position="apart">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" fill="none">
                                                    <circle cx="4" cy="4" r="4" fill="#F1975A" />
                                                </svg>
                                                <Text size="xs">{translate('%d users engaged').replace('%d', item.members && item.members.length)}</Text>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" fill="none">
                                                    <circle cx="4" cy="4" r="4" fill="#39758D" />
                                                </svg>
                                                <Text size="xs">{translate('%d project').replace('%d', item.projects && item.projects.length)}</Text>
                                            </div>
                                        </Group>
                                    </Accordion.Control>
                                    {item.projects && item.projects.length > 0 &&
                                        <Accordion.Panel>

                                            {item.projects && item.projects.filter((project) => project.status == "1")
                                                .map((project, index) => (
                                                    <Card key={`${project.id}-${index}`} className='mb-2 mt-0' shadow="sm" radius="sm"
                                                        withBorder style={{ borderColor: '#39758d', cursor: 'pointer', backgroundColor: location && (location.pathname === '/project/task/list/' + project.id || location.pathname === '/project/task/board/' + project.id || location.pathname === '/project/task/calendar/' + project.id) ? '#F5F9FB' : 'white' }}
                                                        onClick={() => goToTasksList(project.id)}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '-7px' }}>
                                                            <Text size="sm" weight={700}>{project.name}</Text>
                                                            <Avatar.Group>
                                                                {/* <Avatar src="image.png" size={30}/> */}
                                                            </Avatar.Group>
                                                            <UsersAvatarGroup users={project.members} size={30} maxCount={2} />

                                                        </div>
                                                        <Group position="apart">
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" fill="none">
                                                                    <circle cx="4" cy="4" r="4" fill="#F1975A" />
                                                                </svg>
                                                                <Text size="xs">{translate('%d users engaged').replace('%d', project.members && project.members.length)}</Text>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" fill="none">
                                                                    <circle cx="4" cy="4" r="4" fill="#39758D" />
                                                                </svg>
                                                                <Text size="xs">{translate('%d task').replace('%d', project.total_tasks && project.total_tasks)}</Text>
                                                            </div>
                                                        </Group>
                                                    </Card>
                                                ))}

                                        </Accordion.Panel>
                                    }
                                </Accordion.Item>
                            ))}
                        </Accordion>
                    ) : (
                        <Text size="sm"> {translate('You haven\'t been assigned to a specific workspace or project yet.')} </Text>
                    )}
                </ScrollArea>

            </Box>

        </>
    );
};

export default WorkspaceLists;