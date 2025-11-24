import { IconCheck, IconChevronDown, IconMinus } from '@tabler/icons-react';
import React, {useState, useRef, useEffect, Fragment} from 'react';
import {useDispatch, useSelector} from "react-redux";
const Status = ({ editStatusHandler, projectStatuses, status}) => {
  const dispatch = useDispatch();
  const [statuses, setStatuses] = useState(['Active', 'In Progress', 'Complete']);
  const [newStatus, setNewStatus] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(status ? status.name : '');
  const [selectedStatusName, setSelectedStatusName] = useState(status ? status.name : '');
  const [selectedStatusColor, setSelectedStatusColor] = useState(status && status.color_code ? status.color_code : '#000000');
  const [showStatusList, setShowStatusList] = useState(false);
  const [showStatusAddInput, setShowStatusAddInput] = useState(false);
  const selectStatusRef = useRef(null);

  useEffect(() => {
    setSelectedStatus(status ? status.id : '');
    setSelectedStatusName(status ? status.name : '');
    setSelectedStatusColor(status && status.color_code ? status.color_code : '#000000')
  }, [status]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectStatusRef.current && !selectStatusRef.current.contains(event.target)) {
        setShowStatusList(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleStatusListShow = () => {
    setShowStatusList(true);
  };

  const handleSelectStatus = (status) => {
    if(status){
      editStatusHandler(status);
    }
    setSelectedStatus(status ? status.id : '');
    setSelectedStatusName(status ? status.name : '');
    setSelectedStatusColor(status && status.color_code ? status.color_code : '#000000')
    setShowStatusAddInput(false);
    setShowStatusList(false);
  };

  return (
    <Fragment>
      <div className="priority-wrapper" style={{zIndex: 100}}>
        <div className="priority-btn cursor-pointer inline-flex" onClick={handleStatusListShow}>
          {!selectedStatus ? (
              <div className="px-1 py-1 items-center gap-2 inline-flex min-w-25 h-[22px] border border-[#EBF1F4] rounded-[25px] bg-[#EBF1F4]">
                <IconMinus color="#4d4d4d" size="22" />
                <IconChevronDown color="#4d4d4d" size="22" />
              </div>
          ) : (
              <div style={{ backgroundColor: selectedStatusColor }} className="flex px-2 py-0 rounded-[25px] items-center gap-2">
                {/*<Text c="white" size="sm" fw={400}>{selectedPriorityName}</Text>*/}
                <div className="text-white text-[14px]">{selectedStatusName}</div>
                <IconChevronDown color="#ffffff" size="22"/>
              </div>
          )}
        </div>

        {showStatusList && (
          <div ref={selectStatusRef} className="selectpriority-list border rounded-lg bg-white shadow p-2 absolute min-w-[250px]">
            {projectStatuses && projectStatuses.length>0 &&  projectStatuses.map((status, index) => (
              <span
                className={`flex items-center w-full cursor-pointer text-[12px] p-1 ${
                  selectedStatus === status.id ? 'bg-[#ebf1f4]' : 'hover:bg-[#ebf1f4]'
                }`}
                key={index}
                onClick={() => handleSelectStatus(status)}
              >
                {selectedStatus === status.id ? <IconCheck size="14" /> : null} {status.name}
              </span>
            ))}

          </div>
        )}
      </div>
    </Fragment>
  );
};

export default Status;
