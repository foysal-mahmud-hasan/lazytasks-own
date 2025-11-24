import React, { useState, useEffect, useRef, Fragment } from 'react';
import TaskContent from '../Task/TaskContent';
import { useSelector, useDispatch } from 'react-redux';
import { Draggable, Droppable } from 'react-beautiful-dnd';
import { Button } from '@mantine/core';
import { fetchTasksByPriority, fetchTasksBySection } from '../../../../Settings/store/taskSlice';
import { translate } from '../../../../../utils/i18n';

const TaskListContentByPriority = ({ listType, view, priority, projectId, priorityId, contents }) => {
  const dispatch = useDispatch();
  const [tasks, setTasks] = useState(contents || []);
  const loadMoreRef = useRef(null);

  const { loggedUserId } = useSelector((state) => state.auth.user);
  const { loggedInUser } = useSelector((state) => state.auth.session);
  const userId = loggedInUser ? loggedInUser.loggedUserId : loggedUserId;
  const { loadingPriority, loadedPriority, buttonLoadingPriority } = useSelector(state => state.settings.task);

  const key = priority?.slug === 'no-priority' ? 'no-priority' : priority?.slug;
  const offset = loadedPriority?.[key]?.offset || 0;
  const hasMore = loadedPriority?.[key]?.hasMore !== false;
  const isLoading = loadingPriority?.[key] || false;
  const isButtonLoading = buttonLoadingPriority?.[key] || false;

  useEffect(() => {
    setTasks(contents || []);
  }, [contents]);

  const handleLoadMore = () => {
    if (priority.id === 'no-priority') {
      dispatch(fetchTasksByPriority({
        projectId,
        priorityId: null,
        prioritySlug: 'no-priority',
        limit: 15,
        offset,
        append: true,
        userId: userId,
      })).then(() => {
        setTimeout(() => {
          loadMoreRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150); // Delay ensures new tasks are rendered first
      });
    } else {
      dispatch(fetchTasksByPriority({
        projectId,
        priorityId: priorityId,
        prioritySlug: priority.slug,
        limit: 15,
        offset,
        append: true,
        userId: userId
      })).then(() => {
        setTimeout(() => {
          loadMoreRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150); // Delay ensures new tasks are rendered first
      });
    }
  };

  return (
    <Fragment>
      <Droppable key={priorityId} droppableId={priorityId} type={listType}>
        {(dropProvided, snapshot) => (
          <div
            ref={dropProvided.innerRef}
            {...dropProvided.droppableProps}
            style={{ transition: 'background-color 0.3s ease' }}
            className={`w-full h-full min-h-[25px] !px-[5px] ${tasks && tasks.length === 0 ? 'border-b border-gray-200' : ''}`}
          >
            {tasks && tasks.length > 0 ? (
              tasks.map((task, taskIndex) => (
                task?.id && task?.id !== 'undefined' && (
                  <Draggable key={task.id} draggableId={task.id.toString()} index={taskIndex} isDragDisabled={true}>
                    {(dragProvided, dragSnapshot) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        {...dragProvided.dragHandleProps}
                        className={`mb-0 mt-0 single-task ${dragSnapshot.isDragging ? 'z-50' : ''}`}
                        style={{
                          ...dragProvided.draggableProps.style,
                          backgroundColor: dragSnapshot.isDragging ? '#EBF1F4' : '#ffffff',
                          transition: 'all 0.1s ease-in-out',
                          cursor: dragSnapshot.isDragging ? 'grabbing' : 'grab',
                          opacity: dragSnapshot.isDragging ? 0.9 : 1,
                          transform: snapshot.isDragging
                            ? `${dragProvided.draggableProps.style?.transform} rotate(-10deg) scale(1.10)`
                            : dragProvided.draggableProps.style?.transform,
                          boxShadow: snapshot.isDragging
                            ? '0 6px 12px rgba(0, 0, 0, 0.15)'
                            : 'none',
                          userSelect: 'none',
                          border: dragSnapshot.isDragging ? '1px solid #E5E5E5' : 'none',
                        }}
                      >
                        <TaskContent view={view} taskData={task} />
                      </div>
                    )}
                  </Draggable>
                )
              ))
            ) : (
              <div className="text-center text-gray-500 py-4">{translate('No Task Found')}</div>
            )}

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center mt-2 mb-2">
                <Button
                  ref={loadMoreRef}
                  onClick={handleLoadMore}
                  loading={isButtonLoading}
                  loaderProps={{ type: 'dots' }}
                  disabled={isButtonLoading}
                  size="xs"
                  variant="filled"
                  color="#ED7D31"
                  className="font-semibold"
                >
                  {translate('Load More')}
                </Button>
              </div>
            )}

            {dropProvided.placeholder}
          </div>
        )}
      </Droppable>
    </Fragment>
  );
};

export default TaskListContentByPriority;
