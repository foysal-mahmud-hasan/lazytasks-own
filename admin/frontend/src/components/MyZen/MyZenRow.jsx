import React from 'react';
import {useDisclosure} from "@mantine/hooks";
import {Text} from "@mantine/core";
import MyZenEditButton from "./MyZenEditButton";
import dayjs from "dayjs";
const formatDate = (date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
};
const MyZenRow = ({ task }) => {

  return (
    <>
        <div className="flex single-task-content main-task items-center w-full">
            <div className="task-name w-[50%] pr-2 items-center">
                <div className="flex gap-2 items-center w-full">
                    <div className="w-full">
                        <Text> {task.name}</Text>
                    </div>
                </div>
            </div>
            <div className="date w-[20%] pr-2">
                <Text> { task.end_date && formatDate(new Date(task.end_date))}</Text>
            </div>
            <div className="startTime w-[10%] items-center">
                <Text> {task.start_time && dayjs(task.start_date_time).format("h:mm A")}</Text>
            </div>
            <div className="endTime w-[10%]">
                <Text> { task.end_date_time && dayjs(task.end_date_time).format("h:mm A")}</Text>
            </div>
            <div className="action w-[10%]">
                <MyZenEditButton task={task && task} taskId={task && task.id} />
            </div>
        </div>


    </>

    
  );
};

export default MyZenRow;
