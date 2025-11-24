import { IconCheck, IconChevronDown, IconDeviceFloppy, IconEdit, IconMinus, IconTrash, IconArrowsMove } from '@tabler/icons-react';
import React, { useState, useRef, useEffect, Fragment } from 'react';
import { useDispatch, useSelector } from "react-redux";
import {
  createProjectPriority,
  deleteProjectPriority,
  editTask,
  removeSuccessMessage,
  editProjectPrioritySortOrder
} from "../../../../Settings/store/taskSlice";
import { useParams } from "react-router-dom";
import { hasPermission } from "../../../../ui/permissions";
import {
  Box,
  Button,
  Grid,
  Popover,
  Text,
  Title, Tooltip,
  useMantineTheme,
  LoadingOverlay
} from "@mantine/core";
import { useHotkeys } from '@mantine/hooks';
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { translate } from '../../../../../utils/i18n';

const TaskPriority = ({ taskId, priority, disabled }) => {
  const dispatch = useDispatch();
  const theme = useMantineTheme();
  const id = useParams();
  const projectId = id.id;
  const { loggedUserId } = useSelector((state) => state.auth.user)
  const { loggedInUser } = useSelector((state) => state.auth.session)

  const { projectPriorities } = useSelector((state) => state.settings.task);

  const [newPriority, setNewPriority] = useState('');
  const [newPriorityColor, setNewPriorityColor] = useState('#346A80');
  const [selectedPriority, setSelectedPriority] = useState(priority ? priority.id : '');
  const [selectedPriorityName, setSelectedPriorityName] = useState(priority ? priority.name : '');
  const [selectedPriorityColor, setSelectedPriorityColor] = useState(priority && priority.color_code ? priority.color_code : '#000000');
  const [showPriorityList, setShowPriorityList] = useState(false);
  const [showPriorityAddInput, setShowPriorityAddInput] = useState(false);
  const [showPriorityEditInput, setShowPriorityEditInput] = useState(false);
  const selectPriorityRef = useRef(null);
  const priorityInputRef = useRef(null);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectPriorityRef.current && !selectPriorityRef.current.contains(event.target)) {
        setShowPriorityList(false);
        setShowPriorityAddInput(false);
        setShowPriorityEditInput(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowPriorityList(false);
        setShowPriorityAddInput(false);
        setShowPriorityEditInput(false);
        setNewPriority('');
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
    setSelectedPriority(priority ? priority.id : '');
    setSelectedPriorityName(priority ? priority.name : '');
    setSelectedPriorityColor(priority && priority.color_code ? priority.color_code : '#000000')
  }, [priority]);

  useHotkeys([
    ['Escape', () => setShowPriorityList(false)]
  ]);

  const handleInputChange = (e) => {
    setNewPriority(e.target.value);
  };

  const handleColorInputChange = (e) => {
    setNewPriorityColor(e.target.value);
  };

  const handlePriorityListShow = () => {
    setShowPriorityList(true);
  };

  const handleAddPriority = () => {
    if (newPriority.trim() !== '' && newPriority !== 'Type name here') {
      const submitData = {
        name: newPriority,
        project_id: projectId,
        color_code: newPriorityColor,
        created_by: loggedInUser ? loggedInUser.loggedUserId : loggedUserId
      }
      dispatch(createProjectPriority(submitData))
      setNewPriority('');
    }
    setShowPriorityAddInput(false);
  };

  const handleCreatePriority = () => {
    setNewPriority('');
    setShowPriorityAddInput(true);
    setTimeout(() => {
      if (priorityInputRef.current) {
        priorityInputRef.current.focus();
      }
    }, 0);
  };

  const [priorityId, setPriorityId] = useState(null);
  // priorityEditHandler
  const priorityEditHandler = (priority) => {
    setShowPriorityAddInput(false);
    if (priority && priority.id) {
      setNewPriority(priority.name);
      setNewPriorityColor(priority.color_code);
      setShowPriorityEditInput(true);
      setPriorityId(priority.id);
      setTimeout(() => {
        if (priorityInputRef.current) {
          priorityInputRef.current.focus();
        }
      }, 0);
    }

  }

  const handleUpdatePriority = () => {
    if (newPriority.trim() !== '' && newPriority !== 'Type name here') {
      const submitData = {
        id: priorityId,
        name: newPriority,
        project_id: projectId,
        color_code: newPriorityColor,
        created_by: loggedInUser ? loggedInUser.loggedUserId : loggedUserId
      }
      dispatch(createProjectPriority(submitData)).then((response) => {

        if (response.payload && response.payload.data) {
          const newPriorities = response.payload.data;
          // map through the priorities and update the selected priority
          const priority = newPriorities.find(priority => priority.id === selectedPriority);

          setSelectedPriority(priority ? priority.id : '');
          setSelectedPriorityName(priority ? priority.name : '');
          setSelectedPriorityColor(priority && priority.color_code ? priority.color_code : '#000000');
          setNewPriority('');
          setShowPriorityEditInput(false);

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

      })
    }
  };

  const handleSelectPriority = (priority) => {
    if (!hasAccess) return;
    if (taskId && taskId !== 'undefined' && priority) {
      dispatch(editTask({ id: taskId, data: { priority: priority, 'updated_by': loggedInUser ? loggedInUser.loggedUserId : loggedUserId } }))
    }
    setSelectedPriority(priority ? priority.id : '');
    setSelectedPriorityName(priority ? priority.name : '');
    setSelectedPriorityColor(priority && priority.color_code ? priority.color_code : '#000000');
    setShowPriorityAddInput(false);
    setShowPriorityList(false);
  };

  const priorityDeleteHandler = () => modals.openConfirmModal({
    title: (
      <Title order={5}>You are parmanently deleting this priority</Title>
    ),
    size: 'sm',
    radius: 'md',
    withCloseButton: false,
    children: (
      <Text size="sm">
        Are you sure you want to delete this priority?
      </Text>
    ),
    labels: { confirm: 'Confirm', cancel: 'Cancel' },
    onCancel: () => console.log('Cancel'),
    onConfirm: () => {
      if (priorityId && projectId) {

        dispatch(deleteProjectPriority({ data: { id: priorityId, taskId: taskId, project_id: projectId } })).then((response) => {

          if (response.payload && response.payload.status === 200) {

            // setSelectedPriority
            const newPriorities = response.payload.data;

            // map through the priorities and update the selected priority
            const priority = newPriorities.find(priority => priority.id === selectedPriority);

            setSelectedPriority(priority ? priority.id : '');

            notifications.show({
              color: theme.primaryColor,
              title: response.payload.message,
              icon: <IconCheck />,
              autoClose: 5000,
              // withCloseButton: true,
            });
            const timer = setTimeout(() => {
              dispatch(removeSuccessMessage());
            }, 3000); // Clear notification after 3 seconds

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

    const reorderedPriorities = Array.from(projectPriorities);
    const [movedItem] = reorderedPriorities.splice(result.source.index, 1);
    reorderedPriorities.splice(result.destination.index, 0, movedItem);
    if (result.type === 'priority') {

      dispatch(editProjectPrioritySortOrder({
        data: {
          project_id: projectId,
          sort_order: reorderedPriorities.map((priority, index) => ({
            id: priority.id,
            sort_order: index + 1,
          })),
        },
      })).then((response) => {
        if (response.payload && response.payload.status === 200) {
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

  // Check permission
  const hasAccess = hasPermission(
    loggedInUser && loggedInUser.llc_permissions,
    ['change-priority']
  );

  return (
    <Fragment>
      <Popover
        opened={showPriorityList}
        onClose={() => setShowPriorityList(false)}
        width={250}
        position="bottom"
        withArrow
        shadow="md"
        withinPortal={false}
        disabled={disabled}
      >
        <Popover.Target>
          <Tooltip label={translate('Priority')} position="top" withArrow>
            {!selectedPriority ? (
              <Box onClick={handlePriorityListShow} className="min-w-25 h-[22px] py-0 items-center gap-2 inline-flex border border-[#EBF1F4] rounded-[25px] bg-[#EBF1F4] px-[10px]">
                <IconMinus color="#4d4d4d" size="18" />
                <IconChevronDown color="#4d4d4d" size="18" />
              </Box>
            ) : (
              <Box
                onClick={handlePriorityListShow}
                style={{ backgroundColor: selectedPriorityColor, height: '22px' }}
                className="px-2 py-0 rounded-[25px] items-center gap-0 inline-flex"
              >
                <Text
                  className={`min-w-14 max-w-14 !pl-1.5`}
                  lineClamp={1}
                  c="white"
                  size="sm"
                  fw={400}
                  title={selectedPriorityName}
                >
                  {selectedPriorityName}
                </Text>
                <IconChevronDown color="#ffffff" size="18" />
              </Box>
            )}
          </Tooltip>
        </Popover.Target>

        <Popover.Dropdown>
          <Box ref={selectPriorityRef}>
            <LoadingOverlay visible={isLoading} zIndex={1000} overlayBlur={2} />
            <DragDropContext
              onDragEnd={(result) => {
                handleDragEnd(result);
              }}
            >
              <Droppable droppableId="priorityList" type="priority">
                {(provided) => (
                  <Box
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {projectPriorities &&
                      projectPriorities.map((priority, index) => (
                        <Draggable key={priority.id} draggableId={priority.id.toString()} index={index} isDragDisabled={true}>
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
                                    onClick={() => handleSelectPriority(priority)}
                                  >
                                    {selectedPriority === priority.id ? <IconCheck size="14" /> : null}
                                    <Box
                                      className="flex-shrink-0 w-5 h-5 rounded-full"
                                      style={{ backgroundColor: priority.color_code }}
                                    />
                                    <Text
                                      lineClamp={1}
                                      c="black"
                                      size="xs"
                                      fw={400}
                                      className="flex-grow"
                                    >
                                      {priority.name}
                                    </Text>
                                  </Box>
                                </Grid.Col>
                                {/* <Grid.Col span={1} className={`flex items-center !py-1`}>
                                  {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['add-remove-priority']) && (
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
                                  {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['add-remove-priority']) && (
                                    <ActionIcon
                                      onClick={() => priorityEditHandler(priority)}
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
            {/* {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['add-remove-priority']) && (
              <Box className={`border-t border-t-[#C8C8C8] pt-1.5 mt-2`}>
                {showPriorityAddInput ? (
                  <div className="flex items-center gap-1 py-1">
                    <input
                      className="w-[30px] h-[30px] rounded-sm text-[12px]"
                      type="color"
                      value={newPriorityColor}
                      onChange={handleColorInputChange}
                      placeholder="Color"
                    />
                    <TextInput
                      ref={priorityInputRef}
                      size="xs"
                      className="text-[12px]"
                      defaultValue={newPriority}
                      onChange={handleInputChange}
                      placeholder={'Type name here'}
                      rightSection={
                        <ActionIcon onClick={handleAddPriority} size={24} radius="xl" color="#ED7D31" variant="filled">
                          <IconDeviceFloppy style={{ width: '18px', height: '18px' }} stroke={1.5} />
                        </ActionIcon>
                      }
                    />
                  </div>
                ) : (
                  !showPriorityEditInput && (
                    <span
                      className="block cursor-pointer text-[12px] p-1 text-[#ED7D31]"
                      onClick={handleCreatePriority}
                    >
                      {translate('+ Create')}
                    </span>
                  )
                )}

                {showPriorityEditInput && (
                  <div className="flex items-center gap-1 py-1">
                    <input
                      className="w-[30px] h-[30px] rounded-sm text-[12px]"
                      type="color"
                      value={newPriorityColor}
                      onChange={handleColorInputChange}
                      placeholder="Color"
                    />
                    <TextInput
                      ref={priorityInputRef}
                      size="xs"
                      className="w-full text-[12px]"
                      value={newPriority}
                      onChange={handleInputChange}
                      placeholder={'Type name here'}
                      rightSection={
                        <ActionIcon onClick={handleUpdatePriority} size={24} radius="xl" color="#ED7D31" variant="filled">
                          <IconDeviceFloppy style={{ width: '18px', height: '18px' }} stroke={1.5} />
                        </ActionIcon>
                      }
                    />

                    <ActionIcon onClick={priorityDeleteHandler} size={24} radius="xl" variant="transparent">
                      <IconTrash size="24" stroke={1.5} color={`red`} />
                    </ActionIcon>
                  </div>
                )}
              </Box>
            )} */}
          </Box>

        </Popover.Dropdown>


      </Popover>

    </Fragment>
  );
};

export default TaskPriority;
