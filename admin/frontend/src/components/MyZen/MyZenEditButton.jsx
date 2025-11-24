import React, {Fragment, useEffect, useRef, useState} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    Avatar,
    Button,
    Card,
    Flex,
    Grid,
    Group,
    Modal,
    Popover,
    ScrollArea,
    Text,
    Title,
    useMantineTheme
} from '@mantine/core';
import my_zen from "../../img/my-zen-black.svg";
import {useDisclosure} from "@mantine/hooks";
import TimePicker from "../ui/TimePicker";
import {IconCalendarEvent, IconCalendarMonth} from "@tabler/icons-react";
import {Calendar} from "@mantine/dates";
import {editMyZen} from "./store/myZenSlice";
import dayjs from "dayjs";
import {showNotification} from "@mantine/notifications";


const formatDate = (date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    //timezone
    var timezone_offset_minutes = date.getTimezoneOffset();
    timezone_offset_minutes = timezone_offset_minutes == 0 ? 0 : timezone_offset_minutes;

    console.log('timezone', timezone_offset_minutes)
    return `${day}-${month}-${year}`;
};

const MyZenEditButton = ({ task, taskId, isSubtask }) => {
    const dispatch = useDispatch()
    const {loggedUserId} = useSelector((state) => state.auth.user)
    const {loggedInUser} = useSelector((state) => state.auth.session)
    const [myZenModalOpen, { open: openMyZenModal, close: closeMyZenModal }] = useDisclosure(false);

    const [opened, setOpened] = useState(false);
    const [selectedDate, setSelectedDate] = useState(task && task.end_date ? new Date(task.end_date) : null );
    const [currentDate, setCurrentDate] = useState(new Date());

    //submited date

    var [submittedData, setSubmittedData] = useState({})
    const handleSelect = (date) => {
        setSelectedDate(date);

        var formatedDate = dayjs(date).format('YYYY-MM-DD');

        setSubmittedData({
            ...submittedData,
            end_date: formatedDate,
            start_date: formatedDate
        })

    };

    const handleCurrentDate = (date) => {
        setSelectedDate(null);
        setCurrentDate(date);
        var formatedDate = dayjs(date).format('YYYY-MM-DD');

        setSubmittedData({
            ...submittedData,
            end_date: formatedDate,
            start_date: formatedDate
        })
    }

    const [startTime, setStartTime] = useState(task && task.start_time ? task.start_time : null);
    const [endTime, setEndTime] = useState(task && task.end_time ? task.end_time : null);

    useEffect(() => {
        setSelectedDate(task && task.end_date ? new Date(task.end_date) : null );
        setStartTime(task && task.start_time ? task.start_time : null);
        setEndTime(task && task.end_time ? task.end_time : null);

        setSubmittedData({
            ...submittedData,
            end_date: task && task.start_date ? task.start_date : null,
            start_date: task && task.end_date ? task.end_date : null,
            start_time: task && task.start_time ? task.start_time : null,
            end_time: task && task.end_time ? task.end_time : null,
        })

    }, [dispatch, task]);

    const handleTimePicker = (e) => {

        //submittedData start_time, end_time
        setSubmittedData({
            ...submittedData,
            [e.target.name]: e.target.value
        })
    }
    useEffect(() => {
        if(myZenModalOpen===false){
            //check all data same does not need to update
            if( submittedData && Object.keys(submittedData).length>0 &&
                task.start_date && submittedData.start_date === task.start_date &&
                task.end_date && submittedData.end_date === task.end_date &&
               submittedData.start_time===task.start_time && submittedData.end_time===task.end_time){
                return;
            }

            //check start time and end time should be same and less than end time validation
            if(submittedData && Object.keys(submittedData).length>0 && submittedData.start_time && submittedData.end_time){
                var start = new Date("01/01/2007 " + submittedData.start_time);
                var end = new Date("01/01/2007 " + submittedData.end_time);
                if(start >= end){
                    showNotification({
                        id: 'load-data',
                        loading: true,
                        title: 'Error',
                        autoClose: 2000,
                        disallowClose: true,
                        message: 'End time should be greater than start time',
                        color: 'red',
                    });
                    return;
                }

            }


            if(submittedData && Object.keys(submittedData).length>0){

                // null or empty start time and end time check

                if( submittedData.start_time === null || submittedData.start_time === '' || submittedData.end_time === null || submittedData.end_time === '') {
                    showNotification({
                        id: 'load-data',
                        loading: true,
                        title: 'Error',
                        autoClose: 2000,
                        disallowClose: true,
                        message: 'Start time and end time should not be empty',
                        color: 'red',
                    });
                    return;
                }
                // empty start date and end date check
                if(submittedData.start_date === null || submittedData.start_date === '' || submittedData.end_date === null || submittedData.end_date === '') {
                    showNotification({
                        id: 'load-data',
                        loading: true,
                        title: 'Error',
                        autoClose: 2000,
                        disallowClose: true,
                        message: 'Date should not be empty',
                        color: 'red',
                    });
                    return;
                }

                dispatch(editMyZen({id: taskId, data: {...submittedData, 'updated_by': loggedUserId }})).then((response) => {
                    if(response.payload && response.payload.status && response.payload.status === 200){
                        showNotification({
                            id: 'load-data',
                            loading: true,
                            title: 'My Zen',
                            message: response.payload && response.payload.message && response.payload.message,
                            autoClose: 2000,
                            disallowClose: true,
                            color: 'green',
                        });
                    }
                    if (response.payload && response.payload.status && response.payload.status !== 200) {
                        showNotification({
                            id: 'load-data',
                            loading: true,
                            title: 'My Zen',
                            message: response.payload && response.payload.message && response.payload.message,
                            autoClose: 2000,
                            disallowClose: true,
                            color: 'red',
                        });
                    }
                });
            }
        }
    }, [myZenModalOpen]);

    return (
        <>
            <Avatar
                onClick={openMyZenModal}
                src={my_zen}
                stroke={1.25}
                size={24} />


            { myZenModalOpen &&
                <Modal.Root
                    opened={myZenModalOpen}
                    onClose={closeMyZenModal}
                    centered
                    size={`xl`}
                    classNames={{
                        header: '!px-[24px] !py-[16px]',
                        body: '!px-[24px] !pb-[24px]',
                        content: 'my-zen-content',
                    }}
                >
                    <Modal.Overlay />
                    <Modal.Content radius={15}>
                        <Modal.Header>
                            <Modal.CloseButton />
                        </Modal.Header>
                        <Modal.Body >
                            <Card className={`!bg-[#EBF1F4]`} withBorder padding={`lg`} radius="md">
                                <Card.Section withBorder inheritPadding py="md">
                                    <Group justify="space-between">
                                        <Title order={5}>{task && task.name}</Title>
                                    </Group>
                                </Card.Section>
                                <Card.Section withBorder inheritPadding py="md">
                                    <Group justify="space-between">
                                        <Grid className={`w-full`}>
                                            <Grid.Col span={6}>
                                                <Flex
                                                    mih={50}
                                                    height={`h-full`}
                                                    gap="md"
                                                    justify="flex-start"
                                                    align="flex-end"
                                                    direction="row"
                                                    wrap="wrap"
                                                    className={`w-full h-full`}
                                                >
                                                    <Button onClick={() => {
                                                        handleCurrentDate(new Date())
                                                    }}
                                                        size={`sm`}
                                                        style={{
                                                            backgroundColor: `${selectedDate?'#ffffff':'#39758D'}`,
                                                            color: `${selectedDate?'#39758D':'#ffffff'}`,
                                                        }}
                                                        >Today</Button>
                                                    <Popover position="bottom" withArrow shadow="md" opened={opened} onChange={setOpened}>
                                                        <Popover.Target>
                                                            {selectedDate ? (
                                                                    <Button onClick={() => setOpened((o) => !o)}
                                                                            className={`!bg-white !text-[#39758D]`} size={`sm`}>
                                                                        {formatDate(selectedDate)}
                                                                    </Button>
                                                                ) : (
                                                                <Button onClick={() => setOpened((o) => !o)}
                                                                        className={`!bg-white`} size={`sm`}>
                                                                    <IconCalendarMonth

                                                                        size={24} color={`#39758D`}  />
                                                                </Button>
                                                            )}



                                                        </Popover.Target>
                                                        <Popover.Dropdown>
                                                            <Calendar
                                                                getDayProps={(date) => ({
                                                                    onClick: () => {
                                                                        var sDate=date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()
                                                                        var currentHourMin = new Date().getHours() + ':' + new Date().getMinutes();
                                                                        handleSelect(date)
                                                                    },
                                                                })}
                                                            />
                                                        </Popover.Dropdown>
                                                    </Popover>
                                                </Flex>
                                            </Grid.Col>
                                            <Grid.Col span={3}>
                                                <Text>Start time</Text>
                                                <TimePicker name="start_time" value={startTime} onChange={(e)=> {
                                                        setStartTime(e.target.value)
                                                    handleTimePicker(e)
                                                }} />

                                            </Grid.Col>
                                            <Grid.Col span={3}>
                                                <Text>End time</Text>
                                                <TimePicker name="end_time" value={endTime} onChange={(e)=> {
                                                    setEndTime(e.target.value)
                                                    handleTimePicker(e)
                                                }} />
                                            </Grid.Col>
                                        </Grid>
                                    </Group>
                                </Card.Section>


                            </Card>

                            <Card>
                                <Card.Section withBorder >
                                    <Group justify="space-between">
                                        <Flex
                                            mih={50}
                                            height={`h-full`}
                                            gap="md"
                                            justify="flex-end"
                                            align="flex-end"
                                            direction="row"
                                            wrap="wrap"
                                            className={`w-full h-full pb-[2px]`}
                                        >
                                            <Button variant="outline" color="orange">End</Button>
                                            <Button variant="filled" color="orange">Start</Button>

                                        </Flex>
                                    </Group>
                                </Card.Section>


                            </Card>
                        </Modal.Body>
                    </Modal.Content>
                </Modal.Root>
            }
        </>


    );
};

export default MyZenEditButton;
