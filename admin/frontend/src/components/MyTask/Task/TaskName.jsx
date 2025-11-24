import { IconGripVertical, IconPencil, IconPlus } from '@tabler/icons-react';
import React, { Fragment, useEffect, useRef, useState } from 'react';
import ContentEditable from 'react-contenteditable';
import { useSelector, useDispatch } from 'react-redux';
import { editMyTask } from "../../Settings/store/myTaskSlice";
import { hasPermission } from "../../ui/permissions";
import { Text } from "@mantine/core";

const TaskName = ({ task, taskId, isSubtask, nameOfTask, view }) => {
    const dispatch = useDispatch();

    const defaultTaskName = isSubtask ? (nameOfTask || "Type task name here") : (nameOfTask || "Type task name here");
    const contentEditableRef = useRef('');
    const { loggedUserId } = useSelector((state) => state.auth.user)
    const { loggedInUser } = useSelector((state) => state.auth.session)

    const [taskName, setTaskName] = useState(defaultTaskName);
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = () => {
        setIsFocused(true);
    };

    const handleBlur = () => {
        setIsFocused(false);
    };

    const handleChange = (e) => {
        setTaskName(e.target.value);
    };
    const handlerBlur = () => {
        const taskEditableName = contentEditableRef.current.innerHTML;
        if (taskId && taskId !== 'undefined' && taskEditableName !== taskName) {
            dispatch(editMyTask({ id: taskId, data: { name: taskEditableName, 'updated_by': loggedInUser ? loggedInUser.loggedUserId : loggedUserId } }))
            setTaskName(taskEditableName);
        }
    };
    const [isShown, setIsShown] = useState(false);

    useEffect(() => {
        setTaskName(defaultTaskName);
    }, [nameOfTask]);

    // Handle clicks outside the component
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                contentEditableRef.current &&
                !contentEditableRef.current.contains(event.target) // Check if the click is outside the wrapper
            ) {
                setIsFocused(false); // Set isFocused to false
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const previewTextLength = view === 'cardView' ? 50 : 70; // Adjust the number of characters to show
    const isLongText = taskName.length > previewTextLength;
    const previewText = isLongText ? taskName.slice(0, previewTextLength) + '...' : taskName;

    return (
        <Fragment>
            <div className={`flex items-center gap-1 w-full`}
                // onFocus={handleFocus} onBlur={handleBlur}
                onMouseEnter={() => setIsShown(true)}
                onMouseLeave={() => setIsShown(false)}
            >
                <div className={isFocused ? 'border border-solid border-[#bababa] rounded-md min-w-[150px] w-full' : 'w-full flex items-center'}>
                    {isFocused && hasPermission(loggedInUser && loggedInUser.llc_permissions, ['edit-task']) ?
                        <ContentEditable
                            // disabled={false}
                            innerRef={contentEditableRef}
                            html={isFocused ? taskName : previewText} // Inner HTML content
                            onChange={handleChange} // Handle changes
                            onClick={(e) => e.stopPropagation()}
                            onBlur={handlerBlur} // Handle changes
                            tagName="p" // Use a paragraph tag
                            className={`text-[#000000] font-medium text-[14px] p-1 cursor-pointer !outline-none pr-1 w-full ${isFocused && taskName === 'Type task name here' ? 'text-gray-400' : ''}`}
                            style={{ 'lineHeight': 'normal' }}
                        />
                        :
                        <Text size="sm" className="text-[#000000] text-[14px] px-0 !outline-none pr-1">{taskName}</Text>
                    }
                    {!isFocused && isShown && (hasPermission(loggedInUser && loggedInUser.llc_permissions, ['edit-task']) || (task && task.createdBy_id == loggedInUser?.loggedUserId)) && (
                        <IconPencil
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsFocused(true);

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
            </div>
        </Fragment>
    );
};

export default TaskName;
