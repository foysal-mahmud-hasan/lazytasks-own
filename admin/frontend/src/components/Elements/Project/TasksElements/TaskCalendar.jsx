import React, { useState, useEffect, Fragment } from 'react';
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { useSelector, useDispatch } from 'react-redux';
import { openTaskEditDrawer, setEditableTask, fetchTasksBySection, updateIsLoading, fetchTasksByProject } from "../../../Settings/store/taskSlice";
import { Box, Text, Flex } from "@mantine/core";
import UserAvatarSingle from "../../../ui/UserAvatarSingle";
import { IconUserCircle, IconPlus } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import AddTaskDrawerFromCalendar from "./AddTaskDrawerFromCalendar";
import { useParams } from 'react-router-dom';

function renderEventContent(eventInfo) {
  const assignedUser = eventInfo.event.extendedProps.assigned_to;

  return (
    <Box px={6} py={1} w="100%" bg={'blue'} style={{ color: '#fff', borderRadius: '6px' }}>
      <Flex justify="flex-start" align="center" gap={10}>

        {assignedUser ? (
          <UserAvatarSingle user={assignedUser} size={20} />
        ) : (
          <Box
          w={20}
          h={20}
          style={{
            border: '1px dashed #fff',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          >
            <IconUserCircle size={16} color="#fff" stroke={1.25} />
          </Box>
        )}
        <Text
          size="sm"
          title={eventInfo.event.title}
          lineClamp={1}
          style={{ flex: 1, minWidth: 0 }}
          dangerouslySetInnerHTML={{ __html: eventInfo.event.title }}
        />
      </Flex>
    </Box>
  );
}


const TaskCalendar = () => {

  const dispatch = useDispatch();
  const { loggedUserId } = useSelector((state) => state.auth.user);
  const { loggedInUser } = useSelector((state) => state.auth.session);
  const userId = loggedInUser ? loggedInUser.loggedUserId : loggedUserId;
  const { projectInfo, ordered, taskListSections, columns, isLoading } = useSelector((state) => state.settings.task);
  const { id } = useParams();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isLoading === true) {
          await dispatch(fetchTasksByProject({ id, data: {}, userId })).then((response) => {
            if (response.payload.status === 200) {
              dispatch(updateIsLoading(false))
            }
          });
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        // dispatch(updateIsLoading( false ))
      }
    };
    fetchData();
  }, [dispatch, isLoading]);

  const events = Object.values(columns).flatMap(column =>
    column.map(task => ({
      id: task.id,
      title: task.name,
      start: task.start_date,
      end: task.end_date ? task.end_date + ' 23:59' : null,
      assigned_to: task.assigned_to,
      task: task
    }))
  );

  const [task, setTask] = useState(null);
  const onEventClick = (arg) => {
    const { start, end, id, title, extendedProps } = arg.event
    //previous state replace current state using callback
    setTask({ ...extendedProps.task });

    // openTaskEditDrawer();
    dispatch(setEditableTask(extendedProps.task))
    dispatch(openTaskEditDrawer())
  }


  const [taskAddDrawerOpenFromCalendar, { open: openTaskAddDrawerFromCalendar, close: closeTaskAddDrawerFromCalendar }] = useDisclosure(false);


  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const onCellSelect = (event) => {
    const { startStr, endStr } = event
    if (startStr && endStr) {
      setStartDate(startStr);
      setEndDate(endStr);
      openTaskAddDrawerFromCalendar();
    }
  }

  return (
    <Fragment>

      <FullCalendar
        eventClick={onEventClick}
        select={onCellSelect}
        selectable
        dayMaxEventRows={3}
        datesSet={(arg) => {
        }}
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView='dayGridMonth'
        weekends={true}
        events={events}
        eventContent={renderEventContent}
        headerToolbar={{
          left: "title",
          right: "today prev,next",
        }}
        aspectRatio={2}
      />
      {projectInfo && startDate && <AddTaskDrawerFromCalendar startDate={startDate} endDate={endDate} project={projectInfo} taskAddDrawerOpen={taskAddDrawerOpenFromCalendar} openTaskAddDrawer={openTaskAddDrawerFromCalendar} closeTaskAddDrawer={closeTaskAddDrawerFromCalendar} />}
    </Fragment>
  );
};

export default TaskCalendar;




