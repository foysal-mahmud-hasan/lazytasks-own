import React from 'react';
import { Text, Button } from '@mantine/core';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
    const navigate = useNavigate();
    return (
        <div style={{ textAlign: 'center', marginTop: 80 }}>
            <Text size="xl" weight={700}>Page Not Found</Text>
            <Text c="dimmed" mt="md">
                The page you are looking for does not exist or the feature is not available.
            </Text>
            <Button mt="xl" color='#ED7D31' onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
        </div>
    );
};

export default NotFound;