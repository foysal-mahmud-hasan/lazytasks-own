import React, {Fragment} from 'react'
import classNames from 'classnames'

const HighlightedText = ({ children, className }) => {
    return (
        <span
            className={classNames(
                'gray-900 dark:text-gray-500 whitespace-pre-line',
                className
            )}
        >
            {children}
        </span>
    )
}

const ActivityLogs = ({ activity }) => {
    return (
        activity.properties.attributes && Object.keys(activity.properties.attributes).length>0 && Object.keys(activity.properties.attributes).map((attrName, attrIndex)=>{
            return (
                <Fragment key={attrIndex}>

                    {activity?.subject_name==='task' && activity?.event==='created' && attrName==='name' && (
                        <div className="mt-1">
                            <HighlightedText>{activity.properties.attributes[attrName]}</HighlightedText>
                            <span className=""> Created the task </span>
                        </div>
                    )}

                    {activity?.subject_name==='task' && activity?.subject_type==='comment' && attrName==='comment' && (
                        <div className="mt-1">
                            <HighlightedText>{activity.properties.attributes[attrName]}</HighlightedText>
                        </div>
                    )}

                    {activity?.subject_name==='task' && activity?.event === 'updated' &&
                        <>
                            {attrName==='name' &&
                                <div className="mt-1">
                                    <span className="">Has changed the task title from </span>
                                    <HighlightedText>{activity.properties.old[attrName]}</HighlightedText>
                                    <span className="mx-1"> to </span>
                                    <HighlightedText>{activity.properties.attributes[attrName]}</HighlightedText>
                                </div>
                            }
                            {attrName==='description' &&
                                (
                                    activity.properties.old[attrName] ? (
                                        <div className="mt-1">
                                            <span className="">Has updated the description to </span>
                                            <HighlightedText><span dangerouslySetInnerHTML={{ __html: activity.properties.attributes[attrName] }}></span></HighlightedText>
                                        </div>
                                    ):(
                                        <div className="mt-1">
                                            <span className="">Has added the description </span>
                                            <HighlightedText><span dangerouslySetInnerHTML={{ __html: activity.properties.attributes[attrName] }}></span></HighlightedText>
                                        </div>
                                    )
                                )
                            }
                            {attrName==='assignedTo_name' &&
                                (
                                    activity.properties.old[attrName] ? (
                                        <div className="mt-1">
                                            <span className="">Assigned the task from </span>
                                            <HighlightedText>{activity.properties.old[attrName]}</HighlightedText>
                                            <span className="mx-1"> to </span>
                                            <HighlightedText>{activity.properties.attributes[attrName]}</HighlightedText>
                                        </div>
                                    ):(
                                        <div className="mt-1">
                                            <span className="">Assigned the task to </span>
                                            <HighlightedText>{activity.properties.attributes[attrName]}</HighlightedText>
                                        </div>
                                    )
                                )
                            }
                            {attrName==='priority_name' &&
                                (
                                    activity.properties.old[attrName] ? (
                                        <div className="mt-1">
                                            <span className="">Has changed the priority for this task from </span>
                                            <HighlightedText>{activity.properties.old[attrName]}</HighlightedText>
                                            <span className="mx-1"> to </span>
                                            <HighlightedText>{activity.properties.attributes[attrName]}</HighlightedText>
                                        </div>
                                    ):(
                                        <div className="mt-1">
                                            <span className="">Has set priority for this task to </span>
                                            <HighlightedText>{activity.properties.attributes[attrName]}</HighlightedText>
                                        </div>
                                    )
                                )
                            }
                            {attrName==='start_date' &&
                                (
                                    activity.properties.old[attrName] ? (
                                        <div className="mt-1">
                                            <span className="">Start date change: </span>
                                            <HighlightedText>{activity.properties.old[attrName]}</HighlightedText>
                                            <span className="mx-1"> to </span>
                                            <HighlightedText>{activity.properties.attributes[attrName]}</HighlightedText>
                                        </div>
                                    ):(
                                        <div className="mt-1">
                                            <span className="">Start date: </span>
                                            <HighlightedText>{activity.properties.attributes[attrName]}</HighlightedText>
                                        </div>
                                    )
                                )
                            }
                            {attrName==='end_date' &&
                                (
                                    activity.properties.old[attrName] ? (
                                        <div className="mt-1">
                                            <span className="">Has changed the due date from </span>
                                            <HighlightedText>{activity.properties.old[attrName]}</HighlightedText>
                                            <span className="mx-1"> to </span>
                                            <HighlightedText>{activity.properties.attributes[attrName]}</HighlightedText>
                                        </div>
                                    ):(
                                        <div className="mt-1">
                                            <span className="">Has set due date for this task to </span>
                                            <HighlightedText>{activity.properties.attributes[attrName]}</HighlightedText>
                                        </div>
                                    )
                                )
                            }
                            {attrName==='section_name' &&
                                <div className="mt-1">
                                    <span className="">Section change: </span>
                                    <HighlightedText>{activity.properties.old[attrName]}</HighlightedText>
                                    <span className="mx-1"> to </span>
                                    <HighlightedText>{activity.properties.attributes[attrName]}</HighlightedText>
                                </div>
                            }
                        </>
                    }

                    {activity?.subject_name==='task' && activity?.event === 'removed' && attrName==='name' &&
                        <>
                            <div className="mt-4">
                                <HighlightedText>{activity.properties.attributes[attrName]}</HighlightedText>
                                <span className="mx-1"> is deleted. </span>
                            </div>

                        </>
                    }
                    {activity?.subject_name==='task' && activity?.event === 'attachment-removed' && attrName==='name' &&
                        <>
                            <div className="mt-4">
                                <HighlightedText>{activity.properties.attributes[attrName]}</HighlightedText>
                                <span className=""> Has deleted the attachment </span>
                            </div>

                        </>
                    }
                    {activity?.subject_name==='task' && activity?.event === 'attachment-upload' && attrName==='name' &&
                        <>
                            <div className="mt-4">
                                <HighlightedText>{activity.properties.attributes[attrName]}</HighlightedText>
                                <span className="">Has added the attachment </span>
                            </div>

                        </>
                    }
                </Fragment>
            )
        })
    )
}

export default ActivityLogs
