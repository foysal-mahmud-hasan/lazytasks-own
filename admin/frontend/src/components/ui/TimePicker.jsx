import { useRef } from 'react';
import { ActionIcon, rem } from '@mantine/core';
import { TimeInput } from '@mantine/dates';
import { IconClock } from '@tabler/icons-react';

const TimePicker= (props) => {
    const ref = useRef(null);

    const pickerControl = (
        <ActionIcon variant="subtle" color="gray" onClick={() => ref.current?.showPicker()}>
            <IconClock size={20} stroke={1.5} />
        </ActionIcon>
    );

    return (
        <TimeInput size="sm" ref={ref} leftSection={pickerControl} {...props}/>
    );
}
export default TimePicker;