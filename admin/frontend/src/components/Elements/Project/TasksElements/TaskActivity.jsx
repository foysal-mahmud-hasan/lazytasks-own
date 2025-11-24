import {Avatar, Button, Flex, Select, Text, Textarea, Timeline} from '@mantine/core';
import { IconChevronDown, IconPointFilled } from '@tabler/icons-react';
import React, {Fragment, useState} from 'react';
import { useDisclosure } from '@mantine/hooks';
import {useDispatch, useSelector} from "react-redux";
import {createComment} from "../../../Settings/store/taskSlice";
import ActivityLogs from "./ActivityLogs";
import dayjs from 'dayjs'

const TaskActivity = ({task, selectedValue}) => {

  const dateTimeFormat = 'DD MMM YYYY hh:mm A'

  return (
    <Fragment>
      <Timeline color="white" bulletSize={32}>
        {task.logActivities && task.logActivities.length > 0 ? (
            task.logActivities && task.logActivities.length > 0 && task.logActivities.map((activity, index) => (

                <Timeline.Item
                  key={activity.id + index} title={activity.user_name}
                  bullet={
                    <Avatar size={32} src={activity.avatar} alt={activity.user_name} />
                  }
                >
                  <Text c="dimmed" size="sm">
                    <ActivityLogs activity={activity}/>
                  </Text>
                  <Text fw={400} fz={12} c={`#39758D`} style={{marginLeft: '3px',marginTop: '3px'}}>{activity.created_at ? dayjs(activity.created_at).format(dateTimeFormat) : ''}</Text>
                </Timeline.Item>
            ))
        ) : (
            <Timeline.Item>No Activities</Timeline.Item>
        )}
      </Timeline>
    </Fragment>
  );
};

export default TaskActivity;
