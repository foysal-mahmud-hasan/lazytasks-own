import React, { useState, useRef, useEffect } from 'react';
import { DatePicker } from '@mantine/dates';
import { IconCalendarEvent } from '@tabler/icons-react';
import { Button, Checkbox, Grid, Group, Popover, Text, TextInput, Title, Tooltip } from "@mantine/core";
import { useDispatch, useSelector } from "react-redux";
import { editTask } from "../../../../Settings/store/taskSlice";
import dayjs from "dayjs";
import { translate } from '../../../../../utils/i18n';

const formatDate = (date) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const dbdateFormate = (date) => {
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  let formattedDate = new Date(date).toLocaleDateString('en-US', options);

  // Remove the comma after the day
  formattedDate = formattedDate.replace(',', '');

  const [month, day, year] = formattedDate.split(' ');
  return `${day}-${month}-${year}`;
};




// const inputDate = new Date("2024-02-05");
// const options = { day: 'numeric', month: 'short', year: 'numeric' };
// const formattedDate = inputDate.toLocaleDateString('en-US', options);

// console.log(formattedDate); // Output: 5-Feb-2024


const DueDate = ({ editHandler, dueDate, startDate, startDateIsVisible, dueDateIsVisible }) => {
  const dispatch = useDispatch();

  const [selectedDates, setSelectedDates] = useState([]);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const calendarRef = useRef(null);
  const { loggedUserId } = useSelector((state) => state.auth.user);
  const { loggedInUser } = useSelector((state) => state.auth.session);
  const [startDateDefaultCheck, setStartDateDefaultCheck] = useState(false);
  const [dueDateDefaultCheck, setDueDateDefaultCheck] = useState(true);

  const current = dueDate ? new Date(dueDate) : new Date();
  let yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  // if ( startDate ){
  //   yesterday = new Date(startDate);
  // }

  const [selectedValue, setSelectedValue] = useState([yesterday, current]);

  useEffect(() => {
    if (dueDate) {
      setSelectedDates([new Date(dueDate)]);
      setSelectedValue([yesterday, current]);
    }
  }, [dueDate]);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // const handleSelect = (date) => {
  //   editHandler(date);
  //   setSelectedDates(date);
  //   setCalendarVisible(false); // Hide calendar after selecting a date 

  // };

  useEffect(() => {
    if (dueDate) {
      setSelectedDates([new Date(dueDate)]);
    }
  }, [dueDate]);

  const handleSelect = (date) => {
    const isSelected = selectedDates.some((selectedDate) => dayjs(date).isSame(selectedDate, 'date'));

    if (isSelected) {
      setSelectedDates([]);
      editHandler(null);
    } else {
      setSelectedDates([date]);
      editHandler(date);
    }

    setCalendarVisible(false);
  };

  const handleSave = () => {
    const dateData = {
      dates: startDateDefaultCheck ? selectedValue : [selectedValue[1], selectedValue[1]],
      visibility: {
        startDateIsVisible: startDateDefaultCheck,
        dueDateIsVisible: dueDateDefaultCheck
      }
    };

    editHandler(dateData);
    setCalendarVisible(false);
  };

  const handleClickOutside = (event) => {
    if (calendarRef.current && !calendarRef.current.contains(event.target)) {
      setCalendarVisible(false); // Hide calendar when clicking outside of it
    }
  };

  const toggleCalendar = () => {
    setCalendarVisible(!calendarVisible);
  };

  const handleCalendarClick = (event) => {
    event.stopPropagation(); // Prevents the click event from bubbling up to the parent
  };

  const isOverdue = (date) => {
    const today = new Date();
    const due = new Date(date);
    return due < today.setHours(0, 0, 0, 0); // ignore time
  };

  const handlerDateChange = (value) => {
    if (!dueDateDefaultCheck) {
      notifications.show({
        color: 'red',
        title: 'Please enable due date to select date.',
        icon: <IconCheck />,
        autoClose: 5000,
      });
      return false;
    }
    // console.log(value);
    if (value) {
      if (startDateDefaultCheck) {
        setSelectedValue(value);
      } else {
        // value is endDate how to get startDate from value
        const endDate = new Date(value);
        const startDateFromEndDate = new Date(endDate);
        startDateFromEndDate.setDate(startDateFromEndDate.getDate() - 1);
        setSelectedValue([startDateFromEndDate, endDate]);
      }
    }
  }

  const handlerStartDateDefaultCheck = () => {
    if (selectedValue) {
      const startDate = new Date(selectedValue[0]);
      const endDateFromStartDate = new Date(startDate);
      endDateFromStartDate.setDate(endDateFromStartDate.getDate());
      const endDate = selectedValue[1] ? new Date(selectedValue[1]) : endDateFromStartDate;
      if (startDate && endDate && startDate.getDate() === endDate.getDate()) {
        startDate.setDate(endDate.getDate() - 1);
      }
      setSelectedValue([startDate, endDate])
    } else {
      setSelectedValue([yesterday, current])
    }

    setStartDateDefaultCheck((prevState) => !prevState);
  }

  const handlerEndDateDefaultCheck = () => {
    if (selectedValue) {
      const startDate = selectedValue[0] ? new Date(selectedValue[0]) : new Date();
      const endDateFromStartDate = new Date(startDate);
      endDateFromStartDate.setDate(endDateFromStartDate.getDate());
      const endDate = selectedValue[1] ? new Date(selectedValue[1]) : endDateFromStartDate;
      if (startDate && endDate && startDate.getDate() === endDate.getDate()) {
        startDate.setDate(endDate.getDate() - 1);
      }
      setSelectedValue([startDate, endDate])
    } else {
      setSelectedValue([yesterday, current])
    }
    setDueDateDefaultCheck((prevState) => !prevState);

  }

  const handleClear = () => {
    setSelectedValue([null, null]);
    setSelectedDates([]);
    editHandler(null);
    setCalendarVisible(false);
  };

  return (
    <div className="due-select-btn">
      <Popover
        opened={calendarVisible}
        onChange={setCalendarVisible}
        //onExitTransitionEnd ={() => false }
        width={300} position="bottom" withArrow shadow="md">
        <Popover.Target>
          <Tooltip label={translate('Due Date')} position="top" withArrow>
            {selectedDates.length > 0 ? (
              <div onClick={() => setCalendarVisible((prevState) => !prevState)} className={`due-selected font-medium text-[14px] cursor-pointer ${isOverdue(selectedDates[0]) ? "text-red-500" : "text-[#202020]"
                }`}>
                {selectedDates.length > 0 && formatDate(selectedDates[0])} {/* Render formatted dates */}
              </div>
            ) : (
              dueDate === null ? (
                <div onClick={() => setCalendarVisible((prevState) => !prevState)} className="h-[30px] w-[30px] border border-dashed border-[#202020] rounded-full p-1 cursor-pointer">
                  <IconCalendarEvent color="#4d4d4d" size="20" stroke={1.25} />
                </div>
              ) : (
                <div onClick={() => setCalendarVisible((prevState) => !prevState)} className="due-selected text-[#202020] font-medium text-[14px] cursor-pointer">
                  {dbdateFormate(dueDate)}
                </div>
              )
            )}
          </Tooltip>
        </Popover.Target>
        <Popover.Dropdown>
          <DatePicker
            type={startDateDefaultCheck ? 'range' : 'single'}
            value={
              dueDateDefaultCheck
                ? (startDateDefaultCheck ? selectedValue : (selectedValue && selectedValue[1]))
                : ['', '']
            }
            onChange={(value) => {
              handlerDateChange(value);
            }}
          />
          <Group justify="flex-start" spacing="xs">
            <Checkbox
              label={translate('Use Date Range')}
              labelPosition="left"
              onChange={handlerStartDateDefaultCheck}
              checked={startDateDefaultCheck}
              size='sm'
            />
          </Group>
          {startDateDefaultCheck && (
            <Grid className={`my-1`}>
              <Grid.Col span={6}>

                <Grid gap={1} align="center">
                  <Grid.Col span={12}>
                    <Text c="#202020" size='sm'>{translate('Start Date')}</Text>
                  </Grid.Col>

                  <Grid.Col className={`!p-0`} span={`auto`}>
                    <TextInput
                      size="xs"
                      placeholder="DD-MM-YYYY"
                      disabled={!startDateDefaultCheck}
                      value={startDateDefaultCheck && selectedValue && selectedValue[0] ? dbdateFormate(selectedValue[0]) : ''}
                      ml={6}
                    />
                  </Grid.Col>
                </Grid>
              </Grid.Col>
              <Grid.Col span={6}>

                <Grid gap={1} align="center">
                  <Grid.Col span={12}>
                    <Text c="#202020" size='sm'>{translate('Due Date')}</Text>
                  </Grid.Col>
                  <Grid.Col className={`!p-1`} span="content">
                    {/* <Checkbox
                          onChange={handlerEndDateDefaultCheck}
                          checked={dueDateDefaultCheck}/> */}
                  </Grid.Col>
                  <Grid.Col className={`!p-0`} span={`auto`}>
                    <TextInput
                      size="xs"
                      placeholder="DD-MM-YYYY"
                      disabled={!dueDateDefaultCheck}
                      value={dueDateDefaultCheck && selectedValue && selectedValue[1] ? dbdateFormate(selectedValue[1]) : ''}
                    />
                  </Grid.Col>
                </Grid>
              </Grid.Col>
            </Grid>
          )}
          <Group className={`pt-3`} justify="space-between">
            <Button onClick={handleClear} size="xs" variant="outline" color="red">
              Clear
            </Button>
            <Button onClick={handleSave} size="xs" variant="filled" color="orange">
              Save
            </Button>
          </Group>

        </Popover.Dropdown>
      </Popover>
    </div>
  );
};

export default DueDate;
