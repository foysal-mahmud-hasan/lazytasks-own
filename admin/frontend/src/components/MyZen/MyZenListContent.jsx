import {useState, useEffect, Fragment} from 'react';
import React from 'react';
import MyZenRow from "./MyZenRow";
import {useSelector} from "react-redux";

const MyZenListContent = ({ contents }) => {
  // const sectionTasks = contents;
  const [tasks, setTasks] = useState([]);
    const {userTaskChildColumns} = useSelector((state) => state.settings.myTask);
  useEffect(() => {
    if (Array.isArray(contents)) {
      setTasks([...contents]);
    } else {
      setTasks([]);
    }
  }, [contents]);

  return (
      <Fragment>

        <div
            style={{transition: 'background-color 0.3s ease'}}
            className="w-full h-full min-h-[25px] px-2">
          {tasks && tasks.length>0 && tasks.map((task, taskIndex) => (
              <div
                  key={taskIndex}
                  className='relative w-full items-center py-1.5'
              >
                  <MyZenRow task={task} />
              </div>

          ))
          }
        </div>

      </Fragment>
  );
};

export default MyZenListContent;
