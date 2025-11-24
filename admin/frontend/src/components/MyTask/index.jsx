import React, { Fragment, useEffect, useState } from 'react';
import {
    ActionIcon,
    Box,
    Container,
    Grid,
    ScrollArea,
    TextInput,
    Title
} from '@mantine/core';
import { useDispatch, useSelector } from "react-redux";
import { fetchAllTags } from "../Settings/store/tagSlice";
import MyTaskList from "./MyTaskList";
import { fetchTasksByUser, setLoggedInUserId, updateColumns } from "../Settings/store/myTaskSlice";
import QuickTaskList from "./QuickTaskList";
import { fetchQuickTasksByUser } from "../Settings/store/quickTaskSlice";
import { IconRefresh, IconSearch, IconX } from "@tabler/icons-react";
import { updateIsLoading } from "../Settings/store/taskSlice";
import { translate } from '../../utils/i18n';

const MyTask = () => {

    const dispatch = useDispatch();
    const { loggedUserId } = useSelector((state) => state.auth.user);
    const [searchInputValue, setSearchInputValue] = useState('');

    useEffect(() => {
        setTimeout(() => {
            if (loggedUserId) {
                dispatch(fetchTasksByUser({ id: loggedUserId })).then((response) => {
                    dispatch(updateColumns(response.payload.data && response.payload.data.tasks ? response.payload.data.tasks : {}))
                })
                dispatch(fetchQuickTasksByUser({ id: loggedUserId }))
                dispatch(fetchAllTags())
                dispatch(setLoggedInUserId(loggedUserId))
            }
        }, 500);
    }, [dispatch, loggedUserId]);
    const handleRefresh = () => {
        dispatch(updateIsLoading(true))
    }

    const searchHandler = (e) => {

        const searchValue = e.target.value;
        setSearchInputValue(searchValue);
        dispatch(fetchTasksByUser({ id: loggedUserId, data: { search: searchValue } })).then((response) => {
            dispatch(updateColumns(response.payload.data && response.payload.data.tasks ? response.payload.data.tasks : {}))
        })

    }

    const handleClearSearch = () => {
        setSearchInputValue('');
        dispatch(fetchTasksByUser({ id: loggedUserId, data: { search: '' } })).then((response) => {
            dispatch(updateColumns(response.payload.data && response.payload.data.tasks ? response.payload.data.tasks : {}))
        })
    };

    return (
        <Fragment>
            {/*<Header />*/}

            <div className='dashboard'>
                <Container size="full">

                    <div className="settings-page-card rounded-xl mt-5">
                        {/* <ScrollArea
                            className={`${appLocalizer?.is_admin ? 'h-[calc(100vh-172px)]' : 'h-[calc(100vh-124px)]'}`}
                            scrollbars="y" scrollbarSize={4}
                            offsetScrollbars={true}
                        > */}
                            <Grid columns={12} className="pb-3">
                                <Grid.Col span={9}>
                                    <Box bg={"white"} p={20} m={5} radius="xl" className="rounded-xl">
                                        <div className='mt-2 mb-3 d-flex justify-between'>
                                            <Grid align="center">
                                                <Grid.Col span={`auto`}>
                                                    <Title order={5}>{translate('My Tasks')}</Title>
                                                </Grid.Col>
                                                <Grid.Col span={4}>
                                                    <TextInput
                                                        value={searchInputValue}
                                                        rightSectionPointerEvents="auto"
                                                        rightSection={
                                                            searchInputValue ? (
                                                                <IconX
                                                                    size={24}
                                                                    stroke={1.5}
                                                                    className="cursor-pointer text-gray-500"
                                                                    onClick={handleClearSearch}
                                                                />
                                                            ) : (
                                                                <IconSearch size={24} stroke={1.5} className="text-gray-500" />
                                                            )
                                                        }
                                                        onChange={(e) => { searchHandler(e) }}
                                                        placeholder={translate('Search...')} />
                                                </Grid.Col>
                                                <Grid.Col span={`content`} className="flex justify-end align-middle">
                                                    <ActionIcon onClick={() => handleRefresh()} variant="white" color="yellow" radius="xs" aria-label="Refresh">
                                                        <IconRefresh size={24} stroke={1.5} />
                                                        {/*<IconAdjustments style={{ width: '70%', height: '70%' }} stroke={1.5} />*/}
                                                    </ActionIcon>
                                                </Grid.Col>
                                            </Grid>

                                        </div>
                                        <div className="w-full bg-white">
                                            <MyTaskList />
                                        </div>
                                    </Box>
                                </Grid.Col>
                                <Grid.Col span={3} className="mt-1">
                                    <QuickTaskList />
                                </Grid.Col>
                            </Grid>
                        {/* </ScrollArea> */}
                    </div>
                </Container>
            </div>

        </Fragment>

    );
}

export default MyTask;
