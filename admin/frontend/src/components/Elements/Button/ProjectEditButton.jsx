import { IconEdit, IconPencil } from '@tabler/icons-react';
import { Box } from '@mantine/core';
import React from 'react'; 
const ProjectEditButton = ({ onClick }) => {  
    return (
        <>
            <Box
                className='border border-dashed rounded-full p-2 group cursor-pointer'
                style={{
                    borderColor: '#4D4D4D',
                    transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#ff9800';
                    e.currentTarget.querySelector('svg').style.color = '#ff9800';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#4D4D4D';
                    e.currentTarget.querySelector('svg').style.color = '#4D4D4D';
                }}
                onClick={onClick}
            >
                <IconPencil
                    size={20}
                    stroke={1.25}
                    style={{
                        transition: 'all 0.2s ease'
                    }}
                />
            </Box>
        </>
        
    );
}

export default ProjectEditButton;