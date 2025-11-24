import { IconUserCircle, IconSearch } from '@tabler/icons-react';
import React, { useState, useRef, useEffect, Fragment } from 'react';
import { Popover, Avatar, ScrollArea, Text, Tooltip, TextInput } from '@mantine/core';
import { useHotkeys } from '@mantine/hooks';
import { useDispatch, useSelector } from 'react-redux';
import { editTask, setEditableTask } from "../../../../Settings/store/taskSlice";
import { hasPermission } from "../../../../ui/permissions";
import acronym from "../../../../ui/acronym";
import useTwColorByName from "../../../../ui/useTwColorByName";
import UserAvatarSingle from "../../../../ui/UserAvatarSingle";
import { translate } from '../../../../../utils/i18n';
import { showNotification } from '@mantine/notifications';
const TaskAssignTo = ({ taskId, assigned, view, assignedMember = {}, disabled }) => {
    const dispatch = useDispatch();

    const { boardMembers } = useSelector((state) => state.settings.task);
    const [showMembersList, setShowMembersList] = useState(false);
    const [members, setMembers] = useState(boardMembers ? boardMembers : []);
    const { loggedUserId } = useSelector((state) => state.auth.user)
    const { loggedInUser } = useSelector((state) => state.auth.session)

    const [searchValue, setSearchValue] = useState('');
    const [filteredMembers, setFilteredMembers] = useState([]);

    const [selectedMember, setSelectedMember] = useState((assigned && assigned.id) ? assigned : null);
    const membersListRef = useRef(null);
    const searchInputRef = useRef(null);

    useEffect(() => {
        if (members && members.length > 0) {
            const filtered = members
                .filter(
                    (member) =>
                        member.name.toLowerCase().includes(searchValue.toLowerCase()) ||
                        member.email.toLowerCase().includes(searchValue.toLowerCase())
                )
                .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically by name
            setFilteredMembers(filtered);
        } else {
            setFilteredMembers([]);
        }
    }, [members, searchValue]);

    useEffect(() => {
        setSelectedMember(assigned && assigned.id ? assigned : null);
    }, [assigned]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (membersListRef.current && !membersListRef.current.contains(event.target)) {
                setShowMembersList(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [membersListRef]);

    const handleAssignedToButtonClick = () => {
        setShowMembersList(true);
        setTimeout(() => {
            searchInputRef.current?.focus();
        }, 100);
    };

    useHotkeys([
        ['Escape', () => setShowMembersList(false)]
    ]);

    const handleAssignButtonClick = (member) => {
        const previousMembers = [...members];
        const previousSelectedMember = selectedMember;

        // Optimistically update the UI
        setMembers((prevMembers) =>
            prevMembers.map((m) => {
                if (m.id === member.id) {
                    return { ...m, assigned: !m.assigned }; // Toggle assigned status
                } else if (selectedMember && m.id === selectedMember.id) {
                    return { ...m, assigned: false }; // Unassign previously selected member
                } else {
                    return m;
                }
            })
        );

        assignedMember(member);
        setSelectedMember(member);
        setShowMembersList(false);

        if (taskId && taskId !== 'undefined' && member) {
            // dispatch(editTask({ id: taskId, data: { assigned_to: member, 'updated_by': loggedInUser ? loggedInUser.loggedUserId : loggedUserId } }))
            dispatch(editTask({ id: taskId, data: { assigned_to: member, updated_by: loggedInUser ? loggedInUser.loggedUserId : loggedUserId } }))
                .unwrap()
                .then((response) => {
                    console.log('Response from editTask:', response);
                    if (response.status !== 200) {
                        setMembers(previousMembers);
                        setSelectedMember(previousSelectedMember);

                        // Show an error message to the user
                        showNotification({
                            id: 'load-data',
                            title: 'Task Assign Update Failed',
                            message: 'Failed to assign the task. Please try again.',
                            autoClose: 3000,
                            color: 'red',
                        });
                    }
                })
                .catch((error) => {
                    // API call failed, revert the UI to the previous state
                    setMembers(previousMembers);
                    setSelectedMember(previousSelectedMember);

                    // Show an error message to the user
                    showNotification({
                        id: 'load-data',
                        loading: true,
                        title: 'Task',
                        message: "Failed to assign the task. Please try again.",
                        autoClose: 2000,
                        disallowClose: true,
                        color: 'red',
                    });
                });
        }
    };

    const handleSearchInputChange = (e) => {
        const inputValue = e.target.value;
        setSearchValue(inputValue);
    };

    const bgColor = useTwColorByName();

    // Check permission
    const hasAccess = hasPermission(
        loggedInUser && loggedInUser.llc_permissions,
        ['assign-task-to-member',]
    );

    return (
        <Popover
            opened={showMembersList && hasAccess}
            onClose={() => setShowMembersList(false)}
            width={348}
            position="bottom"
            withArrow
            shadow="md"
            closeOnEscape
            disabled={disabled}
        >
            <Popover.Target>
                <div onClick={handleAssignedToButtonClick} className="assignto-btn">
                    {selectedMember ? (
                        <div className="flex items-center gap-2">
                            <Tooltip withinPortal={false} label={selectedMember.name} position="top" withArrow>
                                <Avatar
                                    color={`${bgColor(selectedMember.name)["font-color"]}`}
                                    bg={`${bgColor(selectedMember.name)["bg-color"]}`}
                                    size={32}
                                    radius={32}
                                    src={selectedMember.avatar || null}
                                >
                                    {!selectedMember.avatar && (
                                        <Text style={{ lineHeight: "14px" }} size="xs">
                                            {acronym(selectedMember.name)}
                                        </Text>
                                    )}
                                </Avatar>
                            </Tooltip>
                            {view !== "cardView" && view !== "ganttView" && (
                                <Tooltip withinPortal={false} label={selectedMember.name} position="top" withArrow>
                                    <Text lineClamp={1} size="sm" fw={500} c="#202020" className="ml-2">
                                        {selectedMember.name}
                                    </Text>
                                </Tooltip>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center">
                            <div className="h-[30px] w-[30px] border border-dashed border-[#202020] rounded-full p-1 cursor-pointer">
                                <Tooltip withinPortal={false} label={translate('Assign to')} position="top" withArrow>
                                    <IconUserCircle color="#4d4d4d" size={20} stroke={1.25} />
                                </Tooltip>
                            </div>
                        </div>
                    )}
                </div>
            </Popover.Target>

            <Popover.Dropdown p={5}>
                <div ref={membersListRef}>
                    <ScrollArea.Autosize mih={100} mah={272} mx="auto" scrollbarSize={4}>
                        <div className="p-3">
                            <TextInput
                                ref={searchInputRef}
                                leftSection={<IconSearch size={16} />}
                                placeholder="Quick search member"
                                mb="sm"
                                className="!mb-2"
                                value={searchValue}
                                onChange={handleSearchInputChange}
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                        setShowMembersList(false);
                                        e.stopPropagation();
                                    }
                                }}
                            />
                            <Text size="sm" fw={700} c="#202020">
                                {translate('%d people available').replace('%d', filteredMembers?.length || 0)}
                            </Text>
                            <div className="mt-3">
                                {filteredMembers?.map((member) => (
                                    <div
                                        key={member.id}
                                        className={`ml-single flex items-center ${filteredMembers.length > 1 && 'border-b'} border-solid border-[#C2D4DC] py-1 justify-between`}
                                    >
                                        <UserAvatarSingle user={member} size={32} />
                                        <div className="mls-ne ml-3 w-[80%]">
                                            <Text size="sm" fw={700} c="#202020">
                                                {member.name}
                                            </Text>
                                        </div>
                                        <button
                                            onClick={() => handleAssignButtonClick(member)}
                                            className="rounded-[5px] h-[32px] px-1 py-0 w-[100px] ml-2 bg-[#39758D]"
                                        >
                                            <Text size="sm" fw={400} c="#fff">
                                                {selectedMember?.id === member.id ? "Assigned" : "Assign"}
                                            </Text>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </ScrollArea.Autosize>
                </div>
            </Popover.Dropdown>
        </Popover>
    );
};

export default TaskAssignTo;
