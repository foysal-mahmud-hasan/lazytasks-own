import { ActionIcon, Avatar, Button, Select, Text, Textarea, Title, Box, Popover, Flex } from '@mantine/core';
import { IconChevronDown, IconPointFilled, IconTrash, IconTrashX } from '@tabler/icons-react';
import React, { useEffect, useState, useRef } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { useDispatch, useSelector } from "react-redux";
import { useEditor, EditorContent } from '@tiptap/react';
import { Link, RichTextEditor } from '@mantine/tiptap';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import Mention from '@tiptap/extension-mention';
import TextAlign from '@tiptap/extension-text-align';
import { createComment, deleteComment } from "../../Settings/store/taskSlice";
import { modals } from "@mantine/modals";
import { hasPermission } from "../../ui/permissions";
import { translate } from '../../../utils/i18n';
import { set } from 'date-fns';
// import {createComment} from "../../../Settings/store/taskSlice";

const TaskComment = ({ task, selectedValue }) => {

  const dispatch = useDispatch();
  const rawMembers = task && task.project && task.project.members;
  const [comments, setComments] = useState(task && task.comments ? task.comments : []);
  const [commentText, setCommentText] = useState('');
  const { loggedUserId, name } = useSelector((state) => state.auth.user)
  const { loggedInUser } = useSelector((state) => state.auth.session)

  const [mentionPopoverOpened, setMentionPopoverOpened] = useState(false);
  const [popoverTarget, setPopoverTarget] = useState(null);
  const [mentionItems, setMentionItems] = useState([]);
  const [mentionCommand, setMentionCommand] = useState(() => () => { });
  const mentionAnchorRef = useRef(null);

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const commentTime = new Date(timestamp);
    const timeDiff = Math.abs(now - commentTime) / 1000; // in seconds

    if (timeDiff < 60) {
      return 'Just now';
    } else if (timeDiff < 3600) {
      const minutes = Math.floor(timeDiff / 60);
      return `${minutes} min ago`;
    } else if (timeDiff < 86400) {
      const hours = Math.floor(timeDiff / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      return commentTime.toLocaleString();
    }
  };

  const handleAddComment = () => {
    const timestamp = new Date().toISOString();
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = commentText;

    // Find all mention elements
    const mentions = tempDiv.querySelectorAll('.mention');
    const mentionedUsers = Array.from(mentions).map(mention => ({
      id: mention.getAttribute('data-id'),
      name: mention.getAttribute('data-label')
    }));

    const newComment = {
      user_id: loggedInUser ? loggedInUser.loggedUserId : loggedUserId,
      user_name: name,
      commentable_id: task && task.id ? task.id : null,
      commentable_type: 'task',
      content: commentText,
      mention_users: mentionedUsers,
      created_at: formatTimestamp(timestamp)
    };
    dispatch(createComment(newComment)).then((response) => {
      if (response.payload && response.payload.data) {
        setComments([response.payload.data, ...comments]);
        editor?.commands.clearContent();
      }
    });
    setCommentText(''); // Clear textarea
  };

  useEffect(() => {
    setComments(task && task.comments ? task.comments : []);
  }, [selectedValue, task.comments]);

  const commentDeleteHandler = (commentId) => modals.openConfirmModal({
    title: (
      <Title order={5}>{translate('You are parmanently deleting this comment')}</Title>
    ),
    size: 'sm',
    radius: 'md',
    withCloseButton: false,
    children: (
      <Text size="sm">
        {translate('Are you sure this comment delete?')}
      </Text>
    ),
    labels: { confirm: translate('Confirm'), cancel: translate('Cancel') },
    onCancel: () => console.log('Cancel'),
    onConfirm: () => {
      if (commentId && commentId !== 'undefined') {
        dispatch(deleteComment({ id: commentId, data: { 'deleted_by': loggedInUser ? loggedInUser.loggedUserId : loggedUserId } })).then((response) => {
          if (response.payload && response.payload.data) {
            setComments(comments.filter(comment => comment.id !== response.payload.data.id));
          }
        });
      }
    },
  });

  const [mentionProps, setMentionProps] = useState(null);
  const membersRef = useRef([]);
  useEffect(() => {
    if (rawMembers && rawMembers.length) {
      membersRef.current = rawMembers.map(user => ({
        id: user.id,
        label: user.name,
        avatar: user.avatar
      }));
    }
  }, [rawMembers]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        autolink: true,
        linkOnPaste: true,
        openOnClick: true,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer'
        }
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({ placeholder: 'Type your comment here...' }),
      Mention.configure({
        HTMLAttributes: {
          class: 'mention',
          'data-id': 'id',
          'data-label': 'label'
        },
        renderText: ({ node }) => `@${node.attrs.label}`,
        suggestion: {
          char: '@',
          items: ({ query }) =>
            membersRef.current.filter(u =>
              u.label.toLowerCase().startsWith(query.toLowerCase())
            ),
          render: () => {
            return {
              onStart: (props) => {
                setMentionProps(props);
                setMentionItems(props.items);
                setMentionCommand(() => props.command);
                setMentionPopoverOpened(true);
              },
              onUpdate: (props) => {
                setMentionProps(props);
                setMentionItems(props.items);
                setMentionCommand(() => props.command);
              },
              onExit: () => {
                setMentionProps(null);
                setMentionPopoverOpened(false);
                setPopoverTarget(null);
                setMentionItems([]);
              },
            }
          },
        },
      }),
    ],
    content: commentText,
    onUpdate: ({ editor }) => {
      setCommentText(editor.getHTML());
    },
  });

  return (
    <>
      {selectedValue === 'Only Comments' &&
        <div className="write-comments">
          <div className="flex gap-2 mb-2 w-full">

            <Avatar size={32}
              src={loggedInUser && loggedInUser.avatar ? loggedInUser.avatar : ''}
              alt={loggedInUser && loggedInUser.name} />
            {/* <Textarea
              description=""
              style={{ width: '100%' }}
              autosize
              minRows={4}
              placeholder="Type your comment here"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            /> */}

            <RichTextEditor editor={editor} className="w-full" style={{ maxHeight: '250px', overflowY: 'auto' }}>
              <RichTextEditor.Toolbar>
                <RichTextEditor.ControlsGroup>
                  <RichTextEditor.Bold />
                  <RichTextEditor.Italic />
                  <RichTextEditor.Underline />
                  <RichTextEditor.Strikethrough />
                </RichTextEditor.ControlsGroup>

                <RichTextEditor.ControlsGroup>
                  <RichTextEditor.H1 />
                  <RichTextEditor.H2 />
                  <RichTextEditor.H3 />
                  <RichTextEditor.H4 />
                  <RichTextEditor.H5 />
                  <RichTextEditor.AlignLeft />
                  <RichTextEditor.AlignRight />
                  <RichTextEditor.AlignCenter />
                  <RichTextEditor.AlignJustify />
                  <RichTextEditor.BulletList />
                  <RichTextEditor.OrderedList />
                </RichTextEditor.ControlsGroup>
              </RichTextEditor.Toolbar>

              <RichTextEditor.Content
                className="prose prose-sm"
                spellCheck={false}
              />
            </RichTextEditor>

            <div ref={mentionAnchorRef} />


          </div>
          {/* <Popover
            opened={mentionPopoverOpened}
            trapFocus={false}
            withinPortal={false}
            width={200}
            position="bottom-start"
          >
            <Popover.Target>
              <div ref={mentionAnchorRef} />
            </Popover.Target>
            <Popover.Dropdown>
              
                {mentionItems.map((item) => (
                  <Flex
                    key={item.id}
                    align="center"
                    px="sm"
                    py="xs"
                    style={{ cursor: 'pointer' }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      mentionCommand({ id: item.id, label: item.label });
                      setTimeout(() => {
                        editor?.commands.focus();
                      }, 0);
                      setMentionPopoverOpened(false);
                    }}
                  >
                    <Avatar src={item.avatar} size={24} radius="xl" mr={8} />
                    <Text>{item.label}</Text>
                  </Flex>
                ))}
              
            </Popover.Dropdown>
          </Popover> */}
          {mentionProps && mentionProps.clientRect && ReactDOM.createPortal(
            <Box
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              style={{
                position: 'absolute',
                top: mentionProps.clientRect().bottom + window.scrollY,
                left: mentionProps.clientRect().left + window.scrollX,
                background: 'white',
                border: '1px solid #ddd',
                borderRadius: 4,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                zIndex: 9999,
              }}
            >
              {mentionProps.items.map(item => (
                <Flex
                  key={item.id}
                  align="center"
                  px="sm"
                  py="xs"
                  style={{ cursor: 'pointer' }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    mentionProps.command({ id: item.id, label: item.label });
                    setTimeout(() => {
                      editor?.commands.focus();
                    }, 0);
                  }}
                >
                  <Avatar src={item.avatar} size={24} radius="xl" mr={8} />
                  <Text>{item.label}</Text>
                </Flex>
              ))}
            </Box>,
            document.body
          )}
          <div className="flex justify-end">
            <Button variant="filled" color="#39758D" size="md" onClick={handleAddComment}>{translate('Comment')}</Button>
          </div>
        </div>
      }
      <div className="comments-lists max-h-[400px] overflow-y-scroll scrollbar-width-thin">
        {selectedValue === 'Only Comments' && comments && comments.length > 0 && comments.map((comment, index) => (
          <div key={index} className="single-comment mb-4">
            <div className="sc-head flex items-center gap-2">
              <Avatar size={32} src={comment.avatar} alt={comment.user_name} />
              <Text fw={500} fz={14} c="#202020">{comment.user_name}</Text>
              <Text fw={400} fz={12} c="#39758D"><IconPointFilled size={14} /></Text>
              <Text fw={400} fz={12} c="#39758D">{comment.created_at}</Text>
              {(hasPermission(loggedInUser && loggedInUser.llc_permissions, ['delete-comments']) || parseInt(loggedUserId) === parseInt(comment.user_id)) &&
                <ActionIcon onClick={() => commentDeleteHandler(comment && comment.id)} variant="transparent" aria-label="Delete">
                  <IconTrash size={16} stroke={1} color="var(--mantine-color-red-filled)" />
                </ActionIcon>
              }
            </div>
            <div className="comment-body pl-[40px]">
              <Text fw={400} fz={14} c="#4D4D4D" dangerouslySetInnerHTML={{ __html: comment.content }}></Text>
            </div>
          </div>
        ))}
      </div>


    </>
  );
};

export default TaskComment;
