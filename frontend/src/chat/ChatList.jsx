import React, { useContext, useEffect, useRef, useState } from 'react';
import UserContext from '../UserContext';
import { Box, List, useTheme } from '@mui/material';
import ChatListItem from './ChatListItem';
import ChatSearchBar from './ChatSearchBar';
import StyleHelper from '../styles/StyleHelper';
import ChatListController from './ChatListController';

const ChatList = ({ selectedChat, setSelectedChat }) => {
  const userContext = useContext(UserContext);
  const theme = useTheme();
  const [userChats, setUserChats] = useState(null);
  const chatRefs = useRef(new Map());

  const chatClicked = (id) => {
    ChatListController.chatClicked(
      id,
      chatRefs.current,
      selectedChat,
      setSelectedChat,
      setUserChats
    );
  };

  const searchResultSelected = (chatID, recipient) => {
    ChatListController.searchResultSelected(
      chatID,
      recipient,
      selectedChat,
      setSelectedChat,
      setUserChats,
      chatRefs
    );
  };

  const socketHandlers = [
    {
      event: 'message',
      handler: (event) => {
        console.log(event);
      },
    },
  ];

  useEffect(() => {
    ChatListController.initChatList(userContext, setUserChats, socketHandlers);
  }, []);

  return (
    <Box>
      <ChatSearchBar handleSelect={searchResultSelected} />
      <List className="chatlist">
        {userChats === null
          ? ''
          : userChats.map((c, index) => {
              return (
                <div ref={(el) => chatRefs.current.set(c.id, el)} key={c.id}>
                  <ChatListItem
                    chatInfo={c}
                    borderColor={StyleHelper.getBorderColor(theme, index)}
                    clickHandler={chatClicked}
                    selectedChat={selectedChat}
                  />
                </div>
              );
            })}
      </List>
    </Box>
  );
};

export default ChatList;
