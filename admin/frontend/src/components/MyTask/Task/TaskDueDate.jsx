import React, { useState, useRef, useEffect } from 'react';
import { Calendar, DatePicker, DatePickerProps } from '@mantine/dates';
import { useHotkeys } from '@mantine/hooks';
import { IconCalendarEvent, IconCheck } from '@tabler/icons-react';
import '@mantine/dates/styles.css';
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import { editMyTask } from "../../Settings/store/myTaskSlice";
import { hasPermission } from "../../ui/permissions";
import { Button, Checkbox, Flex, Grid, Group, Indicator, Popover, Text, TextInput, Title, Tooltip } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { translate } from '../../../utils/i18n';

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


const TaskDueDate = (props) => {
  const dispatch = useDispatch();
  const { taskId, startDate, dueDate, startDateIsVisible, dueDateIsVisible, isSubtask, isDrawer } = props;
  // const [selectedDate, setSelectedDate] = useState(dueDate ? new Date(dueDate) : null );
  const [selectedDates, setSelectedDates] = useState([]);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const calendarRef = useRef(null);
  const { loggedUserId } = useSelector((state) => state.auth.user)
  const { loggedInUser } = useSelector((state) => state.auth.session)
  const [startDateDefaultCheck, setStartDateDefaultCheck] = useState(startDateIsVisible || false);
  const [dueDateDefaultCheck, setDueDateDefaultCheck] = useState(dueDateIsVisible || true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const current = dueDate ? new Date(dueDate) : new Date();
  let yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (startDate) {
    yesterday = new Date(startDate);
  }

  const [selectedValue, setSelectedValue] = useState([yesterday, current]);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Initialize selectedDates with dueDate
  useEffect(() => {
    if (dueDate) {
      setSelectedDates([new Date(dueDate)]);
    }
  }, [dueDate]);

  useHotkeys([
    ['Escape', () => setCalendarVisible(false)]
  ]);


  const handleSelect = (date) => {
    const isSelected = selectedDates.some((selectedDate) => dayjs(date).isSame(selectedDate, 'date'));
    // Toggle selection
    if (isSelected) {
      setSelectedDates([]);
    } else {
      setSelectedDates([date]);
    }
    if (taskId && taskId !== 'undefined' && date) {
      // var formatedDate = dayjs(date).format('YYYY-MM-DD');
      const formattedDate = isSelected ? null : dayjs(date).format('YYYY-MM-DD');
      dispatch(editMyTask({ id: taskId, data: { start_date: formattedDate, end_date: formattedDate, 'updated_by': loggedInUser ? loggedInUser.loggedUserId : loggedUserId } })).then((response) => {
        // setSelectedDate(date);
        setCalendarVisible(false); // Hide calendar after selecting a date
      });
    }
  };

  useEffect(() => {
    // setSelectedDate(dueDate ? new Date(dueDate) : null);
  }, [dispatch, dueDate]);
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

  const handlerClear = () => {
    setIsClearing(true);
    if (taskId && taskId !== 'undefined') {
      dispatch(editMyTask({
        id: taskId,
        data: {
          start_date: 'empty',
          start_date_is_visible: 0,
          end_date: 'empty',
          end_date_is_visible: 0,
          'updated_by': loggedInUser ? loggedInUser.loggedUserId : loggedUserId,
        },
      })).then((response) => {
        //popover close
        if (response.payload && response.payload.status === 200) {
          setSelectedValue([null, null]);
          setDueDateDefaultCheck(false);
          setStartDateDefaultCheck(false);
          setCalendarVisible(false)
          setSelectedDates([])
          notifications.show({
            color: 'green',
            title: 'Success',
            message: 'Due date cleared successfully.',
            icon: <IconCheck />,
            autoClose: 5000,
          });
        }

      }).finally(() => {
        setIsClearing(false);
      });
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

  const handlerSubmit = () => {
    setIsSubmitting(true);
    //how to check selectedValue is empty or not and null
    if (selectedValue && selectedValue.length > 0 && selectedValue[0] && selectedValue[1]) {
      if (taskId && taskId !== 'undefined') {
        dispatch(editMyTask({
          id: taskId,
          data: {
            start_date: startDateDefaultCheck ? dayjs(selectedValue[0]).format('YYYY-MM-DD') : (dueDateDefaultCheck ? dayjs(selectedValue[1]).format('YYYY-MM-DD') : "empty"),
            start_date_is_visible: startDateDefaultCheck ? 1 : 0,
            end_date: dueDateDefaultCheck ? dayjs(selectedValue[1]).format('YYYY-MM-DD') : "empty",
            end_date_is_visible: dueDateDefaultCheck ? 1 : 0,
            'updated_by': loggedInUser ? loggedInUser.loggedUserId : loggedUserId,
          },
        })).then((response) => {
          //popover close
          if (response.payload && response.payload.status === 200) {
            if (response.payload.data.end_date) {
              setSelectedDates([new Date(response.payload.data.end_date)]);
            } else {
              setSelectedDates([]);
            }

            setCalendarVisible(false);
            notifications.show({
              color: 'green',
              title: 'Success',
              message: 'Due date updated successfully.',
              icon: <IconCheck />,
              autoClose: 5000,
            });
          }
        }).finally(() => {
          setIsSubmitting(false);
        });
      }
    }

  }
  // Check permission
  const hasAccess = hasPermission(
    loggedInUser && loggedInUser.llc_permissions,
    ['change-duedate']
  );

  return (
    <div className="due-select-btn">
      <Popover
        opened={calendarVisible && hasAccess}
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
                  <Grid.Col className={`!p-1`} span="content">
                    <Checkbox
                      onChange={handlerStartDateDefaultCheck}
                      checked={startDateDefaultCheck}
                    />
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
                          checked={dueDateDefaultCheck} /> */}
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
            <Button onClick={handlerClear} size="xs" variant="outline" color="red"
              loading={isClearing}
              loaderProps={{ type: 'dots' }}
              disabled={isClearing}
            >
              {translate('Clear')}
            </Button>
            <Button onClick={handlerSubmit} size="xs" variant="filled" color="orange"
              loading={isSubmitting}
              loaderProps={{ type: 'dots' }}
              disabled={isSubmitting}
            >
              {translate('Save')}
            </Button>
          </Group>

        </Popover.Dropdown>
      </Popover>

    </div>
  );
};

export default TaskDueDate;
