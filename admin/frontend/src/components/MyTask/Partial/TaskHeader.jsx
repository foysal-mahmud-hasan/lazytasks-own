import React, { useEffect } from 'react';
import { Text, Title } from '@mantine/core';
import { useSelector, useDispatch } from "react-redux";
import { fetchSettings } from "../../Settings/store/settingSlice";
import { translate } from '../../../utils/i18n';

const TaskHeader = () => {
  const dispatch = useDispatch();
  const { serialSettings } = useSelector((state) => state.settings.setting);

  useEffect(() => {
    if (!serialSettings) {
      dispatch(fetchSettings());
    }
  }, [dispatch]);


  return (
    <>
      <div className="border rounded-t-lg px-2 py-2 bg-[#39758D]">
        <div className="flex">
          {serialSettings && serialSettings.enabled && (
            <div className="text-base font-medium w-[6%] ml-3">
              <Text c={`#ffffff`} fz="md" fw={700}>{translate('Ref.#')}</Text>
            </div>
          )}
          <div className="text-base font-medium w-[25%]">
            <Text c={`#ffffff`} fz="md" fw={700}>{translate('Task Name')}</Text>
          </div>
          <div className="text-base font-medium w-[10%] flex">
            <Text c={`#ffffff`} fz="md" fw={700}>{translate('Assigned')}</Text>
          </div>
          <div className="text-base font-medium w-[12%] flex justify-center">
            <Text c={`#ffffff`} fz="md" fw={700}>{translate('Following')}</Text>
          </div>
          <div className="text-base font-medium w-[10%] flex justify-center">
            <Text c={`#ffffff`} fz="md" fw={700}>{translate('Due Date')}</Text>
          </div>
          <div className="text-base font-medium w-[8%] flex justify-center">
            <Text c={`#ffffff`} fz="md" fw={700}>{translate('Priority')}</Text>
          </div>
          <div className="text-base font-medium w-[8%] flex justify-center">
            <Text c={`#ffffff`} fz="md" fw={700}>{translate('Status')}</Text>
          </div>
          <div className="text-base font-medium w-[21%] flex">
            <Text c={`#ffffff`} fz="md" fw={700}>{translate('Tags')}</Text>
          </div>
        </div>
      </div>
    </>
  );
};

export default TaskHeader;
