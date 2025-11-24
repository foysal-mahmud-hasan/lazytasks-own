import { IconCheck, IconGripVertical, IconPlus } from '@tabler/icons-react';
import React, { useEffect, useRef, useState } from 'react';
import ContentEditable from 'react-contenteditable';
import { useSelector, useDispatch } from 'react-redux';
import { editTaskSection } from "../../../../Settings/store/taskSlice";
import { hasPermission } from "../../../../ui/permissions";
import { updateInputFieldFocus } from "../../../../../store/base/commonSlice";
import { notifications } from "@mantine/notifications";
import { useMantineTheme } from "@mantine/core";

const TaskSectionName = ({ taskSectionId, nameOfTaskSection, view }) => {
    const theme = useMantineTheme();
    const dispatch = useDispatch();
    const { loggedUserId } = useSelector((state) => state.auth.user)
    const { loggedInUser } = useSelector((state) => state.auth.session)
    const { inputFieldIsFocused } = useSelector((state) => state.base.common);
    const taskSections = useSelector((state) => state.settings.task.taskListSections);
    const currentSectionName = taskSections && taskSections[taskSectionId] && taskSections[taskSectionId].name || nameOfTaskSection;

    const defaultTaskName = (currentSectionName || "Type section name here")
    const contentEditableRef = useRef('');

    const [taskName, setTaskName] = useState(defaultTaskName);
    const [isFocused, setIsFocused] = useState(inputFieldIsFocused || false);

    const handleFocus = () => {
        setIsFocused(true);
    };

    const handleChange = (e) => {
        setTaskName(e.target.value);
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            contentEditableRef.current.blur();
        }
    };

    // Keep local state in sync with Redux store
    useEffect(() => {
        if (taskSections?.[taskSectionId]?.name) {
            setTaskName(taskSections[taskSectionId].name);
        } else if (nameOfTaskSection) {
            setTaskName(nameOfTaskSection);
        }
    }, [taskSections, taskSectionId, nameOfTaskSection]);

    useEffect(() => {
        if (isFocused === true && contentEditableRef.current) {
            //get current value of contentEditableRef
            const taskEditableName = contentEditableRef.current.innerHTML;
            setTaskName(taskEditableName === 'Type section name here' ? '' : taskEditableName);

            setTimeout(() => {
                contentEditableRef.current.focus();
            }, 0);
        }
    }, [isFocused]);
    const handlerBlur = () => {
        // const taskEditableName = contentEditableRef.current.innerHTML.trim();
        const rawHtml = contentEditableRef.current.innerHTML || '';
        const taskEditableName = rawHtml.replace(/<br\s*\/?>|&nbsp;/gi, '').trim();

        if (!taskEditableName || taskEditableName === 'Type section name here') {
            setTaskName(nameOfTaskSection);
        } else if (
            taskSectionId &&
            taskSectionId !== 'undefined' &&
            taskEditableName !== taskName
        ) {
            dispatch(editTaskSection({
                id: taskSectionId,
                data: {
                    name: taskEditableName,
                    updated_by: loggedInUser ? loggedInUser.loggedUserId : loggedUserId
                }
            })).then((response) => {
                if (response.payload && response.payload.status === 200) {
                    const taskSections = response.payload.data.taskSections;
                    const taskListSectionsName = response.payload.data.taskListSectionsName[taskSections]?.name;
                    setTaskName(taskListSectionsName);

                    notifications.show({
                        color: theme.primaryColor,
                        title: response.payload.message,
                        icon: <IconCheck />,
                        autoClose: 5000,
                    });
                }
            });
        }

        dispatch(updateInputFieldFocus(false));
        setIsFocused(false);
    };

    const previewTextLength = view === 'cardView' ? 17 : 70; // Adjust the number of characters to show
    const isLongText = taskName && taskName.length > previewTextLength;
    const previewText = isLongText ? taskName.slice(0, previewTextLength) + '...' : taskName;

    return (
        <div className={`${isFocused ? 'border border-solid border-[#000000] rounded-md' : 'cursor-pointer'} ${view === 'listView' ? 'w-[350px]' : 'w-[180px]'}`}>
            {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['create-manage-section']) ?
                <ContentEditable
                    innerRef={contentEditableRef}
                    html={isFocused ? taskName : previewText} // Inner HTML content
                    onChange={handleChange} // Handle changes
                    onBlur={() => {
                        handlerBlur()
                    }} // Handle changes
                    onFocus={handleFocus}
                    onKeyDown={handleKeyDown} // Handle keydown event
                    tagName="p" // Use a paragraph tag
                    className={`text-[#4d4d4d] font-semibold text-[14px] px-1 !outline-none pr-1 leading-6`}
                />
                :
                <p className="text-[#4d4d4d] font-semibold text-[14px] px-1 leading-6">{previewText}</p>
            }
        </div>
    );
};

export default TaskSectionName;
