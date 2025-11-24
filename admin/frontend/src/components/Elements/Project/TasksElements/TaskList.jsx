import React, { useState, useEffect, Fragment, useRef } from 'react';
import {
  Accordion,
  useMantineTheme,
} from '@mantine/core';
import {
  IconChevronDown
} from '@tabler/icons-react';
import { useSelector, useDispatch } from 'react-redux';
import {
  createTaskSection, deleteTaskSection,
  editSectionSortOrder, editTaskSortOrder,
  updateChildColumns, updateColumns,
  updateOrdered, openAddTaskDrawer, fetchTasksBySection,
  updateExpandedItems
} from "../../../Settings/store/taskSlice";
import TaskSectionName from "./Task/TaskSectionName";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import { reorder, reorderQuoteMap } from "./utils";
import TaskListContent from "./TaskListContent";
import SectionHeaderActions from "./SectionHeaderActions";
import { hasPermission } from "../../../ui/permissions";
import { updateInputFieldFocus } from "../../../../store/base/commonSlice";
import { useHotkeys } from '@mantine/hooks';
import TaskListSectionItem from './TaskListSectionItem';
import { translate } from '../../../../utils/i18n';

const TaskList = () => {
  const theme = useMantineTheme();
  // const tasks = useSelector(state => state.task);
  const dispatch = useDispatch();
  const { loggedUserId } = useSelector((state) => state.auth.user)
  const { loggedInUser } = useSelector((state) => state.auth.session)

  const { projectInfo, tasks, columns, ordered, taskListSections, childColumns, isLoading, taskEditDrawerOpen, task, accordianExpandedItems } = useSelector((state) => state.settings.task);
  const contentEditableRef = useRef('');

  const [expandedItems, setExpandedItems] = useState([]); // Initialize with an empty array
  const loadedSectionsRef = useRef({});
  // console.log(expandedItems, ordered)
  const [accordionItems, setAccordionItems] = useState([]);
  useEffect(() => {
    if (tasks && taskListSections) {
      const transformedItems = Object.entries(taskListSections).map(([key, value]) => ({
        value: key,
        title: value.name,
      })
      );
      setAccordionItems(transformedItems);
      // Set all accordion items as expanded
      setExpandedItems(transformedItems.map(item => item.value));
      dispatch(updateExpandedItems(transformedItems.map((item) => item.value)));
    }

  }, [taskListSections, ordered]);

  const handleAddSection = () => {
    const newItemValue = `untitle-section-${accordionItems.length + 1}`;
    const newItem = {
      value: newItemValue,
      title: `Type section name here`,
    };
    setAccordionItems([...accordionItems, newItem]);
    setExpandedItems([...expandedItems, newItemValue]);
    dispatch(updateExpandedItems([...expandedItems, newItemValue]));

    const newSection = {
      name: 'Type section name here',
      project_id: projectInfo.id,
      sort_order: ordered.length + 1,
      created_by: loggedInUser ? loggedInUser.loggedUserId : loggedUserId
    }

    dispatch(createTaskSection(newSection))
    dispatch(updateInputFieldFocus(true));
  };

  const onDragEnd = (result) => {
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
        project_id: projectInfo.id,
        updated_by: loggedInUser ? loggedInUser.loggedUserId : loggedUserId
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
        updated_by: loggedInUser ? loggedInUser.loggedUserId : loggedUserId
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
      updated_by: loggedInUser ? loggedInUser.loggedUserId : loggedUserId
    }

    dispatch(editTaskSortOrder({ data: submittedData }))
    dispatch(updateColumns(updateColumnData))
  };

  useHotkeys([
    ['alt+n', () => {
      // Open Add Task Drawer for the first section (customize as needed)
      if (projectInfo && ordered && ordered.length > 0) {
        const firstSectionId = taskListSections[ordered[0]].id;
        handleAddTaskDrawerOpen(projectInfo.id, firstSectionId);
      }
    }]
  ]);

  const handleAddTaskDrawerOpen = (project_id, task_section_id) => {
    console.log(project_id, projectInfo, task_section_id);
    dispatch(openAddTaskDrawer({ projectId: project_id, sectionId: task_section_id }));
  };

  // Add these styles to make the accordion headers sticky
  const stickyHeaderStyles = {
    position: 'sticky',
    top: 0,
    zIndex: 10,
    backgroundColor: '#EBF1F4',
    width: '100%'
  };


  return (
    <Fragment>

      <Accordion
        variant="separated"
        multiple={true}
        // value={expandedItems}
        // onChange={setExpandedItems}
        value={accordianExpandedItems}
        onChange={(items) => dispatch(updateExpandedItems(items))}
        chevron={<IconChevronDown size={30} stroke={2} />}
        classNames={{
          control: '!w-[18px] !pl-0 !pr-2',
          content: '!pb-0 !pt-0 !px-0',
        }}

      >

        <DragDropContext onDragEnd={(result) => onDragEnd(result)}>
          <Droppable
            droppableId="droppable"
            type="COLUMN"
          >
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>

                {ordered && ordered.length > 0 && ordered.map((taskListSection, index) => (

                  <Draggable key={taskListSection} draggableId={taskListSection} index={index}>
                    {(provided, snapshot) => (
                      <TaskListSectionItem
                        taskListSection={taskListSection}
                        index={index}
                        projectInfo={projectInfo}
                        taskListSections={taskListSections}
                        columns={columns}
                        snapshot={snapshot}
                        provided={provided}
                      />
                    )}
                  </Draggable>

                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </Accordion>
      {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['create-manage-section']) &&
        <button
          className="rounded-md border border-dashed border-[#ED7D31] px-4 py-1 mt-4 w-full"
          onClick={handleAddSection}
        >
          <span className="text-lg font-bold text-[#ED7D31]">{translate('+ Add Section')}</span>
        </button>
      }



    </Fragment>
  );
};

export default TaskList;
