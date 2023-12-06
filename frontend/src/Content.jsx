import { useContext, useState } from 'react';
import { Navigate } from 'react-router-dom';

import UserContext from './UserContext';
import Header from './Header';
import ChatList from './chat/ChatList';
import { Box } from '@mui/material';
import Chat from './chat/Chat';

const Content = () => {
  const user = useContext(UserContext);
  const [selectedChat, setSelectedChat] = useState(null);

  if (!user.user) {
    return <Navigate to="/login" />;
  }

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
