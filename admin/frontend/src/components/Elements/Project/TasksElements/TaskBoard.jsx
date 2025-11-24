import React, { useState, useEffect, Fragment } from 'react';
import { IconGripVertical, IconPlus, IconTrash, IconDotsVertical, IconArchiveFilled, IconArchive } from '@tabler/icons-react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from "react-router-dom";
import {
  createTaskSection, deleteTaskSection,
  editSectionSortOrder, editTaskSortOrder,
  fetchTasksByProject, updateChildColumns, updateColumns,
  updateOrdered, archiveSectionTask, fetchTasksBySection
} from "../../../Settings/store/taskSlice";
import TaskSectionName from "./Task/TaskSectionName";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import { reorder, reorderQuoteMap } from "./utils";
import TaskBoardContent from "./TaskBoardContent";
import SectionHeaderActions from './SectionHeaderActions';
import { modals } from "@mantine/modals";
import { Avatar, Button, Popover, Text, TextInput, Title, Tooltip, List, Flex } from "@mantine/core";
import { hasPermission } from "../../../ui/permissions";
import AddTaskPopover from "./AddTaskPopover";
import { showNotification } from "@mantine/notifications";
import { updateInputFieldFocus } from "../../../../store/base/commonSlice";
import { useHotkeys } from '@mantine/hooks';

const TaskBoard = () => {
  const { projectInfo, tasks, columns, ordered, taskListSections, childColumns } = useSelector((state) => state.settings.task);
  const { loggedUserId } = useSelector((state) => state.auth.user)
  const { loggedInUser } = useSelector((state) => state.auth.session)

  const dispatch = useDispatch();
  const { id } = useParams();

  const [accordionItems, setAccordionItems] = useState([]);
  useEffect(() => {
    if (tasks && tasks.taskListSectionsName) {
      const transformedItems = Object.entries(tasks.taskListSectionsName).map(([key, value]) => ({
        value: key,
        title: value.name,
      }));
      setAccordionItems(transformedItems);
    }
  }, []);
  useEffect(() => {
    if (ordered && ordered.length > 0 && projectInfo?.id) {
      ordered.forEach((sectionSlug) => {
        const section = taskListSections[sectionSlug];
        if (section?.id && !columns[sectionSlug]) {
          dispatch(fetchTasksBySection({
            projectId: projectInfo.id,
            sectionSlug: sectionSlug,
            limit: 15,
            offset: 0,
            append: true
          }));
        }
      });
    }
  }, [ordered, projectInfo?.id]);


  const [openAddTaskPopoverHotkey, setOpenAddTaskPopoverHotkey] = useState(false);
  useHotkeys([
    ['alt+n', () => {
      setOpenAddTaskPopoverHotkey(true);
      // Optionally, reset after a short delay so it can be triggered again
      setTimeout(() => setOpenAddTaskPopoverHotkey(false), 300);
    }]
  ]);


  const handleTitleChange = (e, itemValue) => {
    const newAccordionItems = accordionItems.map((item) => {
      if (item.value === itemValue) {
        return { ...item, title: e.target.value };
      }
      return item;
    });
    setAccordionItems(newAccordionItems);
  };


  const handleAddSection = () => {
    const newItemValue = `untitle-section-${accordionItems.length + 1}`;
    const newItem = {
      value: newItemValue,
      title: `Type section name here`,
    };
    setAccordionItems([...accordionItems, newItem]);

    const newSection = {
      name: 'Type section name here',
      project_id: projectInfo.id,
      sort_order: ordered.length + 1,
      created_by: loggedUserId
    }

    dispatch(createTaskSection(newSection));
    dispatch(updateInputFieldFocus(true));
  };

  const onDragEnd = (result) => {
    console.log(result)
    if (!result.destination) {
      return
    }

    const source = result.source
    const destination = result.destination

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return
    }

    if (result.type === 'COLUMN') {
      const newOrdered = reorder(ordered, source.index, destination.index)

      const submittedData = {
        orderedList: newOrdered,
        project_id: projectInfo.id
      }
      dispatch(editSectionSortOrder({ data: submittedData }))
      dispatch(updateOrdered(newOrdered))
      return
    }
    if (result.type === 'SUBTASK') {
      const data = reorderQuoteMap({
        quoteMap: childColumns,
        source,
        destination,
      })
      // console.log(data.quoteMap)
      const updateColumnData = {
        ...childColumns,
        ...data.quoteMap,
      }
      const combineUpdateChildData = {
        ...result,
        updateColumnData
      }

      const submittedData = {
        orderedList: combineUpdateChildData,
        project_id: projectInfo.id,
        updated_by: loggedUserId
      }

      dispatch(editTaskSortOrder({ data: submittedData }))
      dispatch(updateChildColumns(updateColumnData))
      return
    }
    const data = reorderQuoteMap({
      quoteMap: columns,
      source,
      destination,
    })
    // console.log(data.quoteMap)
    const updateColumnData = {
      ...columns,
      ...data.quoteMap,
    }
    const combineUpdateData = {
      ...result,
      updateColumnData
    }

    const submittedData = {
      orderedList: combineUpdateData,
      project_id: projectInfo.id,
      updated_by: loggedUserId
    }

    dispatch(editTaskSortOrder({ data: submittedData }))
    dispatch(updateColumns(updateColumnData))

  };

  return (
    <Fragment>

      <div className="project-cards flex flex-row flex-nowrap gap-4 pe-4 pb-4">
        {ordered && ordered.length > 0 &&
          <div className="sections-wrapper">
            <DragDropContext onDragEnd={(result) => onDragEnd(result)}>
              <Droppable
                droppableId="droppable"
                type="COLUMN"
                direction="horizontal"
              >
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="accordion-sortable flex items-stretch flex-nowrap gap-4 w-auto overflow-x-auto"
                  >
                    {ordered && ordered.length > 0 && ordered.map((taskListSection, index) => (
                      <Draggable key={taskListSection} draggableId={taskListSection} index={index}>
                        {(provided, snapshot) => (
                          <div
                            key={taskListSection}
                            className="flex-1 projects-card-content w-[310px]"
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                          >
                            <div {...provided.dragHandleProps}
                              className="project-section-title p-3 flex items-center justify-between bg-[#EBF1F4]">
                              <div className="flex gap-1 items-center">

                                <IconGripVertical
                                  size={20}
                                  stroke={1.25}
                                  className="mr-1 cursor-move" />
                                <TaskSectionName
                                  taskSectionId={taskListSections[taskListSection] && taskListSections[taskListSection].id}
                                  nameOfTaskSection={taskListSections[taskListSection] && taskListSections[taskListSection].name}
                                  view="cardView"
                                />
                              </div>

                              <div className="flex items-center justify-between cursor-pointer mr-[-5px]">
                                {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['create-task']) &&
                                  <AddTaskPopover projectId={id}
                                    taskSectionId={taskListSections[taskListSection] && taskListSections[taskListSection].id}
                                    openOnHotkey={index === 0 ? openAddTaskPopoverHotkey : false} // Only first section responds to hotkey  
                                  />
                                }
                                {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['create-manage-section', 'archive-section']) &&
                                  <SectionHeaderActions
                                    taskSection={taskListSections[taskListSection]}
                                    taskListSection={taskListSection}
                                  />
                                }
                              </div>

                            </div>
                            <div className="flex items-center"
                              style={{ height: 'calc(100% - 60px)', minHeight: '350px' }}>
                              <TaskBoardContent
                                className={snapshot.isDragging ? 'is-dragging' : ''}
                                listType="CONTENT"
                                snapshot={snapshot}
                                ref={provided.innerRef}
                                view="cardView"
                                taskSection={taskListSection}
                                contents={columns && columns && columns[taskListSection] ? columns[taskListSection] : []}
                              />
                            </div>
                          </div>
                        )}

                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

          </div>
        }
        {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['create-manage-section']) &&
          <div style={{ minHeight: '335px', maxHeight: '700px' }} className={`w-[280px] rounded-md border border-dashed border-1 border-[#ED7D31] text-center ${ordered && ordered.length > 3 ? 'flex-1' : ''}`}>
            <button
              className="px-4 py-1 w-full h-full coursor-pointer"
              onClick={handleAddSection}
            >
              <span className="text-lg font-bold text-[#ED7D31]"> + Add Section</span>
            </button>
          </div>
        }
      </div>


    </Fragment>
  );
};

export default TaskBoard;




