import { IconUsers, IconSearch } from '@tabler/icons-react';
import React, { useState, useRef, useEffect } from 'react';
import { Popover, Avatar, ScrollArea, Text, Tooltip, TextInput } from '@mantine/core';
import { useHotkeys } from '@mantine/hooks';
import { useDispatch, useSelector } from 'react-redux';
import UsersAvatarGroup from "../../ui/UsersAvatarGroup";
import { editMyTask } from "../../Settings/store/myTaskSlice";
import { hasPermission } from "../../ui/permissions";
import { translate } from '../../../utils/i18n';
import { showNotification } from '@mantine/notifications';
import UserAvatarSingle from '../../ui/UserAvatarSingle';
const TaskFollower = ({ task, followers }) => {
    const dispatch = useDispatch();
    const taskId = task.id;
    const [boardMembers, setBoardMembers] = useState(task && task.project && task.project.members && task.project.members.length > 0 ? task.project.members : []);
    const [showMembersList, setShowMembersList] = useState(false);
    const [selectedMembers, setSelectedMembers] = useState(followers || []);
    const membersListRef = useRef(null);
    const searchInputRef = useRef(null);
    const { loggedUserId } = useSelector((state) => state.auth.user)
    const { loggedInUser } = useSelector((state) => state.auth.session)

    const [searchValue, setSearchValue] = useState('');
    const [filteredMembers, setFilteredMembers] = useState([]);

    // console.log(followers); 
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
        if (boardMembers && boardMembers.length > 0) {
            const filtered = boardMembers.filter(
                (member) =>
                    member.name.toLowerCase().includes(searchValue.toLowerCase()) ||
                    member.email.toLowerCase().includes(searchValue.toLowerCase())
            ).sort((a, b) => a.name.localeCompare(b.name));
            setFilteredMembers(filtered);
        } else {
            setFilteredMembers([]);
        }
    }, [boardMembers, searchValue]);

    const handleSearchInputChange = (e) => {
        const inputValue = e.target.value;
        setSearchValue(inputValue);
    };

    const handleAssignedToButtonClick = () => {
        setShowMembersList(true);
        setTimeout(() => {
            searchInputRef.current?.focus();
        }, 100);
    };

    const handleAssignButtonClick = (member) => {
        const previousMembers = [...selectedMembers];
        // Toggle between assigning and removing a member
        var updatedMembers = [];
        const index = selectedMembers.findIndex((selectedMember) => parseInt(selectedMember.id) === parseInt(member.id));
        if (index === -1) {
            const assignAfterMembers = [...selectedMembers, member];
            updatedMembers = assignAfterMembers;

            setSelectedMembers(assignAfterMembers);
        } else {
            const deletedAfterMembers = selectedMembers.filter((selectedMember) => parseInt(selectedMember.id) !== parseInt(member.id));
            updatedMembers = deletedAfterMembers;

            setSelectedMembers(deletedAfterMembers);
        }

        if (taskId && taskId !== 'undefined' && updatedMembers) {
            dispatch(editMyTask({ id: taskId, data: { members: updatedMembers, 'updated_by': loggedInUser ? loggedInUser.loggedUserId : loggedUserId } }))
                .unwrap()
                .then((response) => {
                    if (response && response.status != 200) {
                        setSelectedMembers(previousMembers);
                        // Show an error message to the user
                        showNotification({
                            id: 'load-data',
                            title: 'Follow Update Failed',
                            message: 'Failed to update followers. Please try again.',
                            autoClose: 3000,
                            color: 'red',
                        });
                    }
                })
                .catch((error) => {
                    // Revert to previous state on failure
                    setSelectedMembers(previousMembers);
                    showNotification({
                        id: 'load-data',
                        title: 'Follow Update Failed',
                        message: 'Failed to update followers. Please try again.',
                        autoClose: 3000,
                        color: 'red',
                    });
                });
        }
    };

    useEffect(() => {
        setSelectedMembers(followers || []);
        setBoardMembers(task && task.project && task.project.members && task.project.members.length > 0 ? task.project.members : [])
    }, [followers, task]);

    useHotkeys([
        ['Escape', () => setShowMembersList(false)]
    ]);


    // Check permission
    const hasAccess = hasPermission(
        loggedInUser && loggedInUser.llc_permissions,
        ['assign-follower']
    );

    return (
        <>
            <Popover
                opened={showMembersList && hasAccess}
                onClose={() => setShowMembersList(false)}
                width={348}
                position="bottom"
                withArrow
                shadow="md"
            >
                <Popover.Target>
                    <div className="assignto-btn flex items-center justify-center">
                        {selectedMembers && selectedMembers.length > 0 ? (
                            <div onClick={handleAssignedToButtonClick} className="flex-inline items-center cursor-pointer">
                                <UsersAvatarGroup users={selectedMembers} size={36} maxCount={3} />
                            </div>
                        ) : (
                            <div onClick={handleAssignedToButtonClick}
                                className="h-[30px] w-[30px] border border-dashed border-[#4d4d4d] rounded-full p-1 cursor-pointer">
                                <IconUsers color="#4d4d4d" size="20" stroke={1.25} />
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
                                    {translate('%d people available').replace('%d', filteredMembers.length > 0 ? filteredMembers.length : 0)}
                                </Text>
                                <div className="mt-3">
                                    {filteredMembers.length > 0 && filteredMembers.map((member) => (
                                        <div key={member.id}
                                            className="ml-single flex items-center border-b border-solid border-[#C2D4DC] py-1 justify-between">
                                            <UserAvatarSingle user={member} size={32} />
                                            <div className="mls-ne ml-3 w-[80%]">
                                                <Text size="sm" fw={700} c="#202020">{member.name}</Text>
                                            </div>
                                            <button
                                                onClick={() => handleAssignButtonClick(member)}
                                                className={`rounded-[5px] h-[32px] px-2 py-0 w-[100px] ml-2 ${selectedMembers.some((selectedMember) => parseInt(selectedMember.id) === parseInt(member.id)) ? 'bg-[#f00]' : 'bg-[#39758D]'}`}
                                            >
                                                <Text size="sm" fw={400} c="#fff">
                                                    {selectedMembers.some((selectedMember) => parseInt(selectedMember.id) === parseInt(member.id)) ? 'Remove' : 'Assign'}
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
        </>
    );
};

export default TaskFollower;
