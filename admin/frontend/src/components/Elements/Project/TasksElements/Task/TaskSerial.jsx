import React, { Fragment } from 'react';
import { Pill } from '@mantine/core';
const TaskSerial = ({ task, subtask, taskId, isSubtask, view }) => {

    const formatSerialNumber = (number) => {
        if (number !== null && number !== undefined) {
            return number.toString().padStart(4, '0');
        }
        return '';
    };

    const getDisplaySerialNumber = () => {
        if (isSubtask && task.task_serial_no && subtask.task_serial_no) {
            // Combine parent serial number and subtask serial number
            return `${task.task_serial_no}.${subtask.task_serial_no}`;
        } else if (task.task_serial_no) {
            // Display the task's serial number
            return formatSerialNumber(task.task_serial_no);
        }
        return '';
    };

    return (
        <Fragment>
            <div className={`flex items-center gap-1 w-full pl-5`}>
                {getDisplaySerialNumber() && (
                    <Pill className="!bg-[#EBF1F4] !color-[#4d4d4d] !px-2 text-base">{getDisplaySerialNumber()}</Pill>
                )}
            </div>
        </Fragment>
    );
};

export default TaskSerial;
