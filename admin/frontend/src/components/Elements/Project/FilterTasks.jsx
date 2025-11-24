import React, { Fragment, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Select,
    MultiSelect,
    LoadingOverlay, Card,
    ScrollArea,
    Text, TextInput,
    Title, Stack,
    Button, Group, useMantineTheme, Grid,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { showNotification } from "@mantine/notifications";
import { notifications } from "@mantine/notifications";
import { IconUserCircle, IconArchiveOff, IconTrash, IconCheck } from '@tabler/icons-react';
import {
    fetchGanttTasksByProject, fetchTasksByProject, updateIsLoading, updateFilterValues, resetFilterValues
} from "../../../components/Settings/store/taskSlice";
import { fetchAllCompanies } from "../../../components/Settings/store/companySlice";
import {
    fetchProjectPriorities,
    fetchProjectStatuses,
    fetchProjectTaskSections
} from "../../../components/Settings/store/projectSlice";
import useTwColorByName from "../../../components/ui/useTwColorByName";
import { useForm } from "@mantine/form";
import { useLocation } from "react-router-dom";
import { translate } from '../../../utils/i18n';

const FilterTasks = ({ project_id, reloadSections }) => {
    const theme = useMantineTheme();
    const dispatch = useDispatch();

    const { projectSections, projectPriorities, projectStatuses, projects } = useSelector((state) => state.settings.project);
    const { loggedInUser } = useSelector((state) => state.auth.session);
    const { loggedUserId } = useSelector((state) => state.auth.user);
    const userId = loggedInUser ? loggedInUser.loggedUserId : loggedUserId;

    const { boardMembers, projectInfo, filterValues } = useSelector((state) => state.settings.task);

    // Add local loading state
    const [localLoading, setLocalLoading] = useState(false);
    const [buttonLoading, setButtonLoading] = useState(false);

    useEffect(() => {
        setLocalLoading(true);
        Promise.all([
            dispatch(fetchProjectPriorities(project_id)),
            dispatch(fetchProjectStatuses(project_id)),
            dispatch(fetchProjectTaskSections(project_id)),
        ]).finally(() => {
            setLocalLoading(false);
        });
    }, [project_id]);

    const handleFilterChange = (key, value) => {
        const newValue = value === null ? null : value;
        form.setFieldValue(key, newValue);
        // Update Redux state immediately
        dispatch(updateFilterValues({ [key]: newValue }));
    };

    const form = useForm({
        mode: 'uncontrolled',
        initialValues: {
            name: filterValues?.name || '',
            section_id: filterValues?.section_id || null,
            assigned_to: filterValues?.assigned_to || null,
            priority_id: filterValues?.priority_id || null,
            internal_status_id: filterValues?.internal_status_id || null,
            due_date: filterValues?.due_date || null,
            date_type: filterValues?.date_type || null,
        }
    });

    useEffect(() => {
        if (filterValues) {
            form.setValues({
                name: filterValues.name || '',
                section_id: filterValues.section_id || null,
                assigned_to: filterValues.assigned_to || null,
                priority_id: filterValues.priority_id || null,
                internal_status_id: filterValues.internal_status_id || null,
                due_date: filterValues.due_date || null,
                date_type: filterValues.date_type || null,
            });
        }
    }, [filterValues]);

    const location = useLocation();

    const ganttChartPagePathName = `/project/task/gantt/${project_id}`;
    const handleApplyFilters = async (values) => {
        // check values is empty and at least of the values have
        if (Object.values(values).some(value => value !== '')) {
            setButtonLoading(true);
            try {
                // Store filter values in Redux
                dispatch(updateFilterValues(values));

                if (location.pathname === ganttChartPagePathName) {
                    const response = await dispatch(fetchGanttTasksByProject({ id: project_id, data: values })).unwrap();
                    if (response && response.payload && response.payload.state === 200) {
                        showNotification({
                            title: 'Success',
                            message: 'Filters applied successfully',
                            color: 'green',
                            icon: <IconCheck size={16} />,
                        });
                    }
                } else {
                    const response = await dispatch(fetchTasksByProject({ id: project_id, data: values, userId })).unwrap();
                    if (response && response.payload && response.payload.state === 200) {
                        showNotification({
                            title: 'Success',
                            message: 'Filters applied successfully',
                            color: 'green',
                            icon: <IconCheck size={16} />,
                        });
                    }
                }
            } catch (error) {
                showNotification({
                    title: 'Error',
                    message: 'Failed to apply filters',
                    color: 'red',
                    icon: <IconArchiveOff size={16} />,
                });
            } finally {
                setButtonLoading(false);
            }
        } else {
            showNotification({
                title: 'Error',
                message: 'Please select at least one filter',
                color: 'red',
                icon: <IconArchiveOff size={16} />,
            });
        }
    };

    const handleResetFilters = () => {
        const emptyValues = {
            name: '',
            section_id: '',
            assigned_to: '',
            priority_id: '',
            internal_status_id: '',
            due_date: '',
            date_type: '',
        };
        form.setValues(emptyValues);
        dispatch(resetFilterValues());
        dispatch(updateIsLoading(true));
        if (typeof reloadSections === 'function') {
            reloadSections();
        }
    };

    return (
        <>
            <LoadingOverlay
                visible={localLoading}
                zIndex={1000}
                overlayProps={{ radius: 'sm', blur: 5 }}
            />
            <ScrollArea className="h-[calc(100vh-120px)] pr-1" scrollbarSize={4} offsetScrollbars={true}>
                <Card padding="sm" radius="sm">
                    <form onSubmit={form.onSubmit((values) => handleApplyFilters(values))}>
                        <Stack spacing="xs" styles={{ marginLeft: '-10px' }}>
                            <TextInput
                                label={translate('Task Title')}
                                placeholder={translate('Task Title')}
                                key={form.key('name')}
                                {...form.getInputProps('name')}
                            />

                            <Select
                                label={translate('Sections')}
                                size="sm"
                                placeholder={translate('Select Sections')}
                                styles={(theme) => ({
                                    dropdown: {
                                        position: 'fixed',
                                        zIndex: 999999
                                    }
                                })}
                                data={projectSections && projectSections.length > 0 && projectSections.map(section => ({
                                    value: section.id,
                                    label: section.name
                                }))}
                                searchable
                                clearable
                                onChange={(value) => {
                                    handleFilterChange('section_id', value);
                                }}
                                key={form.key('section_id')}
                                {...form.getInputProps('section_id')}
                            />

                            <Select
                                label={translate('Assigned')}
                                size="sm"
                                placeholder={translate('Assigned')}
                                styles={(theme) => ({
                                    dropdown: {
                                        position: 'fixed',
                                        zIndex: 999999
                                    }
                                })}
                                data={boardMembers && boardMembers.length > 0 && boardMembers.map(member => ({
                                    value: member.id,
                                    label: member.name
                                }))}
                                searchable
                                clearable
                                onChange={(value) => {
                                    handleFilterChange('assigned_to', value);
                                }}
                                key={form.key('assigned_to')}
                                {...form.getInputProps('assigned_to')}
                            />

                            <Grid>
                                <Grid.Col span={6}>
                                    <Select
                                        label={translate('Priority')}
                                        size="sm"
                                        placeholder={translate('Select Priority')}
                                        styles={(theme) => ({
                                            dropdown: {
                                                position: 'fixed',
                                                zIndex: 999999
                                            }
                                        })}
                                        data={projectPriorities && projectPriorities.length > 0 && projectPriorities.map(priority => ({
                                            value: priority.id,
                                            label: priority.name
                                        }))}
                                        searchable
                                        clearable
                                        onChange={(value) => {
                                            handleFilterChange('priority_id', value);
                                        }}
                                        key={form.key('priority_id')}
                                        {...form.getInputProps('priority_id')}
                                    />
                                </Grid.Col>
                                <Grid.Col span={6}>
                                    <Select
                                        label={translate('Status')}
                                        size="sm"
                                        placeholder={translate('Select Status')}
                                        styles={(theme) => ({
                                            dropdown: {
                                                position: 'fixed',
                                                zIndex: 999999
                                            }
                                        })}
                                        data={projectStatuses && projectStatuses.length > 0 && projectStatuses.map(status => ({
                                            value: status.id,
                                            label: status.name
                                        }))}
                                        searchable
                                        clearable
                                        onChange={(value) => {
                                            handleFilterChange('internal_status_id', value);
                                        }}
                                        key={form.key('internal_status_id')}
                                        {...form.getInputProps('internal_status_id')}
                                    />
                                </Grid.Col>
                            </Grid>
                            <Grid>
                                <Grid.Col span={6}>
                                    <Select
                                        label={translate('Due Date')}
                                        size="sm"
                                        placeholder={translate('Select')}
                                        styles={(theme) => ({
                                            dropdown: {
                                                position: 'fixed',
                                                zIndex: 999999
                                            }
                                        })}
                                        data={[
                                            { value: 'today', label: 'Today' },
                                            { value: 'overdue', label: 'Over Due' },
                                            { value: 'upcoming', label: 'Upcoming' },
                                            { value: 'no-date', label: 'No Date' }
                                        ]}
                                        searchable
                                        clearable
                                        onChange={(value) => {
                                            handleFilterChange('date_type', value);
                                        }}
                                        key={form.key('date_type')}
                                        {...form.getInputProps('date_type')}
                                    />
                                </Grid.Col>
                            </Grid>



                            <Group position="apart" mt="md">
                                <Button
                                    type={`reset`}
                                    size="sm"
                                    color={"#EBF1F4"}
                                    styles={{
                                        label: {
                                            color: "#202020"
                                        }
                                    }}
                                    onClick={handleResetFilters}
                                >
                                    {translate('Reset Filters')}
                                </Button>
                                <Button
                                    type={`submit`}
                                    size="sm"
                                    color={"#33697F"}
                                    styles={{
                                        label: {
                                            color: "#fff"
                                        }
                                    }}
                                    loading={buttonLoading}
                                    disabled={buttonLoading}
                                    loaderProps={{ type: 'dots' }}
                                // onClick={handleApplyFilters}
                                >
                                    {translate('Apply Filters')}
                                </Button>
                            </Group>
                        </Stack>
                    </form>
                </Card>
            </ScrollArea>
        </>
    );
}
export default FilterTasks;