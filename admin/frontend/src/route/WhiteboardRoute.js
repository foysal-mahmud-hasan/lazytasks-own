import React from 'react'
import { useParams } from 'react-router-dom'
const whiteboardRoute = ({ component: Component, routeKey, ...props }) => {
    const params = useParams();
    return <Component {...props} params={params}/>
}

export default whiteboardRoute
