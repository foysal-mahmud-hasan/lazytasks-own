import { IconCheck, IconGripVertical, IconCircleCheckFilled, IconPencil } from '@tabler/icons-react';
import React, { Fragment, useEffect, useRef, useState } from 'react';
import ContentEditable from 'react-contenteditable';
import { useSelector, useDispatch } from 'react-redux';
import { deleteTask, editTask, removeSuccessMessage, setEditableTask } from "../../../../Settings/store/taskSlice";
import { Text, useMantineTheme, Tooltip, } from '@mantine/core';
import { hasPermission } from "../../../../ui/permissions";
import { notifications } from "@mantine/notifications";
import { updateInputFieldFocus } from "../../../../../store/base/commonSlice";
const TaskName = ({ task, taskId, isSubtask, nameOfTask, view, disabled }) => {
    const dispatch = useDispatch();
    const theme = useMantineTheme();
    const defaultTaskName = isSubtask ? (nameOfTask || "Type task name here") : (nameOfTask || "Type task name here");
    const contentEditableRef = useRef('');
    const { loggedUserId } = useSelector((state) => state.auth.user)
    const { loggedInUser } = useSelector((state) => state.auth.session)
    const { childColumns } = useSelector((state) => state.settings.task);
    const { inputFieldIsFocused } = useSelector((state) => state.base.common);
    const { serialSettings } = useSelector((state) => state.settings.setting);


    const [taskObject, setTaskObject] = useState(task);

    useEffect(() => {
        setTaskObject(task)
    }, [task]);

    const [taskName, setTaskName] = useState(defaultTaskName);
    const [isFocused, setIsFocused] = useState(inputFieldIsFocused || false);
    const [openedTooltip, setOpenedTooltip] = useState(false);

    // const [isTaskNameFull, setIsTaskNameFull] = useState(false);

    const handleFocus = () => {
        setIsFocused(true);
        setOpenedTooltip(false);
    };

    const handleBlur = () => {
        setIsFocused(false);
        setOpenedTooltip(false);
        dispatch(updateInputFieldFocus(false));
    };

    const handleChange = (e) => {
        setTaskName(e.target.value);
    };

    const handlerBlur = () => {
        const taskEditableName = contentEditableRef.current.innerHTML;

        if (taskId && taskId !== 'undefined') {
            if (taskEditableName === 'Type task name here' || taskEditableName === '') {
                // Clear the subtask name and show placeholder
                setTaskName('Type task name here');
            } else if (taskEditableName !== taskName) {
                dispatch(editTask({ id: taskId, data: { name: taskEditableName, 'updated_by': loggedInUser ? loggedInUser.loggedUserId : loggedUserId } })).then((response) => {
                    if (response.payload && response.payload.status === 200) {
                        const newTaskName = response.payload.data.name;

                        setTaskObject(response.payload.data);
                        setTaskName(newTaskName);
                        notifications.show({
                            color: theme.primaryColor,
                            title: response.payload.message,
                            icon: <IconCheck />,
                            autoClose: 3000,
                            // withCloseButton: true,
                        });
                        setIsFocused(false);

                        /*const timer = setTimeout(() => {
                            dispatch(removeSuccessMessage());
                            dispatch(updateInputFieldFocus(false));
                        }, 5000); // Clear notification after 3 seconds

                        return () => clearTimeout(timer);*/
                    }
                })
            }
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            contentEditableRef.current.blur();
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            contentEditableRef.current.blur();
        }
    };

    const handleFocusSubtask = () => {
        setIsFocused(true);
        setOpenedTooltip(false);

        // Clear the task name and show placeholder if it matches the default placeholder
        if (taskName === 'Type task name here') {
            setTaskName('');
        }
    };

    const [isShown, setIsShown] = useState(false);

    useEffect(() => {
        if (isSubtask && contentEditableRef.current) {
            setTaskName('');

            setTimeout(() => {
                contentEditableRef.current.focus();
            }, 0);
        }
    }, [isSubtask]);

    useEffect(() => {
        setTaskName(defaultTaskName);
    }, [nameOfTask]);
    const previewTextLength = view === 'cardView' ? 30 : 40; // Adjust the number of characters to show
    const isLongText = taskName && taskName.length > previewTextLength;
    const previewText = isLongText ? taskName.slice(0, previewTextLength) + ' ...' : taskName;

    return (
        <Fragment>
            <div className={`flex items-center gap-1 w-full`}
                onFocus={handleFocus} onBlur={handleBlur}
                onMouseEnter={() => {
                    setIsShown(true)
                    setOpenedTooltip(true)
                }}
                onMouseLeave={() => {
                    setIsShown(false)
                    setOpenedTooltip(false)
                }}

            >
                {!(view === 'cardView') && (
                    <Fragment>
                        <div className="!min-w-[22px] w-[22px] mr-2">

                            {!isSubtask && serialSettings && !serialSettings.enabled && (isShown || isFocused) &&
                                <Fragment>
                                    <IconGripVertical size={20} stroke={1.25} className='ml-[5px]' />
                                </Fragment>
                            }
                            {isSubtask && (isShown || isFocused) && task.status !== 'COMPLETED' &&
                                <Fragment>
                                    <IconGripVertical size={20} stroke={1.25} className='ml-[15px]' />
                                </Fragment>
                            }
                            {isSubtask && task && task.status == 'COMPLETED' && (
                                <IconCircleCheckFilled size={24} stroke={1.25} color='green' />
                            )}

                        </div>
                        {/* {!isSubtask && childColumns && childColumns[task.slug] && childColumns[task.slug].length > 0 ? (
                            <Pill className="!bg-[#ED7D31] !text-white !px-2">{childColumns && childColumns[task.slug] && childColumns[task.slug].length > 0 ? childColumns[task.slug].length : 0 }</Pill>
                        ):(
                            <Space w="lg" style={{marginLeft:'3px'}}/>
                        )} */}
                    </Fragment>
                )}
                {/*isFocused is true tooltip opened false */}

                <Tooltip withinPortal={false} arrowPosition="side" arrowOffset={24} arrowSize={4} label={<div dangerouslySetInnerHTML={{ __html: defaultTaskName }} />} position="top-start" withArrow opened={openedTooltip && isShown} >

                    <div className={`${isFocused ? 'border border-solid border-[#bababa] rounded-md min-w-[150px] w-full' : 'w-full'} flex items-center`} >
                        {!disabled && isFocused && (hasPermission(loggedInUser && loggedInUser.llc_permissions, ['edit-task']) || (task && task.createdBy_id == loggedInUser?.loggedUserId)) ?
                            <ContentEditable
                                key={task.id}
                                data-id={task.id}
                                // disabled={false}
                                innerRef={contentEditableRef}
                                html={isFocused ? taskName : previewText} // Inner HTML content
                                onChange={handleChange} // Handle changes
                                onBlur={handlerBlur} // Handle changes
                                onFocus={handleFocusSubtask} // Handle Focus Changes
                                onKeyDown={handleKeyDown}
                                onClick={(e) => e.stopPropagation()}
                                tagName="p" // Use a paragraph tag
                                className={`task-title text-[#000000] font-medium text-[14px] p-1 cursor-pointer !outline-none pr-1 w-full ${isFocused && taskName === 'Type task name here' ? 'text-gray-400' : ''}`}
                                style={{ 'lineHeight': 'normal' }}
                                lineClamp={1}
                                spellCheck={false}
                            />
                            :
                            <Text lineClamp={1} size="sm" className="text-[#000000] font-medium text-[14px] px-0 !outline-none pr-1" dangerouslySetInnerHTML={{ __html: taskName }}/>

                        }
                        {!disabled && isShown && (hasPermission(loggedInUser && loggedInUser.llc_permissions, ['edit-task']) || (task && task.createdBy_id == loggedInUser?.loggedUserId)) && (
                            <IconPencil
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsFocused(true);
                                    setOpenedTooltip(false);

                                    // Focus the ContentEditable area after a slight delay
                                    setTimeout(() => {
                                        if (contentEditableRef.current) {
                                            contentEditableRef.current.focus();

                                            // Move the cursor to the end of the content
                                            const range = document.createRange();
                                            const selection = window.getSelection();
                                            range.selectNodeContents(contentEditableRef.current);
                                            range.collapse(false); // Collapse the range to the end
                                            selection.removeAllRanges();
                                            selection.addRange(range);
                                        }
                                    }, 0);
                                }}
                                size={18}
                                className="ml-2 text-[#4D4D4D] cursor-pointer"
                                title="Edit"
                            />
                        )}
                    </div>

                </Tooltip>
            </div>
        </Fragment>
    );
};

export default TaskName;
