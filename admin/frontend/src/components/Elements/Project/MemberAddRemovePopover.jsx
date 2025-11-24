import React, { Fragment, useEffect, useState, useMemo } from 'react';
import {
    ActionIcon,
    Avatar,
    Button,
    Grid,
    Popover,
    ScrollArea,
    Text, TextInput,
    Tooltip,
} from '@mantine/core';
import {
    IconPlus, IconSearch,
} from '@tabler/icons-react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from "react-redux";
import {
    updateBoardMembers,
    fetchTasksByProject,
    fetchProjectOverview,
} from "../../Settings/store/taskSlice";
import { hasPermission } from "../../ui/permissions";
import { editProject } from "../../Settings/store/projectSlice";
import { createUser, fetchAllMembers, fetchAllInvitedMember, openProfileDrawer, fetchUser, updateIsLoading } from "../../../store/auth/userSlice";
import UserAvatarSingle from "../../ui/UserAvatarSingle";
import UsersAvatarGroup from "../../ui/UsersAvatarGroup";
import { modals } from "@mantine/modals";
import { translate } from '../../../utils/i18n';
import MemberEditDrawer from '../../Profile/MemberEditDrawer';
import { fetchAllRoles } from '../../../store/auth/roleSlice';
import { showNotification } from '@mantine/notifications';
import { set } from 'date-fns';

const MemberAddRemovePopover = ({ isOpened, setIsOpened }) => {
    const dispatch = useDispatch();

    const { id } = useParams();
    const { loggedUserId } = useSelector((state) => state.auth.user);
    const { loggedInUser } = useSelector((state) => state.auth.session);
    const { tasks } = useSelector((state) => state.settings.task);
    const { allMembers } = useSelector((state) => state.auth.user);
    const { allInvitedMembers } = useSelector((state) => state.auth.user);
    const { boardMembers, projectInfo } = useSelector((state) => state.settings.task);
    const [selectedMembers, setSelectedMembers] = useState(boardMembers || []);
    const [hasFetchedMembers, setHasFetchedMembers] = useState(false);

    const [addedMembers, setAddedMembers] = useState(boardMembers && boardMembers.length > 0 ? boardMembers.map((member) => member.id) : []);
    const [assignLoadingId, setAssignLoadingId] = useState(null);
    const [removeLoadingId, setRemoveLoadingId] = useState(null);

    const [searchValue, setSearchValue] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteLoading, setInviteLoading] = useState(false);

    useEffect(() => {
        //isOpenedMemberPopover is true
        if (isOpened && !hasFetchedMembers) {
            //dispatch(fetchProjectOverview({ id: id }))
            dispatch(fetchTasksByProject({ id: id }))
            dispatch(fetchAllMembers())
            dispatch(fetchAllInvitedMember())
            setHasFetchedMembers(true);
        }
    }, [isOpened]);

    const filteredMembers = useMemo(() => {
        if (!allMembers) return [];
        const lower = searchValue.toLowerCase();
        return allMembers.filter(
            member =>
                member.name.toLowerCase().includes(lower) ||
                member.email.toLowerCase().includes(lower)
        );
    }, [allMembers, searchValue]);

    useEffect(() => {
        setSelectedMembers(boardMembers || []);
        setAddedMembers(boardMembers && boardMembers.length > 0 ? boardMembers.map((member) => member.id) : []);
    }, [projectInfo, boardMembers]);

    const handleAssignButtonClick = (member) => {
        setAssignLoadingId(member.id);
        setRemoveLoadingId(null);
        // Toggle between assigning and removing a member
        var updatedMembers = [];
        const index = selectedMembers.findIndex((selectedMember) => parseInt(selectedMember.id) === parseInt(member.id));
        if (index === -1) {
            const assignAfterMembers = [...selectedMembers, member];
            updatedMembers = assignAfterMembers;

            setSelectedMembers(assignAfterMembers);
        } else {
            const deletedAfterMembers = selectedMembers.filter((selectedMember) => parseInt(selectedMember.id) !== parseInt(member.id));
            updatedMembers = deletedAfterMembers;

            setSelectedMembers(deletedAfterMembers);
        }

        if (id && id !== 'undefined' && updatedMembers) {
            dispatch(editProject({ id: id, data: { 'members': updatedMembers, 'updated_by': loggedUserId } })).then((response) => {

                if (response.payload.status === 200) {
                    // console.log(response.payload.data.members)
                    dispatch(updateBoardMembers(response.payload.data.members || []));
                    setSelectedMembers(response.payload.data.members || []);
                    setAddedMembers(response.payload.data.members && response.payload.data.members.length > 0 ? response.payload.data.members.map((member) => member.id) : []);

                    // Check if the assigned user is a WordPress administrator
                    const assignedMember = response.payload.data.members.find((m) => m.id === member.id);
                    if (assignedMember && assignedMember.is_wp_admin) {
                        setAssignLoadingId(null);
                        setRemoveLoadingId(null);
                        showNotification({
                            title: 'Superadmin Assigned',
                            message: `${assignedMember.name} is now a superadmin in LazyTasks.`,
                            color: 'blue',
                            autoClose: 3000,
                        });
                    }

                }

            })
                .catch(() => {
                    setAssignLoadingId(null);
                    setRemoveLoadingId(null);
                });
        } else {
            setAssignLoadingId(null);
            setRemoveLoadingId(null);
        }
    };
    const handleRemoveButtonClick = (member) => {
        setRemoveLoadingId(member.id);
        setAssignLoadingId(null);
        const isMemberAssignedToTask = tasks && tasks.allTasks && Object.values(tasks.allTasks).length > 0 && Object.values(tasks.allTasks).some((task) => task.assignedTo_id === member.id.toString());
        const isMemberAssignedToSubTask = tasks && tasks.allTasks && Object.values(tasks.allTasks).length > 0 && Object.values(tasks.allTasks).some((task) => task.children && task.children.length > 0 && task.children.some((subtask) => subtask.assignedTo_id === member.id.toString()));
        console.log(isMemberAssignedToTask, isMemberAssignedToSubTask);
        if (isMemberAssignedToTask || isMemberAssignedToSubTask) {
            setRemoveLoadingId(null);
            modals.open({
                withCloseButton: false,
                centered: true,
                children: (
                    <Fragment>
                        <Text size="sm">
                            {translate('This member is assigned to a task. Please reassign the task before removing the member.')}
                        </Text>

                        <div className="!grid w-full !justify-items-center">
                            <Button justify="center" onClick={() => {
                                setIsOpened(true)
                                modals.closeAll()
                            }} mt="md">
                                {translate('Ok')}
                            </Button>
                        </div>
                    </Fragment>
                ),
            });

            return false;

        }

        // Toggle between assigning and removing a member
        var updatedMembers = [];
        const index = selectedMembers.findIndex((selectedMember) => parseInt(selectedMember.id) === parseInt(member.id));
        if (index === -1) {
            const assignAfterMembers = [...selectedMembers, member];
            updatedMembers = assignAfterMembers;

            setSelectedMembers(assignAfterMembers);
        } else {
            const deletedAfterMembers = selectedMembers.filter((selectedMember) => parseInt(selectedMember.id) !== parseInt(member.id));
            updatedMembers = deletedAfterMembers;

            setSelectedMembers(deletedAfterMembers);
        }

        if (id && id !== 'undefined' && updatedMembers) {
            dispatch(editProject({ id: id, data: { 'members': updatedMembers, deleted_member_id: member.id, 'updated_by': loggedUserId } })).then((response) => {

                if (response.payload.status === 200) {
                    console.log(response.payload.data.members)
                    dispatch(updateBoardMembers(response.payload.data.members || []));
                    setSelectedMembers(response.payload.data.members || []);
                    setAddedMembers(response.payload.data.members && response.payload.data.members.length > 0 ? response.payload.data.members.map((member) => member.id) : []);

                }

            })
                .catch(() => {
                    setRemoveLoadingId(null);
                    setAssignLoadingId(null);
                });
        } else {
            setRemoveLoadingId(null);
            setAssignLoadingId(null);
        }
    };

    const isEmailAlreadyInvited = (email) => {
        return allInvitedMembers && allInvitedMembers.some(member =>
            member.email.toLowerCase() === email.toLowerCase()
        );
    };

    const [isEmailValid, setIsEmailValid] = useState(false);

    const handleSearchInputChange = (e) => {
        const inputValue = e.target.value;
        setSearchValue(inputValue);
        // setIsEmailValid(validateEmail(inputValue));
    };
    const handleInviteInputChange = (e) => {
        const inputValue = e.target.value;
        setInviteEmail(inputValue);
        setIsEmailValid(validateEmail(inputValue));
    };

    const validateEmail = (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    const handleSendInvite = (email) => {
        if (isEmailAlreadyInvited(email)) {
            showNotification({
                id: 'load-data',
                loading: false,
                title: 'User',
                message: translate('This email is already invited.'),
                autoClose: 2000,
                disallowClose: true,
                color: 'red',
            });
            return;
        }
        setInviteLoading(true);
        const values = {
            email: email,
            loggedInUserId: loggedInUser ? loggedInUser.id : loggedUserId
        }
        dispatch(createUser(values)).then((response) => {
            if (response.payload && response.payload.status && response.payload.status === 200) {
                const members = [...selectedMembers, response.payload.data]
                dispatch(editProject({ id: projectInfo ? projectInfo.id : id, data: { 'members': members, 'updated_by': loggedInUser ? loggedInUser.id : loggedUserId } })).then((res) => {
                    if (res.payload && res.payload.status && res.payload.status === 200) {
                        //dispatch(updateBoardMembers(res.payload.data.members || []));
                        //setSelectedMembers(res.payload.data.members || []);
                        //setAddedMembers(res.payload.data.members.map((member) => member.id) || []);
                        // setIsOpened(false);
                        dispatch(fetchAllMembers());
                        dispatch(fetchAllInvitedMember());
                        setInviteEmail('');
                        setIsEmailValid(false);

                        showNotification({
                            id: 'load-data',
                            loading: true,
                            title: 'User',
                            message: response.payload && response.payload.message && response.payload.message,
                            autoClose: 2000,
                            disallowClose: true,
                            color: 'green',
                        });
                    }
                });
            }
        }).finally(() => {
            setInviteLoading(false);
        });
    }


    function shortenEmail(email) {
        if (!email) return '';

        if (email.length <= 25) {
            return email;
        }

        const [namePart, domainPart] = email.split('@');

        const shortName = namePart.length > 6
            ? `${namePart.slice(0, 4)}...`
            : namePart;

        let domain = domainPart || '';
        const domainParts = domain.split('.');

        const domainName = domainParts[0] || '';
        const domainExt = domainParts.slice(1).join('.') || '';

        const shortDomainName = domainName.length > 5
            ? `${domainName.slice(0, 5)}...`
            : domainName;

        return `${shortName}@${shortDomainName}.${domainExt}`;
    }

    const handleProfileEditDrawer = (id) => {
        dispatch(fetchAllRoles());
        dispatch(updateIsLoading(true));

        dispatch(fetchUser(id)).then((response) => {
            if (response.payload && response.payload.status && response.payload.status === 200) {
                dispatch(openProfileDrawer());

                // set timeout to close the loading overlay
                setTimeout(() => {
                    dispatch(updateIsLoading(false));
                }, 500);
            }
        });
    }

    return (
        <>
            {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['remove-member-from-project', 'manage-users']) ? (
                <UsersAvatarGroup users={boardMembers} size={40} maxCount={20}
                    onAvatarClick={(user) => {
                        handleProfileEditDrawer(user.id);
                    }}
                />
            ) : (
                <UsersAvatarGroup users={boardMembers} size={40} maxCount={20} />
            )}
            <Popover withinPortal={false} height={250} position="bottom" withArrow shadow="md" opened={isOpened && projectInfo?.status_name === 'active'} onChange={setIsOpened}>
                <Popover.Target>
                    <Tooltip withinPortal={false} label={translate("Add Member")} position="top" withArrow>
                        <ActionIcon onClick={() => setIsOpened(!isOpened)} variant="filled" size={37} radius="xl" color="#ED7D31"
                            aria-label="Filter"
                            className={`cursor-pointer mt-[2px]`}
                        >
                            <IconPlus className=' hover:scale-110' size={24} stroke={1.5} />
                        </ActionIcon>
                    </Tooltip>
                </Popover.Target>
                <Popover.Dropdown>
                    <Grid className='!mt-[-22px]' columns={12} gutter="md">
                        {/* Search Input */}
                        <Grid.Col span={6}>
                            <TextInput
                                leftSection={<IconSearch size={16} />}
                                placeholder={translate('Quick search member')}
                                mt="md"
                                value={searchValue}
                                onChange={handleSearchInputChange}
                            />
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <TextInput
                                placeholder={translate('Invite By Email')}
                                mt="md"
                                value={inviteEmail}
                                onChange={handleInviteInputChange}
                                rightSection={
                                    <Button variant="filled" color="#39758D"
                                        size='sm'
                                        radius='sm'
                                        disabled={!isEmailValid || inviteLoading}
                                        loading={inviteLoading}
                                        loaderProps={{ type: 'dots' }}
                                        onClick={() => handleSendInvite(inviteEmail)}
                                        style={{
                                            padding: '0px 10px',
                                            height: '28px'
                                        }}
                                    >
                                        {translate('Invite')}
                                    </Button>
                                }
                                rightSectionWidth={62}
                            />
                        </Grid.Col>
                    </Grid>
                    {allInvitedMembers && allInvitedMembers.length > 0 && (
                        <Text className={`!mb-1`} mt={7} size="sm" fw={700} c="#202020">{allInvitedMembers && allInvitedMembers.length > 0 ? allInvitedMembers.length : 0} people invited</Text>
                    )}
                    <ScrollArea
                        className={`min-w-[380px] max-w-[495px] !pr-1.5 ${allInvitedMembers && allInvitedMembers.length > 3 ? "h-[160px]" : ""
                            }`}
                        scrollbarSize={5}
                    >
                        <div className="p-0">

                            <div className="mt-1">
                                {allInvitedMembers && allInvitedMembers.length > 0 && allInvitedMembers.map((member) => (
                                    <div key={member.id} className="ml-single flex items-center border-b border-solid border-[#ffffff] py-1.5 justify-between gap-1">
                                        {/*<Avatar src={member.avatar} size={40} radius={32} />*/}
                                        <UserAvatarSingle user={member} size={32} />
                                        <div className="mls-ne ml-2 w-full">
                                            <Text lineClamp={1} size="sm" fw={700} c="#202020">{member.name}</Text>
                                            <Text lineClamp={1} size="sm" fw={100} c="#202020">
                                                {shortenEmail(member.email)}
                                            </Text>
                                        </div>



                                    </div>
                                ))}
                            </div>
                        </div>
                    </ScrollArea>
                    <Text className={`!mb-2`} mt={6} size="sm" fw={700} c="#202020">{translate('%d people available').replace('%d', filteredMembers && filteredMembers.length > 0 ? filteredMembers.length : 0)}</Text>

                    <ScrollArea className="h-[290px] min-w-[495px] max-w-[495px] !pr-1.5" scrollbarSize={5}>
                        <div className="p-0">

                            <div className="mt-1">
                                {filteredMembers && filteredMembers.length === 0 && (
                                    <div className="py-4 text-center">
                                        <Text size="sm" c="#555">{translate('No members found')}</Text>
                                    </div>
                                )}
                                {filteredMembers && filteredMembers.length > 0 && filteredMembers.map((member) => (
                                    <div key={member.id} className="ml-single flex items-center border-b border-solid border-[#ffffff] py-1.5 justify-between gap-1">
                                        {/*<Avatar src={member.avatar} size={40} radius={32} />*/}
                                        <UserAvatarSingle user={member} size={32} />
                                        <div className="mls-ne ml-2 w-full">
                                            <Text lineClamp={1} size="sm" fw={700} c="#202020">{member.name}</Text>
                                            <Text lineClamp={1} size="sm" fw={100} c="#202020">
                                                {shortenEmail(member.email)}
                                            </Text>
                                        </div>
                                        {loggedInUser && (
                                            <>
                                                {/* Show Remove button if member is added and user has remove permission */}
                                                {addedMembers.includes(member.id) &&
                                                    hasPermission(loggedInUser.llc_permissions, ['remove-member-from-project']) && (
                                                        <Button
                                                            radius="sm"
                                                            height={24}
                                                            style={{
                                                                backgroundColor: "#f00f00",
                                                                color: "#fff",
                                                                fontWeight: 400,
                                                                padding: "5px 0px",
                                                                width: "100px",
                                                            }}
                                                            size="sm"
                                                            marginLeft={2}
                                                            loading={removeLoadingId === member.id}
                                                            loaderProps={{ type: 'dots' }}
                                                            disabled={removeLoadingId === member.id}
                                                            onClick={() => handleRemoveButtonClick(member)}
                                                        >
                                                            {translate('Remove')}
                                                        </Button>
                                                    )}

                                                {/* Show Add button if member is not added and user has add permission */}
                                                {!addedMembers.includes(member.id) &&
                                                    hasPermission(loggedInUser.llc_permissions, ['add-member-to-project-send-invite']) && (
                                                        <Button
                                                            radius="sm"
                                                            height={24}
                                                            style={{
                                                                backgroundColor: "#39758D",
                                                                color: "#fff",
                                                                fontWeight: 400,
                                                                padding: "5px 0px",
                                                                width: "100px",
                                                            }}
                                                            size="sm"
                                                            marginLeft={2}
                                                            loading={assignLoadingId === member.id}
                                                            loaderProps={{ type: 'dots' }}
                                                            disabled={assignLoadingId === member.id}
                                                            onClick={() => handleAssignButtonClick(member)}
                                                        >
                                                            {translate('Add')}
                                                        </Button>
                                                    )}
                                            </>
                                        )}
                                    </div>
                                ))}

                            </div>
                        </div>
                    </ScrollArea>

                </Popover.Dropdown>
            </Popover>
            <MemberEditDrawer />
        </>
    );
}

export default MemberAddRemovePopover;