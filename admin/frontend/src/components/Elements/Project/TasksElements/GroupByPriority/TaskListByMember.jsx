import React, { useState, useEffect, Fragment, useRef } from 'react';
import {
  Accordion,
  Text,
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
} from "../../../../Settings/store/taskSlice";
import TaskSectionName from "../Task/TaskSectionName";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import { reorder, reorderQuoteMap } from "../utils";
import { hasPermission } from "../../../../ui/permissions";
import { updateInputFieldFocus } from "../../../../../store/base/commonSlice";
import { useHotkeys } from '@mantine/hooks';
import { translate } from '../../../../../utils/i18n';
import TaskListMemberItem from './TaskListMemberItem';

const TaskListByMember = () => {
  const theme = useMantineTheme();
  // const tasks = useSelector(state => state.task);
  const dispatch = useDispatch();
  const { loggedUserId } = useSelector((state) => state.auth.user)
  const { loggedInUser } = useSelector((state) => state.auth.session)

  const { projectInfo, tasks, columns, ordered, taskListSections, boardMembers, childColumns, isLoading, taskEditDrawerOpen, task, accordianExpandedItems } = useSelector((state) => state.settings.task);
  const contentEditableRef = useRef('');

  const [expandedItems, setExpandedItems] = useState([]); // Initialize with an empty array
  const loadedSectionsRef = useRef({});
  // console.log(expandedItems, ordered)
  const [accordionItems, setAccordionItems] = useState([]);
  useEffect(() => {
    if (boardMembers) {
      const transformedItems = Object.entries(boardMembers).map(([key, value]) => ({
        value: value.id,
        title: value.name,
      }));
      const noAssignedItem = { value: 'no-assigned', title: 'Unassigned' };
      const allItems = [...transformedItems, noAssignedItem];
      setAccordionItems(allItems);
      // Set all accordion items as expanded by default
      const defaultExpandedItems = allItems.map(item => item.value);
      setExpandedItems(defaultExpandedItems);
      dispatch(updateExpandedItems(defaultExpandedItems));
    }

  }, [boardMembers]);

  const memberWithNoAssigned = [
    ...boardMembers,
    { id: 'no-assigned', name: 'Unassigned' },
  ];

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
        value={expandedItems}
        onChange={setExpandedItems}
        // value={accordianExpandedItems}
        // onChange={(items) => dispatch(updateExpandedItems(items))}
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

                {memberWithNoAssigned && memberWithNoAssigned.length > 0 && memberWithNoAssigned.map((member, index) => (

                  <Draggable key={member} draggableId={member.id.toString()} index={index} isDragDisabled={true}>
                    {(provided, snapshot) => (
                      <TaskListMemberItem
                        member={member}
                        index={index}
                        projectInfo={projectInfo}
                        boardMembers={memberWithNoAssigned}
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
      {/* {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['create-manage-section']) &&
        <button
          className="rounded-md border border-dashed border-[#ED7D31] px-4 py-1 mt-4 w-full"
          onClick={handleAddSection}
        >
          <span className="text-lg font-bold text-[#ED7D31]">{translate('+ Add Section')}</span>
        </button>
      } */}



    </Fragment>
  );
};

export default TaskListByMember;
