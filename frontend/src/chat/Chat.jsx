import { Box, Typography } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import DBHelper from '../DBHelper';
import UserContext from '../UserContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ChatController from './ChatController';

const Chat = ({ selectedChatID, setSelectedChat }) => {
  const [chatMessages, setChatMessages] = useState(null);
  const [chatUsers, setChatUsers] = useState(null);
  const user = useContext(UserContext);

  const socketHandlers = [
    {
      event: 'message',
      handler: (event) => {
        const message = JSON.parse(event.data);
        setChatMessages((prevMessages) => {
          const messages = [...prevMessages, message];
          return messages;
        });
      },
    },
  ];

  useEffect(() => {
    ChatController.setupChat(
      selectedChatID,
      setChatMessages,
      setChatUsers,
      socketHandlers
    );
  }, [selectedChatID]);

  useEffect(() => {
    return () => {
      DBHelper.closeChatConnection();
    };
  }, []);

  return (
    <Box className="open-chat">
      {selectedChatID === null ? (
        <Typography sx={{ margin: 'auto' }}>
          Select or create a new chat.
        </Typography>
      ) : chatMessages === null || chatUsers === null ? (
        ''
      ) : (
        <Box className="chat-content">
          <MessageList messages={chatMessages} users={chatUsers} />
          <MessageInput
            sendMessage={(msg) =>
              ChatController.sendMessage(
                selectedChatID,
                setSelectedChat,
                user.user.id,
                msg
              )
            }
          />
        </Box>
      )}
    </Box>
  );
};

export default Chat;
