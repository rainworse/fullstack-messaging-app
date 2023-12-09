import { useContext, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

import UserContext from './UserContext';
import Header from './Header';
import ChatList from './chat/ChatList';
import { Box } from '@mui/material';
import Chat from './chat/Chat';
import DBHelper from './DBHelper';

const Content = () => {
  const user = useContext(UserContext);
  const [selectedChat, setSelectedChat] = useState(null);

  if (!user.user) {
    return <Navigate to="/login" />;
  }

  useEffect(() => {
    if (user.user) {
      DBHelper.createWSConnection();
    }
    return () => {
      DBHelper.closeWSConnection();
    };
  }, [user]);

  return (
    <Box height="100%">
      <Header />
      <Box className="main-content">
        <ChatList
          selectedChat={selectedChat}
          setSelectedChat={setSelectedChat}
        />
        <Chat selectedChatID={selectedChat} setSelectedChat={setSelectedChat} />
      </Box>
    </Box>
  );
};

export default Content;
