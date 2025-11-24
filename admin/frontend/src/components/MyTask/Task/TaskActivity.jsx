import {Avatar, Button, Flex, Select, Text, Textarea, Timeline} from '@mantine/core';
import { IconChevronDown, IconPointFilled } from '@tabler/icons-react';
import React, {Fragment, useState} from 'react';
import { useDisclosure } from '@mantine/hooks';
import {useDispatch, useSelector} from "react-redux";
import dayjs from 'dayjs'
import {createComment} from "../../Settings/store/taskSlice";
import ActivityLogs from "../ActivityLogs";
import { translate } from '../../../utils/i18n';

const TaskActivity = ({task, selectedValue}) => {

  const dispatch = useDispatch();

  const [comments, setComments] = useState(task && task.comments ? task.comments : []);
  const [commentText, setCommentText] = useState('');
  const {loggedUserId, name} = useSelector((state) => state.auth.user)
  const {loggedInUser} = useSelector((state) => state.auth.session)

  const dateTimeFormat = 'DD MMM YYYY hh:mm A'

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const commentTime = new Date(timestamp);
    const timeDiff = Math.abs(now - commentTime) / 1000; // in seconds

    if (timeDiff < 60) {
      return 'Just now';
    } else if (timeDiff < 3600) {
      const minutes = Math.floor(timeDiff / 60);
      return `${minutes} min ago`;
    } else if (timeDiff < 86400) {
      const hours = Math.floor(timeDiff / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      return commentTime.toLocaleString();
    }
  };

  const handleAddComment = () => {
    const timestamp = new Date().toISOString();
    const newComment = {
      user_id: loggedInUser ? loggedInUser.loggedUserId : loggedUserId,
      user_name: loggedInUser ? loggedInUser.name : '',
      commentable_id: task && task.id ? task.id : null,
      commentable_type: 'task',
      content: commentText,
      created_at: formatTimestamp(timestamp)
    };
    dispatch(createComment(newComment));
    setComments([newComment, ...comments]);
    setCommentText(''); // Clear textarea
  };

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
            <Timeline.Item>{translate('No Activities')}</Timeline.Item>
        )}
      </Timeline>
      </Fragment>
  );
};

export default TaskActivity;
