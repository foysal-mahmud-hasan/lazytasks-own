import { useState, useEffect, Fragment } from 'react';
import React from 'react';
import TaskContent from './Task/TaskContent';
import { useDispatch, useSelector } from 'react-redux';
import { Draggable, Droppable } from "react-beautiful-dnd";
import { ScrollArea,Loader } from '@mantine/core';
import { useInView } from 'react-intersection-observer';
import { fetchTasksBySection } from '../../../Settings/store/taskSlice';

const TaskBoardContent = ({ listType, view, taskSection, projectId, taskSectionId, contents }) => {
  const dispatch = useDispatch();
  // const sectionTasks = contents;
  const [tasks, setTasks] = useState(contents || []);
  const { loggedUserId } = useSelector((state) => state.auth.user);
  const { loggedInUser } = useSelector((state) => state.auth.session);
  const userId = loggedInUser ? loggedInUser.loggedUserId : loggedUserId;
  const { projectInfo, childColumns, loadingSections, loadedSections } = useSelector(state => state.settings.task);
  const isLoading = loadingSections?.[taskSection];
  const { ref, inView } = useInView({ triggerOnce: false });

  // console.log(sectionTasks)
  useEffect(() => {
    setTasks(contents || []);
  }, [contents]);

  useEffect(() => {
    if (
      inView &&
      !isLoading &&
      loadedSections?.[taskSection]?.hasMore
    ) {
      const offset = loadedSections[taskSection]?.offset || 0;
      dispatch(fetchTasksBySection({
        projectId: projectInfo.id,
        sectionSlug: taskSection,
        limit: 15,
        offset,
        append: true,
        userId: userId
      }));
    }
  }, [inView]);

  return (
    <Fragment>
      <div className='w-full'>
        <ScrollArea className={`${appLocalizer?.is_admin ? 'h-[calc(100vh-370px)]' : 'h-[calc(100vh-320px)]'} pb-[2px]`} scrollHideDelay="100" scrollbarSize={1}>
          <Droppable
            key={taskSection}
            droppableId={taskSection}
            type={listType}
          >
            {(dropProvided, snapshot) => (
              <div
                style={{ transition: 'background-color 0.3s ease', minHeight: '100px' }}
                className="flex-1 w-full h-full"
                ref={dropProvided.innerRef}
                {...dropProvided.droppableProps}
              >
                {tasks && tasks.length > 0 ? (tasks.map((task, taskIndex) => (
                  <Draggable
                    key={task.id}
                    draggableId={task.id.toString()}
                    index={taskIndex}
                  >
                    {(dragProvided, snapshot) => {
                      const isDragging = snapshot.isDragging;

                      return (
                        <div
                          key={taskIndex}
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          {...dragProvided.dragHandleProps}
                          className={`my-2 single-task ${snapshot.isDragging ? 'z-50' : ''
                            }`}
                          style={{
                            ...dragProvided.draggableProps.style,
                            transform: snapshot.isDragging
                              ? `${dragProvided.draggableProps.style?.transform} rotate(-5deg) scale(1.05)`
                              : dragProvided.draggableProps.style?.transform,
                            boxShadow: snapshot.isDragging
                              ? '0 6px 12px rgba(0, 0, 0, 0.15)'
                              : 'none',
                            transition: 'transform 0.1s ease, box-shadow 0.2s ease',
                            borderRadius: '12px',
                            backgroundColor: snapshot.isDragging ? '#EBF1F4' : '#fff',
                          }}
                        >
                          <TaskContent
                            view="cardView"
                            taskSection={taskSection}
                            taskData={task}
                          />
                        </div>
                      );
                    }}
                  </Draggable>

                ))
                ) : (
                  // Add empty state placeholder to help with dropping
                  <div className="h-full w-full flex items-center justify-center text-gray-400">

                  </div>
                )}
                {dropProvided.placeholder}
                {/* Infinite Scroll Loader */}
                {loadedSections?.[taskSection]?.hasMore && (
                  <div ref={ref} className="py-3 flex justify-center">
                    <Loader type="dots" size="sm" />
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </ScrollArea>
      </div>
    </Fragment>
  );
};

export default TaskBoardContent;
