import { IconUserCircle, IconSearch } from '@tabler/icons-react';
import React, { useState, useRef, useEffect, Fragment } from 'react';
import { Popover, Avatar, ScrollArea, Text, TextInput } from '@mantine/core';
import { useHotkeys } from '@mantine/hooks';
import { useDispatch, useSelector } from 'react-redux';
import { editMyTask } from "../../Settings/store/myTaskSlice";
import { hasPermission } from "../../ui/permissions";
import UserAvatarSingle from "../../ui/UserAvatarSingle";
import { translate } from '../../../utils/i18n';
import { showNotification } from '@mantine/notifications';
const TaskAssignTo = ({ task, assigned }) => {
    const dispatch = useDispatch();

    const [showMembersList, setShowMembersList] = useState(false);
    const { loggedUserId } = useSelector((state) => state.auth.user);
    const { loggedInUser } = useSelector((state) => state.auth.session);

    const [members, setMembers] = useState(task && task.project && task.project.members ? task.project.members : []);
    const [searchValue, setSearchValue] = useState('');
    const [filteredMembers, setFilteredMembers] = useState([]);

    const [selectedMember, setSelectedMember] = useState((assigned && assigned.id) ? assigned : null);
    const membersListRef = useRef(null);
    const searchInputRef = useRef(null);

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

    useEffect(() => {
        if (members && members.length > 0) {
            const filtered = members.filter(
                (member) =>
                    member.name.toLowerCase().includes(searchValue.toLowerCase()) ||
                    member.email.toLowerCase().includes(searchValue.toLowerCase())
            )
            .sort((a, b) => a.name.localeCompare(b.name));
            setFilteredMembers(filtered);
        } else {
            setFilteredMembers([]);
        }
    }, [members, searchValue]);

    const handleAssignedToButtonClick = () => {
        setShowMembersList(true);
        setTimeout(() => {
            searchInputRef.current?.focus();
        }, 100);
    };

    const handleSearchInputChange = (e) => {
        const inputValue = e.target.value;
        setSearchValue(inputValue);
    };

    const handleAssignButtonClick = (member) => {
        const previousMembers = [...members];
        const previousSelectedMember = selectedMember;

        setSelectedMember(member);
        setShowMembersList(false);
        if (task && task.id && task.id !== 'undefined' && member) {
            dispatch(editMyTask({ id: task.id, data: { assigned_to: member, 'updated_by': loggedInUser ? loggedInUser.loggedUserId : loggedUserId } }))
                .unwrap()
                .then((response) => {
                    if (response && response.status !== 200) {
                        // Revert state changes
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
                    // Revert state changes
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
                });
        }
    };

    useHotkeys([
        ['Escape', () => setShowMembersList(false)]
    ]);

    // Check permission
    const hasAccess = hasPermission(
        loggedInUser && loggedInUser.llc_permissions,
        ['assign-task-to-member']
    );

    return (
        <Popover
            opened={showMembersList && hasAccess}
            onClose={() => setShowMembersList(false)}
            width={348}
            position="bottom"
            withArrow
            shadow="md"
        >
            <Popover.Target>
                <div onClick={handleAssignedToButtonClick} className="assignto-btn">
                    {selectedMember ? (
                        <div className="flex items-center gap-2">
                            {/*<Avatar src={selectedMember.avatar} size={32} radius="xl" />*/}
                            <UserAvatarSingle user={selectedMember} size={32} />
                            <Text title={selectedMember.name} lineClamp={1} size="sm" fw={600} c="#4d4d4d" className="ml-2">
                                {selectedMember.name}
                            </Text>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center">
                            <div className="h-[32px] w-[32px] border border-dashed border-[#4d4d4d] rounded-full p-1 cursor-pointer">
                                <IconUserCircle color="#4d4d4d" size="22" />
                            </div>
                        </div>
                    )}
                </div>
            </Popover.Target>

            <Popover.Dropdown>
                <div ref={membersListRef}>
                    <ScrollArea.Autosize mih={100} mah={272} scrollbarSize={4}>
                        <div className="p-1">
                            <TextInput
                                ref={searchInputRef}
                                leftSection={<IconSearch size={16} />}
                                placeholder={translate('Quick search member')}
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
                                {translate('%d people available').replace('%d', task && task.project && filteredMembers ? filteredMembers.length : 0)}
                            </Text>
                            <div className="mt-3">
                                {filteredMembers && filteredMembers.length > 0 && filteredMembers.map((member) => (
                                    <div
                                        key={member.id}
                                        className="ml-single flex items-center border-b border-solid border-[#C2D4DC] py-1 justify-between"
                                    >
                                        <UserAvatarSingle user={member} size={32} />

                                        {/*<Avatar src={member.avatar} size={40} radius="xl" />*/}
                                        <div className="mls-ne ml-3 w-[80%]">
                                            <Text className="font-semibold text-[14px]" size="sm" fw={700} c="#202020">
                                                {member.name}
                                            </Text>
                                        </div>
                                        <button
                                            onClick={() => handleAssignButtonClick(member)}
                                            className="rounded-[5px] h-[32px] px-1 py-0 w-[100px] ml-2 bg-[#39758D]"
                                        >
                                            <Text size="sm" fw={400} c="#fff">
                                                {selectedMember && selectedMember.id === member.id ? translate('Assigned') : translate('Assign')}
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
