import React, { useEffect, useState } from 'react';
import { Accordion, Text, Box, Stack } from '@mantine/core';
import { useSelector } from 'react-redux';
import TaskName from "./Task/TaskName";
import TaskAssignTo from "./Task/TaskAssignTo";
import TaskDueDate from "./Task/TaskDueDate";
import TaskPriority from "./Task/TaskPriority";
import TaskTag from "./Task/TaskTag";
import TaskFollower from "./Task/TaskFollower";
import MyTaskRow from "./MyTaskRow";

const MyTaskListContent = ({ contents }) => {
  const [tasks, setTasks] = useState([]);
  const [openValues, setOpenValues] = useState([]);
  const { userTaskChildColumns } = useSelector((state) => state.settings.myTask);

  useEffect(() => {
    if (Array.isArray(contents)) {
      const filteredContents = contents.filter(
        (task) => task.project && task.project.status == 1
      );
      const grouped = filteredContents.reduce((projectGroups, task) => {
        const projectId = task && task.project && task.project.id || '';
        if (!projectGroups[projectId]) {
          projectGroups[projectId] = {
            project: task.project,
            tasks: [],
          };
        }
        projectGroups[projectId].tasks.push(task);
        return projectGroups;
      }, {});

      // const groupedArray = Object.values(grouped);
      const groupedArray = Object.values(grouped).sort((a, b) => {
        const nameA = a.project?.name?.toLowerCase() || '';
        const nameB = b.project?.name?.toLowerCase() || '';
        return nameA.localeCompare(nameB);
      });
      setTasks(groupedArray);

      const allOpenKeys = groupedArray && groupedArray.length > 0 && groupedArray.map((group, index) =>
        `project-${group.project && group.project.id || index}`
      );
      setOpenValues(allOpenKeys);
    } else {
      setTasks([]);
      setOpenValues([]);
    }
  }, [contents]);

  return (
    <Accordion
      chevronPosition="left"
      variant="separated"
      multiple
      value={openValues}
      onChange={setOpenValues}
    >
      {tasks.map((group, groupIndex) => {
        const groupKey = `project-${group.project?.id || groupIndex}`;
        return (
          <Accordion.Item
            value={groupKey}
            key={groupIndex}
            styles={(theme) => ({
              item: {
                border: `1px solid ${theme.colors.gray[3]}`,
                borderRadius: theme.radius.sm,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
              },
              content: {
                padding: 0,
                maxHeight: '400px', // Adjust this value based on your needs
                overflowY: 'auto',
              },
              control: {
                position: 'sticky',
                top: 0,
                zIndex: 10,
                backgroundColor: theme.colors.blue[0],
                borderBottom: `1px solid ${theme.colors.gray[3]}`,
                height: '40px'
              }
            })}
          >
            <Accordion.Control
              styles={(theme) => ({
                control: {
                  backgroundColor: theme.colors.blue[0],
                  borderBottom: `1px solid ${theme.colors.gray[3]}`,
                  height: '35px',
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                }
              })}
            >
              <Text fw={500} size="md">
                {group.project?.name || ''}
              </Text>
            </Accordion.Control>

            <Accordion.Panel>
              <Stack spacing="xs">
                {group.tasks.map((task, taskIndex) => (
                  <Box
                    key={taskIndex}
                    sx={(theme) => ({
                      width: '100%',
                      borderBottom: `1px solid ${theme.colors.gray[3]}`
                    })}
                  >
                    <MyTaskRow task={task} />
                    {userTaskChildColumns &&
                      userTaskChildColumns[task.slug] && userTaskChildColumns[task.slug].length > 0 &&
                      userTaskChildColumns[task.slug].map((subTask, subtaskIndex) => (
                        <Box
                          key={subtaskIndex}
                          pl="xl"
                          my="sm"
                        >
                          <MyTaskRow task={subTask} isSubtask/>
                        </Box>
                      ))}
                  </Box>
                ))}
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        );
      })}
    </Accordion>
  );
};

export default MyTaskListContent;