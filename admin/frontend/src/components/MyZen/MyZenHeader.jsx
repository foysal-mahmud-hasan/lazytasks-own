import React from 'react';
import {Text, Title} from '@mantine/core';

const MyZenHeader = () => {


  return (
      <div className="border rounded-lg mt-1 px-2 py-1 bg-blue-100">
        <div className="flex">
          <div className="text-base font-medium w-[50%]">
            <Text fz="sm">Task Name</Text>
          </div>
          <div className="text-base font-medium w-[20%]">
            <Text fz="sm">Date</Text>
          </div>
          <div className="text-base font-medium w-[10%]">
            <Text fz="sm">Start Time</Text>
          </div>
          <div className="text-base font-medium w-[10%]">
            <Text fz="sm">End Time</Text>
          </div>
          <div className="text-base font-medium w-[10%]">

          </div>
        </div>
      </div>
  );
};

export default MyZenHeader;
