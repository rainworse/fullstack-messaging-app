import React, { useContext, useEffect, useRef, useState } from 'react';
import UserContext from '../UserContext';
import { Box, List, useTheme } from '@mui/material';
import ChatListItem from './ChatListItem';
import ChatSearchBar from './ChatSearchBar';
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
    if (receivedData.type === 'message') {
      setUserChats((prevUserChats) => {
        let chatToUpdate = prevUserChats.find(
          (c) => c.id === receivedData.chatID
        );
        chatToUpdate.lastMessage = receivedData.message;
        chatToUpdate.lastMessage.dateSent = Date.now();
        chatToUpdate.lastMessageUser = {
          id: receivedData.message.from,
          username: receivedData.fromUsername,
        };
        return prevUserChats
          .map((c) => {
            if (c.id === chatToUpdate.id) return chatToUpdate;
            return c;
          })
          .sort((o1, o2) => {
            return (
              new Date(o2.lastMessage.dateSent) -
              new Date(o1.lastMessage.dateSent)
            );
          });
      });
    } else if (receivedData.type === 'new_chat_message') {
      const response = await DBHelper.makeHTTPRequest(
        'chatdata/' + receivedData.chatID,
        'GET'
      );
      if (response.successful) {
        setUserChats((prevUserChats) => {
          return [response.data, ...prevUserChats];
        });
      }
    } else if (receivedData.type === 'delete_message') {
      if (receivedData.isLastMessage) {
        const response = await DBHelper.makeHTTPRequest(
          `chat/${receivedData.chatID}/lastmessage`,
          'GET'
        );
        if (response.successful) {
          setUserChats((prevUserChats) => {
            return prevUserChats.map((c) => {
              if (c.id === receivedData.chatID) {
                const newLastMessage = response.data;
                if (!newLastMessage.message) {
                  newLastMessage.message = null;
                  newLastMessage.lastMessageUser = {
                    _id: null,
                    username: null,
                  };
                }
                c.lastMessage.text = newLastMessage.message;
                c.lastMessageUser.id = newLastMessage.lastMessageUser._id;
                c.lastMessageUser.username =
                  newLastMessage.lastMessageUser.username;
                return c;
              }
              return c;
            });
          });
        }
      }
    }
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
