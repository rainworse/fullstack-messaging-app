import { ListItemAvatar, ListItemText } from '@mui/material';
import StyledListItem from '../styled-components/StyledListItem';
import StyledAvatar from '../styled-components/StyledAvatar';
import { useEffect } from 'react';

const ChatListItem = ({
  chatInfo,
  borderColor,
  clickHandler,
  selectedChat,
}) => {
  useEffect(() => {
    if (chatInfo.id === 'newchat') {
      clickHandler({ newChat: true, recipientID: chatInfo.recipientID });
    }
  }, []);
  return (
    <StyledListItem
      key={chatInfo.id}
      objectColor={borderColor}
      sx={{ marginBottom: '10px' }}
      onClick={(e) => {
        clickHandler(chatInfo.id);
      }}
      className={
        chatInfo.id === 'newchat' || chatInfo.id === selectedChat
          ? 'selected-chat-list-element'
          : ''
      }
    >
      <ListItemAvatar>
        <StyledAvatar
          src={'data:image/jpg;base64,' + chatInfo.chatIcon}
          alt={chatInfo.lastMessageUser.username}
        />
      </ListItemAvatar>
      <ListItemText
        primary={chatInfo.chatName}
        secondary={
          chatInfo.id === 'newchat' ? (
            ''
          ) : (
            <span className="chat-list-item-wrapper">
              <span className="chat-list-item-secondary-from">
                {chatInfo.lastMessageUser.username + ': '}
              </span>
              {chatInfo.lastMessage.text}
            </span>
          )
        }
        sx={{ color: 'white' }}
      />
    </StyledListItem>
  );
};

export default ChatListItem;
