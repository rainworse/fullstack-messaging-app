import React, { useContext, useEffect, useRef, useState } from 'react';
import UserContext from '../UserContext';
import { Box, List, useTheme } from '@mui/material';
import ChatListItem from './chatlistitem/ChatListItem';
import ChatSearchBar from './chatsearch/ChatSearchBar';
import StyleHelper from '../styles/StyleHelper';
import ChatListController from './ChatListController';
import DBHelper from '../DBHelper';

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

  useEffect(() => {
    ChatListController.initChatList(userContext, setUserChats);
    DBHelper.addWSEventListener('chatlist', wsListener);
  }, []);

  useEffect(() => {
    if (
      selectedChat &&
      !selectedChat.newChat &&
      userChats !== null &&
      userChats.map((c) => c.id).includes('newchat')
    ) {
      setUserChats((prevUserChats) => {
        return prevUserChats.filter((c) => c.id !== 'newchat');
      });
    }
  }, [selectedChat]);

  const wsListener = async (data) => {
    const receivedData = JSON.parse(data);
    ChatListController.handleWSMessage(receivedData, setUserChats);
  };

  return (
    <Box
      className="sidebar"
      sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <ChatSearchBar handleSelect={searchResultSelected} />
      <List
        className="chatlist"
        sx={{ flexDirection: 'column', overflow: 'scroll' }}
      >
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
