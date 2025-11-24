import React, {Fragment, useEffect, useState} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {Container, Grid, ScrollArea, LoadingOverlay, Title} from '@mantine/core';
// import { setUsers } from '../../reducers/usersSlice';
import UserCard from '../Elements/UserCard';
import ProfileCreateButton from "../Elements/Button/ProfileCreateButton";
import {closeProfileDrawer, fetchAllInvitedMember, fetchAllMembers} from "../../store/auth/userSlice";
import {hasPermission} from "../ui/permissions";
import MemberEditDrawer from "../Profile/MemberEditDrawer";
const Users = () => {

    const { loggedInUser } = useSelector((state) => state.auth.session)
    const [ isLoading, setIsLoading] = useState(true);

    const { allMembers, allInvitedMembers } = useSelector((state) => state.auth.user);
    const dispatch = useDispatch();

    useEffect(() => {
        setIsLoading(true);
        dispatch(fetchAllInvitedMember())
        dispatch(fetchAllMembers()).then(() => {
            setIsLoading(false);
            dispatch(closeProfileDrawer());
        });
    }, [dispatch]);

  return (
    <Fragment>
        <ScrollArea scrollbarSize={4}
            className={`w-full pb-[2px] ${appLocalizer?.is_admin ? 'h-[calc(100vh-300px)]' : 'h-[calc(100vh-250px)]'}`}
        >
            <LoadingOverlay visible={isLoading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />

            <Title className={`!mb-3`} order={4}>Project Members</Title>
            <Grid className={`mb-5`} gutter={{base: 20}} overflow="hidden" align="stretch" spacing="sm" verticalSpacing="sm">
                {/*{hasPermission(loggedInUser && loggedInUser.llc_permissions, ['superadmin', 'admin', 'director']) &&
                    <Grid.Col  span={{ base: 12, xs:4, sm:3, md: 3, lg: 3 }}>
                        <ProfileCreateButton />
                    </Grid.Col>
                }*/}
                {Array.isArray(allMembers) &&
                    allMembers && allMembers.length>0 && allMembers.map((user, index) => (
                        <Grid.Col key={index} span={{ base: 12, xs:4, sm:3, md: 3, lg: 3 }}>
                            <UserCard key={index}  {...user} />
                        </Grid.Col>
                    ))
                }
            </Grid>

            <Title className={`!mb-3`} order={4}>Invited Members</Title>
            <Grid gutter={{base: 20}} overflow="hidden" align="stretch" spacing="sm" verticalSpacing="sm">
                {/*{hasPermission(loggedInUser && loggedInUser.llc_permissions, ['superadmin', 'admin', 'director']) &&
                    <Grid.Col  span={{ base: 12, xs:4, sm:3, md: 3, lg: 3 }}>
                        <ProfileCreateButton />
                    </Grid.Col>
                }*/}

                {Array.isArray(allInvitedMembers) &&
                    allInvitedMembers && allInvitedMembers.length>0 && allInvitedMembers.map((user, index) => (
                        <Grid.Col key={index} span={{ base: 12, xs:4, sm:3, md: 3, lg: 3 }}>
                            <UserCard key={index}  {...user} />
                        </Grid.Col>
                    ))
                }
            </Grid>

        </ScrollArea>

        <MemberEditDrawer />
    </Fragment>
  );
};

export default Users;
