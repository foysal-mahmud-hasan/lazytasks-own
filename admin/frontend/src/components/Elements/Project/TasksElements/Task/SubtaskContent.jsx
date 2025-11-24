
import React, { useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import TaskName from './TaskName';
import TaskAssignTo from './TaskAssignTo';
import TaskFollower from './TaskFollower';
import TaskDueDate from './TaskDueDate';
import TaskPriority from './TaskPriority';
import TaskStatus from './TaskStatus';
import TaskTag from './TaskTag';
import { Grid, } from "@mantine/core";
import { convertTask, openTaskEditDrawer, setEditableTask } from "../../../../Settings/store/taskSlice";
import TaskActionsMenu from './TaskActionsMenu';
import { translate } from '../../../../../utils/i18n';
import TaskSerial from './TaskSerial';

const SubtaskContent = ({ taskData, subtask, view }) => {
  const dispatch = useDispatch();
  const { taskEditDrawerOpen } = useSelector((state) => state.settings.task);
  const { loggedUserId } = useSelector((state) => state.auth.user);
  const { loggedInUser } = useSelector((state) => state.auth.session);

  const isCompleted = subtask && subtask.status === 'COMPLETED';

  const handleEditSubTaskDrawerOpen = () => {
    if (!taskEditDrawerOpen) {
      dispatch(openTaskEditDrawer());
    }
    dispatch(setEditableTask(subtask && subtask));
  };

  return (
    <>

      {view === 'cardView' ? (
        <div onClick={() => { handleEditSubTaskDrawerOpen() }} className="sabtask mb-2" >
          <div className="flex single-task-content sub-task items-center gap-2 justify-between">
            <TaskName task={subtask && subtask} taskId={subtask && subtask.id} view='cardView' isSubtask nameOfTask={subtask && subtask.name ? subtask.name : "Untitled Subtask"} />
            <div className="flex items-center gap-2">
              <TaskDueDate
                taskId={subtask && subtask.id}
                startDate={subtask && subtask.start_date ? subtask.start_date : null}
                dueDate={subtask && subtask.end_date ? subtask.end_date : null}
                startDateIsVisible={subtask && subtask.start_date_is_visible}
                dueDateIsVisible={subtask && subtask.end_date_is_visible}
              />
              <TaskAssignTo
                taskId={subtask && subtask.id}
                view='cardView'
                assigned={subtask && subtask.assigned_to ? subtask.assigned_to : null}
                assignedMember={(props) => {
                  console.log('')
                }} />
            </div>
          </div>
        </div>

      ) : (

        <div onClick={() => { handleEditSubTaskDrawerOpen() }} className="sabtask pl-[5px]"
          style={{ background: subtask && subtask.status == 'COMPLETED' ? '#c9f7d6' : '', padding: '2px' }}
        >
          <div className="single-task-content sub-task py-1.5">
            <Grid columns={24}>
              {taskData && taskData.is_serial_enable ? (
                <Grid.Col className={`flex items-center w-full !py-0 !pl-0`} span={1.5}>
                  <TaskSerial task={taskData && taskData} subtask={subtask && subtask} taskId={subtask && subtask.id} isSubtask />
                </Grid.Col>
              ) : (
                <Grid.Col span={0.5}></Grid.Col>
              )}

              <Grid.Col className={`flex items-center w-full !py-0 !pl-0`} span={5.2}>
                <div className="flex items-center w-full">
                  <TaskName task={subtask && subtask} taskId={subtask && subtask.id} isSubtask nameOfTask={subtask && subtask.name ? subtask.name : "Untitled Subtask"} disabled={isCompleted} />
                </div>
              </Grid.Col>
              <Grid.Col className={`flex items-center w-full !py-0 !pl-0`} span={0.8}></Grid.Col>
              <Grid.Col className={`assign-to flex items-center w-full !py-0 !ml-[-3px]`} span={2.5}>
                <div onClick={(e) => e.stopPropagation()}>
                  <TaskAssignTo
                    taskId={subtask && subtask.id}
                    assigned={subtask && subtask.assigned_to ? subtask.assigned_to : null}
                    assignedMember={(props) => {
                      console.log('')
                    }}
                    disabled={isCompleted}
                  />
                </div>
              </Grid.Col>
              {/* <Grid.Col className={`flex items-center w-full !py-0 !pl-0`} span={0.6}></Grid.Col> */}
              <Grid.Col className={`following flex items-center justify-center !py-0 !ml-[5px]`} span={2.2}>
                <div onClick={(e) => e.stopPropagation()} >
                  <TaskFollower taskId={subtask && subtask.id} followers={subtask && subtask.members ? subtask.members : null} editHandler={(props) => {
                    console.log('')
                  }} disabled={isCompleted} />
                </div>
              </Grid.Col>
              <Grid.Col className={`due-date flex items-center w-full !py-0`} span={2}>
                <div className={`w-full`} onClick={(e) => e.stopPropagation()} >
                  <div className={`w-full flex items-start justify-center ml-3`}>
                    <TaskDueDate
                      taskId={subtask && subtask.id}
                      startDate={subtask && subtask.start_date ? subtask.start_date : null}
                      dueDate={subtask && subtask.end_date ? subtask.end_date : null}
                      startDateIsVisible={subtask && subtask.start_date_is_visible}
                      dueDateIsVisible={subtask && subtask.end_date_is_visible}
                      disabled={isCompleted}
                    />
                  </div>
                </div>
              </Grid.Col>
              <Grid.Col className={`priority flex items-center w-full !py-0`} span={2}>
                <div className="pl-1 w-full flex justify-center" onClick={(e) => e.stopPropagation()}>
                  <TaskPriority taskId={subtask && subtask.id} priority={subtask && subtask.priority ? subtask.priority : null} disabled={isCompleted} />
                </div>
              </Grid.Col>
              <Grid.Col className={`priority flex items-center w-full !py-0`} span={2}>
                <div className="pl-1 w-full flex justify-center" onClick={(e) => e.stopPropagation()}>
                  <TaskStatus taskId={subtask && subtask.id} status={subtask && subtask.internal_status ? subtask.internal_status : null} disabled={isCompleted} />
                </div>
              </Grid.Col>
              <Grid.Col className={`tags flex items-center w-full !py-0 !pl-10`} span={4.8}>
                <div className={`w-full flex items-center`} onClick={(e) => e.stopPropagation()}>
                  <TaskTag taskId={subtask && subtask.id} taskTags={subtask && subtask.tags ? subtask.tags : null} disabled={isCompleted} />
                </div>
              </Grid.Col>
              {taskData && !taskData.is_serial_enable && (
                <Grid.Col span={1}></Grid.Col>
              )}
              <Grid.Col className={`w-full flex items-center cursor-pointer justify-end ${!taskData.is_serial_enable ?? 'ml-6'}`} span={0.5} onClick={(e) => e.stopPropagation()}>
                <TaskActionsMenu actions={['view', 'convert', 'subtask-complete', 'ganttTask', 'delete']} isSubtask taskData={subtask && subtask} />
              </Grid.Col>

            </Grid>

          </div>
        </div>

      )}

    </>
  );
};

export default SubtaskContent;
