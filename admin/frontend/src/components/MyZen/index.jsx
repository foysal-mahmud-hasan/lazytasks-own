import React, {Fragment, useEffect, useState} from 'react';
import {Avatar, Button, Container, Grid, LoadingOverlay, ScrollArea, Tabs, Title} from '@mantine/core';
import {useDispatch, useSelector} from "react-redux";
import {fetchAllTags} from "../Settings/store/tagSlice";
import {fetchTasksByUser, setLoggedInUserId} from "../Settings/store/myTaskSlice";
import {useDisclosure} from "@mantine/hooks";
import {fetchQuickTasksByUser} from "../Settings/store/quickTaskSlice";
import {IconMessageCircle, IconPhoto, IconPlus, IconSettings} from "@tabler/icons-react";
import MyZenList from "./MyZenList";
import {fetchAllMyZens} from "./store/myZenSlice";
import MyZenAddButton from "./MyZenAddButton";

const MyZen = () => {
    const [visible, { toggle }] = useDisclosure(true);

    const dispatch = useDispatch();

    useEffect(() => {
        dispatch((fetchAllMyZens()))
    }, [dispatch]);


    return (
        <Fragment>
            {/*<Header />*/}

            <div className='dashboard'>
                <Container size="full">
                    <div className="settings-page-card bg-white rounded-xl p-6 pt-3 my-5 mb-0">
                        <div className='flex justify-between mt-2 mb-3'>
                            <Title order={4}>My Zen</Title>
                            <MyZenAddButton />
                        </div>
                        <Grid columns={12}>
                            <Grid.Col span={12}>
                                <div className="w-full bg-white">
                                    <MyZenList />
                                </div>

                            </Grid.Col>
                        </Grid>
                    </div>
                </Container>
            </div>

        </Fragment>

    );
}

export default MyZen;
