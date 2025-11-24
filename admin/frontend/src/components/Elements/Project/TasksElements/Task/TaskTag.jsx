import { IconTags, IconUserCircle, IconUsers } from '@tabler/icons-react';
import React, { useState, useRef, useEffect, Fragment } from 'react';
import { Avatar, InputBase, MultiSelect, Pill, Popover, ScrollArea, TagsInput, Text, Tooltip } from '@mantine/core';
import { useDispatch, useSelector } from 'react-redux';
import { useClickOutside, useDisclosure, useHotkeys } from "@mantine/hooks";
import { addTagToTask, deleteTagFromTask } from "../../../../Settings/store/taskSlice";
import { addNewTag } from '../../../../Settings/store/tagSlice';
import useTwColorByName from "../../../../ui/useTwColorByName";
import { hasPermission } from "../../../../ui/permissions";
import { translate } from '../../../../../utils/i18n';

const TaskTag = ({ taskId, taskTags, disabled }) => {
    const dispatch = useDispatch();
    const { loggedUserId } = useSelector((state) => state.auth.user)
    const { loggedInUser } = useSelector((state) => state.auth.session)

    const { tags } = useSelector((state) => state.settings.tag);
    const [showTagsList, setShowTagsList] = useState(false);
    // const [members, setTags] = useState(tags);
    const [selectedTags, setSelectedTags] = useState(taskTags && taskTags.length > 0 ? taskTags.map((tag) => tag.name) : []);
    const [searchValue, setSearchValue] = useState('');
    const tagsListRef = useRef(null);
    const [shouldFocus, setShouldFocus] = useState(false);
    const [opened, { close, open }] = useDisclosure(false);

    const clickOutsideRef = useClickOutside(() => {
        setShowTagsList(false);
        close();
    });

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setShowTagsList(false);
                setShouldFocus(false);
                close();
            }
        };

        if (opened) {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [opened, close]);



    useEffect(() => {
        setSelectedTags(taskTags && taskTags.length > 0 ? taskTags.map((tag) => tag.name) : []);
    }, [taskTags]);


    const handleTagButtonClick = (e) => {
        e.stopPropagation();
        if (opened) {
            close();
            setShowTagsList(false);
            setShouldFocus(false);
        } else {
            open();
            setShowTagsList(true);
            setShouldFocus(true);
        }
    };

    const handleTagRemove = (removedTag) => {
        if (removedTag) {
            const data = {
                'name': removedTag,
                'user_id': loggedInUser ? loggedInUser.loggedUserId : loggedUserId,
                'task_id': taskId
            };
            dispatch(deleteTagFromTask(data))
        }
    };

    const handleTagAdd = (addTag) => {
        if (addTag) {
            const data = {
                'name': addTag,
                'user_id': loggedInUser ? loggedInUser.loggedUserId : loggedUserId,
                'task_id': taskId
            };
            // dispatch(addTagToTask(data))
            // dispatch(setEditableTask(task))
            dispatch(addTagToTask(data)).then((res) => {
                const { payload } = res;
                if (payload && payload.tag) {
                    dispatch(addNewTag(payload.tag));
                }
            });
        }
    };
    const bgColor = useTwColorByName();

    const previewTextLength = 6; // Adjust the number of characters to show
    return (
        <Popover width={300} position="bottom" withArrow shadow="md"
            opened={opened}
            closeOnClickOutside
            onClose={() => {
                setShowTagsList(false);
                close();
            }}
            disabled={disabled}
        >
            <Popover.Target>
                <div className="flex items-center justify-start gap-1">
                    {selectedTags && selectedTags.length > 0 ?
                        <Fragment>
                            <div className={`w-[30px] h-[30px] cursor-pointer flex items-center`}>
                                <Tooltip label={translate('Assign Tag')} position="top" withArrow>
                                    <IconTags
                                        onClick={handleTagButtonClick}
                                        color="#ED7D31"
                                        size="20"
                                        stroke={1.25}
                                        className={`cursor-pointer`}
                                    />
                                </Tooltip>
                            </div>
                            <div className={`w-[100%] flex items-center justify-start`}>
                                <InputBase component="span" multiline classNames={{
                                    // root: '!border-0',
                                    input: '!border-0 !p-0 !bg-transparent !min-h-px !cursor-pointer',
                                }}>
                                    <Pill.Group style={{ flexWrap: 'nowrap' }}>
                                        {selectedTags.slice(0, 2).map((selectedTag, index) => (
                                            <Tooltip label={selectedTag} position="top" withArrow>
                                                <Pill size="sm">{selectedTag && selectedTag.length > previewTextLength ? selectedTag.slice(0, previewTextLength) + '...' : selectedTag}</Pill>
                                            </Tooltip>
                                        ))}
                                        {selectedTags.length > 2 && (
                                            <Pill size="sm">{translate('More (%d)').replace('%d', selectedTags.length - 2)}</Pill>
                                        )}
                                    </Pill.Group>
                                </InputBase>

                            </div>
                        </Fragment>
                        :
                        <div
                            className="h-[30px] w-[30px] border border-dashed border-[#4d4d4d] rounded-full p-1">
                            <Tooltip label={translate('Assign Tag')} position="top" withArrow>
                                <IconTags onClick={handleTagButtonClick}
                                    className={`cursor-pointer`}
                                    stroke={1.25}
                                    color="#4d4d4d"
                                    size="20" />
                            </Tooltip>
                        </div>

                    }
                </div>
            </Popover.Target>
            {hasPermission(loggedInUser && loggedInUser.llc_permissions, ['edit-task']) &&
                <Popover.Dropdown ref={clickOutsideRef}>
                    <TagsInput
                        autoFocus={shouldFocus}
                        onFocus={() => setShouldFocus(false)}
                        placeholder={translate("Pick tag from list")}
                        data={(tags && tags.length > 0) ? tags.map((tag) => tag.name) : []}
                        defaultValue={selectedTags && selectedTags.length > 0 ? selectedTags : []}
                        comboboxProps={{ withinPortal: false }}
                        searchValue={searchValue}
                        onSearchChange={
                            (value) => {
                                setSearchValue(value)
                            }
                        }
                        onOptionSubmit={(value) => {
                            handleTagAdd(value)
                        }}
                        onRemove={(removeTag) => {
                            handleTagRemove(removeTag)
                        }}
                        onChange={(value) => {
                            setSelectedTags(value);
                        }}

                    />
                </Popover.Dropdown>
            }

        </Popover>
    );
};

export default TaskTag;
