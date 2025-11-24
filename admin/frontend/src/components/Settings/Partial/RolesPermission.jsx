import React, { Fragment, useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Card,
    Table, Title,
    Group,
    ScrollArea,
    Checkbox,
    TextInput,
    LoadingOverlay,
    Text,
    Modal,
    Box,
    Button,
    Tooltip,
    ThemeIcon,
    Divider,
} from '@mantine/core';
import {
    IconDeviceFloppy,
    IconPencil,
    IconPlus,
    IconTrash
} from '@tabler/icons-react';
import ContentEditable from 'react-contenteditable';
import { fetchAllRoles, fetchAllPermission, fetchRolePermissions, editRolePermissions, createRole, updateRole, deleteRole } from "../../../store/auth/roleSlice";
import { showNotification, updateNotification } from "@mantine/notifications";
import { modals } from "@mantine/modals";
import { translate } from '../../../utils/i18n';

const RolesPermission = () => {

    const dispatch = useDispatch();
    const { loggedUserId } = useSelector((state) => state.auth.user)
    const { loggedInUser } = useSelector((state) => state.auth.session)
    const { permissions, rolePermissions } = useSelector((state) => state.auth.role);

    const [roles, setRoles] = useState(rolePermissions || []);
    const [modalOpened, setModalOpened] = useState(false);
    const [infoModalOpened, setInfoModalOpened] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const contentEditableRef = useRef('');

    const [editingRoleIndex, setEditingRoleIndex] = useState(null);
    const [editingRoleName, setEditingRoleName] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        dispatch(fetchAllPermission());
        dispatch(fetchRolePermissions()).then(() => {
            setIsLoading(false);
        });
    }, [dispatch]);

    useEffect(() => {
        if (rolePermissions) {
            setRoles(rolePermissions);
        }
    }, [rolePermissions]);

    const groupPermissions = (permissions) => {
        const groups = {};
        permissions.forEach(permission => {
            // Assuming permission names are in format: 'create_task', 'edit_task', etc.
            const groupName = permission.group || 'Other'; // Use existing group or fallback to 'Other'
            if (!groups[groupName]) {
                groups[groupName] = [];
            }
            groups[groupName].push(permission);
        });
        return groups;
    };

    const handleCheckAllGroup = (roleIndex, groupPermissions, checked) => {
        const updatedRoles = roles.map((role, index) => {
            if (index === roleIndex) {
                const otherPermissions = role.permissions.filter(p =>
                    !groupPermissions.some(gp => gp.id === p.id)
                );

                return {
                    ...role,
                    permissions: checked
                        ? [...otherPermissions, ...groupPermissions]
                        : otherPermissions
                };
            }
            return role;
        });
        setRoles(updatedRoles);
    };

    const togglePermission = (roleIndex, permission) => {
        const updatedRoles = roles.map((role, index) => {
            if (index === roleIndex) {
                const hasPermission = role.permissions.some(p => p.id === permission.id);
                return {
                    ...role,
                    permissions: hasPermission
                        ? role.permissions.filter(p => p.id !== permission.id)
                        : [...role.permissions, permission]
                };
            }
            return role;
        });

        setRoles(updatedRoles);
    };

    const handleCheckAll = (roleIndex, checked) => {
        const updatedRoles = roles.map((role, index) => {
            if (index === roleIndex) {
                return {
                    ...role,
                    permissions: checked ? [...permissions] : []
                };
            }
            return role;
        });
        setRoles(updatedRoles);
    };

    const handleCreateRole = () => {
        if (!newRoleName.trim()) {
            showNotification({
                title: 'Error',
                message: 'Role name is required',
                color: 'red',
            });
            return;
        }
        const roleData = {
            'name': newRoleName
        };
        setIsSaving(true);
        dispatch(createRole(roleData)).then((res) => {
            if (res.payload.status && res.payload.status == 200) {
                dispatch(fetchRolePermissions());
                setNewRoleName('');
                setModalOpened(false);
                showNotification({
                    title: 'Success',
                    message: 'Role created successfully',
                    color: 'green',
                });
            } else {
                showNotification({
                    title: 'Error',
                    message: res.payload.message || 'Failed to create role',
                    color: 'red',
                });
            }
        })
            .catch((error) => {
                showNotification({
                    title: 'Error',
                    message: error.message || 'Something went wrong',
                    color: 'red',
                });
            })
            .finally(() => {
                setIsSaving(false);
            });
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            const response = await dispatch(editRolePermissions({
                roles: roles
            })).unwrap();

            if (response.status === 200) {
                showNotification({
                    title: 'Success',
                    message: 'All permissions updated successfully',
                    color: 'green'
                });

                dispatch(fetchRolePermissions());
                setInfoModalOpened(true);
            }
        } catch (error) {
            showNotification({
                title: 'Error',
                message: 'Failed to update permissions',
                color: 'red'
            });
        } finally {
            setIsSaving(false);
        }

    };

    const handleRoleNameSave = (index) => {

        const roleEditableName = contentEditableRef.current.innerHTML;
        const roleId = roles[index]?.id;
        const prevRoleName = roles[index]?.name?.trim();

        if (roleEditableName === '') {
            showNotification({
                title: 'Error',
                message: 'Role name cannot be empty',
                color: 'red',
            });
            return;
        }

        if (roleEditableName === prevRoleName) {
            setEditingRoleIndex(null);
            return;
        }

        const roleData = {
            'name': roleEditableName.trim()
        };

        dispatch(updateRole({ id: roleId, data: roleData }))
            .then((res) => {
                if (res.payload.status && res.payload.status === 200) {

                    setEditingRoleIndex(null);

                    showNotification({
                        title: 'Success',
                        message: 'Role updated successfully',
                        color: 'green',
                    });

                    // Refresh roles from server
                    dispatch(fetchRolePermissions());
                } else {
                    showNotification({
                        title: 'Error',
                        message: res.payload.message || 'Failed to update role',
                        color: 'red',
                    });
                }
            })
            .catch((error) => {
                showNotification({
                    title: 'Error',
                    message: error.message || 'Something went wrong',
                    color: 'red',
                });
            });
    };

    const roleDeleteHandler = (role) => {
        modals.openConfirmModal({
            title: translate('Delete Role'),
            centered: true,
            children: (
                <Text size="sm">
                    {translate('Are you sure you want to delete the role?')}
                </Text>
            ),
            labels: { confirm: translate('Yes'), cancel: translate('Cancel') },
            confirmProps: { color: 'orange' },
            onConfirm: () => {
                showNotification({
                    id: 'load-data',
                    loading: true,
                    title: 'Task',
                    message: "Deleting the role...",
                    disallowClose: true,
                    color: 'green',
                    styles: () => ({
                        root: {
                            zIndex: 3000,
                        },
                    }),
                });
                // return;
                dispatch(deleteRole(role?.id))
                    .then((response) => {
                        if (response.payload && response.payload.status && response.payload.status === 200) {
                            // Refresh roles from server
                            dispatch(fetchRolePermissions());
                            updateNotification({
                                id: 'load-data',
                                loading: false,
                                title: 'Task',
                                message: response.payload && response.payload.message && response.payload.message,
                                autoClose: 2000,
                                disallowClose: true,
                                color: 'green',
                            });
                        } else {
                            updateNotification({
                                id: 'load-data',
                                loading: false,
                                title: 'Task',
                                message: response.payload && response.payload.message && response.payload.message,
                                autoClose: 2000,
                                disallowClose: true,
                                color: 'red',
                            });
                        }
                    })
                    .catch((error) => {
                        console.error('Error deleting role:', error);
                        updateNotification({
                            id: 'load-data',
                            loading: false,
                            title: 'Error',
                            message: 'Failed to delete the role.',
                            autoClose: 3000,
                            disallowClose: false,
                            color: 'red',
                        });
                    });
            },
        });
    }

    return (
        <>
            <LoadingOverlay visible={isLoading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
            <Card padding="md" radius="md">
                <Group position="apart" mb="sm">
                    <Button
                        size='sm'
                        variant="filled"
                        color="#39758D"
                        onClick={() => setModalOpened(true)}>
                        <IconPlus size={22} color="#fff" stroke={1.75} />
                        {translate('Add New Role')}
                    </Button>
                </Group>
                <Table.ScrollContainer minWidth={400} type="native" style={{ maxHeight: 540, overflowY: 'auto', scrollbarWidth: 'none' }}>
                    <Table withBorder withColumnBorders highlightOnHover striped stickyHeader style={{ tableLayout: 'fixed', width: '100%' }}>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>{translate('Permission')}</Table.Th>
                                {roles && roles.map((role, index) => (
                                    <Table.Th key={index}>
                                        <Group position="apart" style={{ minWidth: 120, flexWrap: 'nowrap' }}>
                                            <Checkbox
                                                color="orange"
                                                checked={role.permissions.length === permissions.length}
                                                onChange={(event) => handleCheckAll(index, event.currentTarget.checked)}
                                                disabled={role.slug === 'superadmin'}
                                            />
                                            {/* <Text size="sm">{role.name}</Text> */}
                                            {role.slug !== 'superadmin' && editingRoleIndex === index ? (
                                                <ContentEditable
                                                    html={editingRoleName}
                                                    innerRef={contentEditableRef}
                                                    onChange={e => setEditingRoleName(e.target.value)}
                                                    onBlur={() => handleRoleNameSave(index)}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            handleRoleNameSave(index);
                                                        }
                                                    }}
                                                    style={{
                                                        minWidth: '100px',
                                                        maxWidth: '150px',
                                                        width: '100%',
                                                        borderRadius: 4,
                                                        border: "1px solid #4d4d4d",
                                                        padding: '2px 6px',
                                                        background: '#fff',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        display: 'inline-block'
                                                    }}
                                                    spellCheck={false}
                                                    tagName="p"
                                                    className={`text-[#000000] font-medium text-[14px] cursor-pointer !outline-none`}
                                                />
                                            ) : (
                                                <div className="role-editable-group">
                                                    <Text
                                                        size="sm"
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => {
                                                            setEditingRoleIndex(index);
                                                            setEditingRoleName(role.name);
                                                            setTimeout(() => {
                                                                if (contentEditableRef.current) {
                                                                    contentEditableRef.current.focus();
                                                                }
                                                            }, 0);
                                                        }}
                                                        dangerouslySetInnerHTML={{ __html: role.name }}
                                                    >

                                                    </Text>
                                                    {role.slug !== 'superadmin' &&
                                                        <>
                                                            <IconPencil
                                                                size={16}
                                                                className="role-edit-icon"
                                                                onClick={() => {
                                                                    setEditingRoleIndex(index);
                                                                    setEditingRoleName(role.name);
                                                                    setTimeout(() => {
                                                                        if (contentEditableRef.current) {
                                                                            contentEditableRef.current.focus();
                                                                        }
                                                                    }, 0);
                                                                }}
                                                            />
                                                            <IconTrash
                                                                size={16}
                                                                className="role-edit-icon"
                                                                onClick={() => {
                                                                    roleDeleteHandler(role)
                                                                }}
                                                                color='red'
                                                                stroke={1.25}
                                                            />
                                                        </>
                                                    }
                                                </div>
                                            )}
                                        </Group>
                                    </Table.Th>
                                ))}
                            </Table.Tr>
                        </Table.Thead>
                        {/* <Table.Tbody>
                                {permissions && permissions.map((permission) => (
                                    <Table.Tr key={permission.id}>
                                        <Table.Td>{permission.description}</Table.Td>
                                        {roles && roles.map((role, roleIndex) => (
                                            <Table.Td key={roleIndex}>
                                                <Checkbox
                                                    color="orange"
                                                    checked={role.permissions.some(p => p.id === permission.id)}
                                                    onChange={() => togglePermission(roleIndex, permission)}
                                                />
                                            </Table.Td>
                                        ))}
                                    </Table.Tr>
                                ))}
                            </Table.Tbody> */}
                        <Table.Tbody>
                            {permissions && Object.entries(groupPermissions(permissions)).map(([groupName, groupPermissions]) => (
                                <Fragment key={groupName}>
                                    {/* Group Header Row */}
                                    <Table.Tr>
                                        <Table.Td style={{ backgroundColor: '#EBF1F4' }}>
                                            <Text weight={700}>{groupName}</Text>
                                        </Table.Td>
                                        {roles && roles.map((role, roleIndex) => {
                                            const isWhiteboardDisabled = groupName === 'Whiteboard' && !window?.appLocalizer?.whiteboardInstalled;
                                            const checkbox = (
                                                <Checkbox
                                                    color="orange"
                                                    checked={groupPermissions.every(permission =>
                                                        role.permissions.some(p => p.id === permission.id)
                                                    )}
                                                    onChange={(event) =>
                                                        handleCheckAllGroup(roleIndex, groupPermissions, event.currentTarget.checked)
                                                    }
                                                    disabled={role.slug === 'superadmin' || isWhiteboardDisabled}
                                                    styles={{
                                                        input: {
                                                            cursor: role.slug === 'superadmin' ? 'not-allowed' : 'pointer'
                                                        }
                                                    }}
                                                />
                                            );
                                            return (
                                                <Table.Td key={roleIndex} style={{ backgroundColor: '#EBF1F4', textAlign: 'center' }}>
                                                    {isWhiteboardDisabled ? (
                                                        <Tooltip label="Install the Whiteboard Addon to enable these permissions" withArrow>
                                                            <span>{checkbox}</span>
                                                        </Tooltip>
                                                    ) : (
                                                        checkbox
                                                    )}
                                                </Table.Td>
                                            );
                                        })}
                                    </Table.Tr>
                                    {/* Permission Rows */}
                                    {groupPermissions.map((permission) => (
                                        <Table.Tr key={permission.id}>
                                            <Table.Td style={{ paddingLeft: '2rem' }}>{permission.description}</Table.Td>
                                            {roles && roles.map((role, roleIndex) => {
                                                const isWhiteboardDisabled = groupName === 'Whiteboard' && !window?.appLocalizer?.whiteboardInstalled;
                                                const checkbox = (
                                                    <Checkbox
                                                        color="orange"
                                                        checked={
                                                            permission.name === 'view-only-access'
                                                                ? true
                                                                : role.permissions.some(p => p.id === permission.id)
                                                        }
                                                        onChange={
                                                            permission.name === 'view-only-access'
                                                                ? undefined // No-op, can't change
                                                                : () => togglePermission(roleIndex, permission)
                                                        }
                                                        disabled={role.slug === 'superadmin' || isWhiteboardDisabled}
                                                    />
                                                );
                                                return (
                                                    <Table.Td key={roleIndex}>
                                                        {isWhiteboardDisabled ? (
                                                            <Tooltip label="Install the Whiteboard Addon to enable this permission" withArrow>
                                                                <span>{checkbox}</span>
                                                            </Tooltip>
                                                        ) : (
                                                            checkbox
                                                        )}
                                                    </Table.Td>
                                                );
                                            })}
                                        </Table.Tr>
                                    ))}
                                </Fragment>
                            ))}
                        </Table.Tbody>
                    </Table>
                </Table.ScrollContainer>
                <Group position="left" mt="md">
                    <Button
                        size='sm'
                        variant="filled"
                        color="#39758D"
                        w="auto"
                        loading={isSaving}
                        disabled={isSaving}
                        onClick={handleSave}
                        loaderProps={{ type: 'dots' }}
                    >
                        <IconDeviceFloppy size={22} color="#fff" stroke={1.75} />
                        {' '}
                        {translate('Save Changes')}
                    </Button>
                </Group>
            </Card>

            {/* Modal to show permission update information */}
            <Modal
                opened={infoModalOpened}
                onClose={() => setInfoModalOpened(false)}
                title={
                    <>
                        <Group spacing="xs">
                            <ThemeIcon color="orange" radius="xl" size="lg" variant="light">
                                <IconPencil size={24} />
                            </ThemeIcon>
                            <Text size='md' weight={500}>
                                {translate('Permissions Updated')}
                            </Text>
                        </Group>

                    </>
                }
                centered
            >
                <Divider size="xs" className='!-ml-4 w-[calc(100%+2rem)]' />
                <Text mt={10} fw={700} size="sm" c="#4D4D4D" ta="center">
                    {translate('The permissions have been applied.')}
                </Text>

                <Text mt={10} size="sm" c="#4D4D4D" ta="center">
                    {translate('The users have to login again for it to take effect.')} <br />
                    {translate('Please advice your users accordingly.')}
                </Text>

                <Group position="right" mt="sm" justify='center'>
                    <Button
                        size='sm'
                        variant="filled"
                        color="#ED7D31"
                        mt="sm" onClick={() => setInfoModalOpened(false)}>
                        {translate('Okay')}
                    </Button>
                </Group>
            </Modal>

            {/* Modal to create new role */}
            <Modal
                opened={modalOpened}
                onClose={() => setModalOpened(false)}
                title={
                    <>
                        <Group spacing="xs">
                            <ThemeIcon color="orange" radius="xl" size="lg" variant="light">
                                <IconPencil size={24} />
                            </ThemeIcon>
                            <Text size='md' weight={500}>
                                {translate('Create New Role')}
                            </Text>
                        </Group>

                    </>
                }
                centered
            >
                <Divider size="xs" className='!-ml-4 w-[calc(100%+2rem)]' />
                <TextInput
                    mt={10}
                    label={translate('Role Name')}
                    placeholder={translate('Enter role name')}
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.currentTarget.value)}
                    required
                />

                <Button
                    size='sm'
                    variant="filled"
                    color="#ED7D31"
                    mt="md" onClick={handleCreateRole}>
                    {translate('Create Role')}
                </Button>
            </Modal>
        </>
    );
};

export default RolesPermission;
