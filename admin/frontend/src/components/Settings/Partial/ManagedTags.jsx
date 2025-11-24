import React, { Fragment, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Modal, Flex,
    Grid,
    Pill, Image,
    Paper,
    ScrollArea,
    ActionIcon,
    TextInput,
    Tooltip,
    Text,
    Button,
} from '@mantine/core';
import {
    IconPlus, IconCirclePlusFilled
} from '@tabler/icons-react';
import { useForm } from "@mantine/form";
import { editSetting, fetchSettings, fetchTimezoneOptions } from "../store/settingSlice";
import { fetchAllTags, deleteTag, createTag } from "../store/tagSlice";
import { showNotification } from "@mantine/notifications";
import { translate } from '../../../utils/i18n';
const ManagedTags = () => {
    // const users = useSelector((state) => state.users);
    const {loggedUserId} = useSelector((state) => state.auth.user)
    const { loggedInUser } = useSelector((state) => state.auth.session)
    const { tags } = useSelector((state) => state.settings.tag);

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedTag, setSelectedTag] = useState(null);
    const [error, setError] = useState('');
    const [tagName, setTagName] = useState('');

    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(fetchAllTags());
    }, [dispatch]);

    const handleRemoveTag = (tag) => {
        console.log(tag);
        if (tag.task_count > 0) {
            setSelectedTag(tag.id);
            setModalOpen(true);
        } else {
            handleConfirmedDelete(tag.id);
        }
    };

    const handleConfirmedDelete = (tagId) => {
        if (!tagId) return;
        dispatch(deleteTag(tagId))
            .unwrap()
            .then(() => {
                showNotification({
                    title: 'Success',
                    message: 'Tag deleted successfully',
                    color: 'green',
                });
                setModalOpen(false);
            })
            .catch((error) => {
                showNotification({
                    title: 'Error',
                    message: error.message || 'Failed to delete tag',
                    color: 'red',
                });
            });
    };

    const handleTagAdd = (addTag) => {
        if(addTag){
            const data={
                'name': addTag,
                'user_id': loggedInUser ? loggedInUser.loggedUserId : loggedUserId
            };
            dispatch(createTag(data)).then((res) => {
                if (res.payload.status && res.payload.status == 200) {
                    showNotification({
                        title: 'Success',
                        message: 'Tag added successfully',
                        color: 'green',
                    });
                    setTagName('');
                    setError('');
                } else {
                    showNotification({
                        title: 'Error',
                        message: res.payload.message || 'Failed to add tag',
                        color: 'red',
                    });
                }
            });
        }else{
            setError('Tag name cannot be empty');
        }
    };

    return (
        <Fragment>

            <Modal
                opened={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Confirm Tag Deletion"
            >
                <Text size="sm" mb="md">
                    {translate('This tag is used in tasks. Deleting it will remove the tag from all associated tasks.Are you sure you want to delete this tag?')}
                </Text>
                <Flex gap="md" justify="flex-end">
                    <Button variant="outline" onClick={() => setModalOpen(false)}>
                        {translate('Cancel')}
                    </Button>
                    <Button color="red" onClick={() => handleConfirmedDelete(selectedTag)}>
                        {translate('Delete')}
                    </Button>
                </Flex>
            </Modal>

            <Paper>
                <div className="mb-4">
                    <Grid>
                        <Grid.Col span={{ md: 4, lg: 4 }}>
                            <TextInput
                                w={"100%"}
                                size="sm"
                                label={translate('Add New Tag')}
                                placeholder={translate('Tag Name')}
                                value={tagName}
                                onChange={(e) => {
                                    setTagName(e.target.value);
                                    setError('');
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && tagName.trim() !== '') {
                                        handleTagAdd(tagName.trim());
                                        setTagName('');
                                    }
                                }}
                                mb={20}
                                error={error}
                                rightSection={
                                    <>
                                        <ActionIcon onClick={() => handleTagAdd(tagName)} variant="filled" radius="lg" color="orange" aria-label="Settings">
                                            <IconPlus size={20} stroke={1.5} />
                                        </ActionIcon>
                                    </>
                                }
                            />
                            <Flex
                                mih={50}
                                gap="md"
                                justify="flex-start"
                                align="center"
                                direction="row"
                                wrap="wrap"
                            >
                                {tags && tags.length > 0 && tags.map((tag, index) => (
                                    <Pill
                                        key={index}
                                        withRemoveButton
                                        onRemove={() => handleRemoveTag(tag)}
                                    >
                                        {tag.name}
                                    </Pill>
                                ))}
                            </Flex>
                        </Grid.Col>
                    </Grid>
                </div>
            </Paper>
        </Fragment>
    );
};

export default ManagedTags;
