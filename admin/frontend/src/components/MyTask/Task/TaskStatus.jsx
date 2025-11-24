import { IconCheck, IconChevronDown, IconMinus } from '@tabler/icons-react';
import React, { useState, useRef, useEffect, Fragment } from 'react';
import { useDispatch, useSelector } from "react-redux";
import { createProjectStatus, deleteProjectStatus, removeSuccessMessage, editProjectStatusSortOrder } from "../../Settings/store/taskSlice";
import { editMyTask } from "../../Settings/store/myTaskSlice";
import { hasPermission } from "../../ui/permissions";
import { Box, Button, Grid, Text, Title, useMantineTheme, LoadingOverlay } from "@mantine/core";
import { useHotkeys } from '@mantine/hooks';
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { translate } from '../../../utils/i18n';

const TaskStatus = ({ task, status }) => {
  const dispatch = useDispatch();
  const theme = useMantineTheme();
  const projectId = task.project_id;
  const taskId = task.id;
  const { loggedUserId } = useSelector((state) => state.auth.user)
  const { loggedInUser } = useSelector((state) => state.auth.session)

  const [newStatus, setNewStatus] = useState('');
  const [newStatusColor, setNewStatusColor] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(status ? status.id : '');
  const [selectedStatusName, setSelectedStatusName] = useState(status ? status.name : '');
  const [selectedStatusColor, setSelectedStatusColor] = useState(status && status.color_code ? status.color_code : '#000000');
  const [showStatusList, setShowStatusList] = useState(false);
  const [showStatusAddInput, setShowStatusAddInput] = useState(false);
  const [showStatusEditInput, setShowStatusEditInput] = useState(false);
  const selectStatusRef = useRef(null);
  const statusInputRef = useRef(null);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectStatusRef.current && !selectStatusRef.current.contains(event.target)) {
        setShowStatusList(false);
        setShowStatusAddInput(false);
        setShowStatusEditInput(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowStatusList(false);
        setShowStatusAddInput(false);
        setShowStatusEditInput(false);
        setNewStatus('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    setSelectedStatus(status ? status.id : '');
    setSelectedStatusName(status ? status.name : '');
    setSelectedStatusColor(status && status.color_code ? status.color_code : '#000000')
  }, [status]);

  useHotkeys([
    ['Escape', () => setShowStatusList(false)]
  ]);

  const handleInputChange = (e) => {
    setNewStatus(e.target.value);
  };

  const handleColorInputChange = (e) => {
    setNewStatusColor(e.target.value);
  };

  const handleStatusListShow = () => {
    setShowStatusList(true);
  };

  const handleAddStatus = () => {
    if (newStatus.trim() !== '') {
      const submitData = {
        name: newStatus,
        project_id: projectId,
        color_code: newStatusColor,
        created_by: loggedInUser ? loggedInUser.loggedUserId : loggedUserId
      }
      dispatch(createProjectStatus(submitData)).then((response) => {

        if (response.payload && response.payload.data) {

          const newStatuses = response.payload.data;

          setProjectStatuses(newStatuses);
          // map through the priorities and update the selected priority
          const status = newStatuses.find(status => status.id === selectedStatus);

          setSelectedStatus(status ? status.id : '');
          setSelectedStatusName(status ? status.name : '');
          setSelectedStatusColor(status && status.color_code ? status.color_code : '#000000');
          setNewStatus('');
          setShowStatusAddInput(false);

          notifications.show({
            color: theme.primaryColor,
            title: response.payload.message,
            icon: <IconCheck />,
            autoClose: 5000,
            // withCloseButton: true,
          });
          const timer = setTimeout(() => {
            dispatch(removeSuccessMessage());
          }, 5000); // Clear notification after 3 seconds

          return () => clearTimeout(timer);
        }

      });
    }
  };

  const handleCreateStatus = () => {
    setShowStatusEditInput(false)
    setShowStatusAddInput(true);
    setTimeout(() => {
      if (statusInputRef.current) {
          statusInputRef.current.focus();
      }
  }, 0);
  };


  const [projectStatuses, setProjectStatuses] = useState(task && task.project && task.project.projectStatuses ? task.project.projectStatuses : []);

  //useEffect
  useEffect(() => {
    setProjectStatuses(task && task.project && task.project.projectStatuses ? task.project.projectStatuses : []);
  }, [task]);

  const [statusId, setStatusId] = useState(null);
  // statusEditHandler
  const statusEditHandler = (status) => {
    if (status && status.id) {
      setNewStatus(status.name);
      setNewStatusColor(status.color_code);
      setStatusId(status.id);
      setShowStatusAddInput(false);
      setShowStatusEditInput(true);
      setTimeout(() => {
        if (statusInputRef.current) {
            statusInputRef.current.focus();
        }
    }, 0);
    }

  }

  const handleUpdateStatus = () => {
    if (newStatus.trim() !== '' && newStatus !== 'Type name here') {
      const submitData = {
        id: statusId,
        name: newStatus,
        project_id: projectId,
        color_code: newStatusColor,
        created_by: loggedInUser ? loggedInUser.loggedUserId : loggedUserId
      }
      dispatch(createProjectStatus(submitData)).then((response) => {

        if (response.payload && response.payload.status === 200) {

          const newStatuses = response.payload.data;

          setProjectStatuses(newStatuses);
          // map through the priorities and update the selected priority
          const status = newStatuses.find(status => status.id === selectedStatus);

          setSelectedStatus(status ? status.id : '');
          setSelectedStatusName(status ? status.name : '');
          setSelectedStatusColor(status && status.color_code ? status.color_code : '#000000');
          setNewStatus('');
          setShowStatusEditInput(false);

          notifications.show({
            color: theme.primaryColor,
            title: response.payload.message,
            icon: <IconCheck />,
            autoClose: 5000,
            // withCloseButton: true,
          });
        }

      })
    }
  };

  const handleSelectStatus = (status) => {
    if (taskId && taskId !== 'undefined' && status) {
      dispatch(editMyTask({ id: taskId, data: { internal_status: status, 'updated_by': loggedInUser ? loggedInUser.loggedUserId : loggedUserId } }))
    }
    setSelectedStatus(status ? status.id : '');
    setSelectedStatusName(status ? status.name : '');
    setSelectedStatusColor(status && status.color_code ? status.color_code : '#000000');
    setShowStatusAddInput(false);
    setShowStatusList(false);
  };

  const statusDeleteHandler = () => modals.openConfirmModal({
    title: (
      <Title order={5}>{translate('You are parmanently deleting this status')}</Title>
    ),
    size: 'sm',
    radius: 'md',
    withCloseButton: false,
    children: (
      <Text size="sm">
        {translate('Are you sure you want to delete this status?')}
      </Text>
    ),
    labels: { confirm: translate('Confirm'), cancel: translate('Cancel') },
    onCancel: () => console.log('Cancel'),
    onConfirm: () => {
      if (statusId && projectId) {

        dispatch(deleteProjectStatus({ data: { id: statusId, taskId: taskId, project_id: projectId } })).then((response) => {

          if (response.payload && response.payload.status === 200) {

            // setselectedStatus
            const newPriorities = response.payload.data;

            setProjectStatuses(newPriorities);

            // map through the priorities and update the selected status
            const status = newPriorities.find(status => status.id === selectedStatus);

            setSelectedStatus(status ? status.id : '');

            notifications.show({
              color: theme.primaryColor,
              title: response.payload.message,
              icon: <IconCheck />,
              autoClose: 5000,
              // withCloseButton: true,
            });

            const timer = setTimeout(() => {
              dispatch(removeSuccessMessage());
            }, 5000); // Clear notification after 3 seconds

            return () => clearTimeout(timer);

          } else {
            modals.open({
              withCloseButton: false,
              centered: true,
              children: (
                <Fragment>
                  <Text size="sm">
                    {response.payload.message}
                  </Text>
                  <div className="!grid w-full !justify-items-center">
                    <Button justify="center" onClick={() => modals.closeAll()} mt="md">
                      Ok
                    </Button>
                  </div>
                </Fragment>
              ),
            });

          }
        });

      }
    },
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    setIsLoading(true);

    const reorderedStatuses = Array.from(projectStatuses);
    const [movedItem] = reorderedStatuses.splice(result.source.index, 1);
    reorderedStatuses.splice(result.destination.index, 0, movedItem);
    if (result.type === 'status') {

      dispatch(editProjectStatusSortOrder({
        data: {
          project_id: projectId,
          sort_order: reorderedStatuses.map((status, index) => ({
            id: status.id,
            sort_order: index + 1,
          })),
        },
      })).then((response) => {
        if (response.payload && response.payload.status === 200) {
          setProjectStatuses(reorderedStatuses);
          // setShowPriorityList(false);
          notifications.show({
            color: theme.primaryColor,
            title: response.payload.message,
            icon: <IconCheck />,
            autoClose: 5000,
            // withCloseButton: true,
          });
        }
      })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }


  };


  return (
    <Fragment>
      <Box className="priority-wrapper">
        <Box className="priority-btn cursor-pointer w-full inline-flex items-center justify-center" onClick={handleStatusListShow}>
          {!selectedStatus ? (
            <Box className="min-w-25 h-[22px] px-1 py-1 items-center gap-2 inline-flex">
              <IconMinus color="#4d4d4d" size="18" />
              <IconChevronDown color="#4d4d4d" size="18" />
            </Box>
          ) : (
            <Box style={{ backgroundColor: selectedStatusColor, height: '22px' }} className="flex px-2 py-0 rounded-[25px] items-center gap-2">
              <Text className={`min-w-12 max-w-12`} lineClamp={1} c="white" size="sm" fw={400} title={selectedStatusName}>{selectedStatusName}</Text>
              <IconChevronDown color="#ffffff" size="18" />
            </Box>
          )}
        </Box>

        {showStatusList && hasPermission(loggedInUser && loggedInUser.llc_permissions, ['change-status']) && (
          <Box ref={selectStatusRef} className="selectpriority-list border rounded-lg bg-white shadow  px-2 py-3 absolute z-100 min-w-[250px]" style={{zIndex:100}}>
            <LoadingOverlay visible={isLoading} zIndex={1000} overlayBlur={2} />
            <DragDropContext
              onDragEnd={(result) => {
                handleDragEnd(result);
              }}
            >
              <Droppable droppableId="priorityList" type="status">
                {(provided) => (
                  <Box
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {projectStatuses &&
                      projectStatuses.map((status, index) => (
                        <Draggable key={status.id} draggableId={status.id.toString()} index={index} isDragDisabled={true}>
                          {(provided) => (
                            <Box
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >

                              {/* Priority content */}
                              <Grid columns={12} className="hover:bg-[#ebf1f4]">
                                <Grid.Col span={9} className="!py-1">
                                  <Box
                                    className="flex items-center gap-2 w-full cursor-pointer text-[12px] p-1"
                                    onClick={() => handleSelectStatus(status)}
                                  >
                                    {selectedStatus === status.id ? <IconCheck size="14" /> : null}
                                    <Box
                                      className="flex-shrink-0 w-5 h-5 rounded-full"
                                      style={{ backgroundColor: status.color_code }}
                                    />
                                    <Text lineClamp={1} c="black" size="xs" fw={400} className="flex-grow">
                                      {status.name}
                                    </Text>
                                  </Box>
                                </Grid.Col>
                                {/* <Grid.Col span={1} className={`flex items-center !py-1`}>
                                  {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['add-remove-status']) && (
                                    <ActionIcon
                                      {...provided.dragHandleProps}
                                      variant="transparent"
                                      aria-label="Edit"
                                    >
                                      <IconArrowsMove size={16} stroke={1} color="#ED7D31" />
                                    </ActionIcon>
                                  )}
                                </Grid.Col>
                                <Grid.Col span={1} className={`flex items-center !py-1`}>
                                  {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['add-remove-status']) && (
                                    <ActionIcon
                                      onClick={() => statusEditHandler(status)}
                                      variant="transparent"
                                      aria-label="Edit"
                                    >
                                      <IconEdit size={16} stroke={1} color="#ED7D31" />
                                    </ActionIcon>
                                  )}
                                </Grid.Col> */}

                              </Grid>

                            </Box>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </Box>
                )}
              </Droppable>
            </DragDropContext>

            {/* {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['add-remove-status']) &&
              <Box className={`border-t border-t-[#C8C8C8] pt-1.5 mt-2`}>
                {showStatusAddInput ? (
                  <div className="flex items-center gap-1 py-1">
                    <input
                      className="w-[30px] h-[30px] rounded-sm text-[12px]"
                      type="color"
                      value={newStatusColor || '#000000'}
                      onChange={handleColorInputChange}
                      placeholder="Color"
                    />
                    <TextInput
                     ref={statusInputRef}
                      size="xs"
                      className="w-full text-[12px]"
                      defaultValue={newStatus}
                      onChange={handleInputChange}
                      placeholder={'Type name here'}
                      rightSection={
                        <ActionIcon onClick={handleAddStatus} size={24} radius="xl" color="#ED7D31" variant="filled">
                          <IconDeviceFloppy style={{ width: '18px', height: '18px' }} stroke={1.5} />
                        </ActionIcon>
                      }
                    />
                  </div>
                ) : (
                  !showStatusEditInput && (
                    <span className="block cursor-pointer text-[12px] p-1 text-[#ED7D31]" onClick={handleCreateStatus}>{translate('+ Create')}</span>
                  )
                )}

                {showStatusEditInput &&
                  <div className="flex items-center gap-1 py-1">
                    <input
                      className="w-[30px] h-[30px] rounded-sm text-[12px]"
                      type="color"
                      value={newStatusColor}
                      onChange={handleColorInputChange}
                      placeholder="Color"
                    />
                    <TextInput
                    ref={statusInputRef}
                      size="xs"
                      className="w-full text-[12px]"
                      value={newStatus}
                      onChange={handleInputChange}
                      placeholder={'Type name here'}
                      rightSection={
                        <ActionIcon onClick={handleUpdateStatus} size={24} radius="xl" color="#ED7D31" variant="filled">
                          <IconDeviceFloppy style={{ width: '18px', height: '18px' }} stroke={1.5} />
                        </ActionIcon>
                      }
                    />
                    <ActionIcon onClick={statusDeleteHandler} size={24} radius="xl" variant="transparent">
                      <IconTrash size="24" stroke={1.5} color={`red`} />
                    </ActionIcon>
                  </div>
                }

              </Box>
            } */}
          </Box>
        )}
      </Box>
    </Fragment>
  );
};

export default TaskStatus;
