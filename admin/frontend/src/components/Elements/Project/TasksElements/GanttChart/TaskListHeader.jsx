import React from "react";
import styles from "./task-list-header.module.css";
import {Text} from "@mantine/core";

export const TaskListHeader = ({ headerHeight, fontFamily, fontSize, rowWidth }) => {
    return (
        <div
            className={styles.ganttTable}
            style={{
                fontFamily: fontFamily,
                fontSize: fontSize,
            }}
        >
            <div
                className={`${styles.ganttTable_Header}`}
                style={{
                    height: headerHeight - 2,
                }}
            >
                <div
                    className={styles.ganttTable_HeaderItem}
                    style={{
                        minWidth: '250px',
                        maxWidth: '250px',
                        paddingLeft: '15px',
                    }}
                >
                    <Text c={`#000000`} fz="md" fw={700}>Task</Text>
                </div>
                {/*<div
                    className={styles.ganttTable_HeaderSeparator}
                    style={{
                        height: headerHeight * 0.5,
                        marginTop: headerHeight * 0.2,
                    }}
                />*/}
                <div
                    className={styles.ganttTable_HeaderItem}
                    style={{
                        minWidth: '100px',
                        maxWidth: '100px',
                        textAlign: 'center',
                    }}
                >
                    <Text c={`#000000`} fz="md" fw={700}>Assigned</Text>
                </div>
                {/*<div
                    className={styles.ganttTable_HeaderSeparator}
                    style={{
                        height: headerHeight * 0.5,
                        marginTop: headerHeight * 0.25,
                    }}
                />*/}
                <div
                    className={styles.ganttTable_HeaderItem}
                    style={{
                        minWidth: '100px',
                        maxWidth: '100px',
                        textAlign: 'center',

                    }}
                >
                    <Text c={`#000000`} fz="md" fw={700}>Due Date</Text>
                </div>
            </div>
        </div>
    );
};