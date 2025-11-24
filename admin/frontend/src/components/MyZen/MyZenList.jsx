import React, {useState, useEffect, Fragment, useRef} from 'react';
import {Accordion, ScrollArea, Tabs} from '@mantine/core';
import { useSelector, useDispatch } from 'react-redux';
import {IconGripVertical} from "@tabler/icons-react";
import {updateColumns} from "../Settings/store/myTaskSlice";
import MyZenListContent from "./MyZenListContent";
import MyZenHeader from "./MyZenHeader";

const MyZenList = () => {
const dispatch = useDispatch();

  const {myZens} = useSelector((state) => state.zen.myzen)

  return (
    <Fragment>
      <MyZenHeader />
      <ScrollArea className="h-[calc(100vh-240px)] p-[3px]" scrollbarSize={4}>

        <MyZenListContent contents={myZens} />

      </ScrollArea>

    </Fragment>
  );
};

export default MyZenList;
