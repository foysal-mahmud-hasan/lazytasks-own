import React, { useState, useEffect, Fragment, useRef } from 'react';
import { Accordion, LoadingOverlay, ScrollArea, Tabs, Text } from '@mantine/core';
import { useSelector, useDispatch } from 'react-redux';
import { IconGripVertical } from "@tabler/icons-react";
import MyTaskListContent from "./MyTaskListContent";
import { fetchTasksByUser, updateColumns } from "../Settings/store/myTaskSlice";
import TaskHeader from "./Partial/TaskHeader";
import { updateIsLoading } from "../Settings/store/taskSlice";
import { fetchSettings } from "../Settings/store/settingSlice";
import { translate } from '../../utils/i18n';

const MyTaskList = () => {
  const dispatch = useDispatch();

  const { loggedUserId } = useSelector((state) => state.auth.user)
  const { userTaskOrdered, userTaskListSections, userTaskColumns, allTasks } = useSelector((state) => state.settings.myTask);
  const { isLoading } = useSelector((state) => state.settings.task);
  const contentEditableRef = useRef('');
  const [expandedItems, setExpandedItems] = useState([]); // Initialize with an empty array
  const [accordionItems, setAccordionItems] = useState([]);

  const { serialSettings } = useSelector((state) => state.settings.setting);

  useEffect(() => {
    if (!serialSettings) {
      dispatch(fetchSettings());
    }
  }, [dispatch]);

  useEffect(() => {
    if (userTaskListSections) {
      const transformedItems = Object.entries(userTaskListSections).map(([key, value]) => ({
        value: key,
        title: value,
      })
      );
      setAccordionItems(transformedItems);
      // Set all accordion items as expanded
      setExpandedItems(transformedItems.map(item => item.value));
    }
  }, [userTaskOrdered]);

  useEffect(() => {
    // dispatch(updateColumns(userTaskColumns))
  }, [userTaskColumns]);

  const changeTabHandler = (value) => {
    if (value === "all") {
      dispatch(updateIsLoading(true));
      setTimeout(() => {
        dispatch(updateIsLoading(false));
      }, 1000);
    } else {
      dispatch(updateIsLoading(true));
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (loggedUserId && isLoading === true) {
          await dispatch(fetchTasksByUser({ id: loggedUserId })).then((response) => {
            // setVisible(false);
            if (response.payload.state === 200) {
              // dispatch(updateColumns(response.payload.data && response.payload.data.tasks ? response.payload.data.tasks : {}))
            }
          })
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        dispatch(updateIsLoading(false))
      }
    };
    fetchData();
  }, [isLoading]);


  return (
    <Fragment>
      <Tabs variant="pills" radius="sm" defaultValue="all" onTabChange={(value) => changeTabHandler(value)}
        className='my-tabs'
        styles={{
          tab: { color: '#202020', backgroundColor: '#F5F8F9' },
        }}
      >
        <Tabs.List className="mb-3">
          {/*<Tabs.Tab value="all" className="font-bold">
            All
          </Tabs.Tab>*/}
          {userTaskOrdered && userTaskOrdered.length > 0 && userTaskOrdered.map((taskListSection, index) => (
            <Tabs.Tab value={taskListSection} className="font-bold" onClick={() => changeTabHandler(true)}>
              {translate(userTaskListSections && userTaskListSections[taskListSection] && userTaskListSections[taskListSection])}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        {userTaskOrdered && userTaskOrdered.length > 0 ? (
          <>
            {userTaskOrdered.map((taskListSection, index) => (
              <Tabs.Panel key={index} value={taskListSection}>
                <TaskHeader />
                <ScrollArea className="h-[calc(100vh-300px)] p-[3px]" scrollbarSize={4}>
                  <LoadingOverlay
                    visible={isLoading}
                    zIndex={1000}
                    overlayProps={{ radius: 'sm', blur: 4 }}
                  />
                  <MyTaskListContent
                    contents={userTaskColumns && userTaskColumns[taskListSection] ? userTaskColumns[taskListSection] : []}
                  />
                </ScrollArea>
              </Tabs.Panel>
            ))}
          </>
        ) : (
          <div className="text-center">{translate('No Task Found')}</div>
        )}

      </Tabs>

    </Fragment>
  );
};

export default MyTaskList;
