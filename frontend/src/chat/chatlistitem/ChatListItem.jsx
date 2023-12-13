import StyledListItem from '../../styled-components/StyledListItem';
import { useEffect } from 'react';
import ChatListItemAvatar from './ChatListItemAvatar';
import ChatListItemText from './ChatListItemText';

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
      <ChatListItemAvatar chatInfo={chatInfo} />
      <ChatListItemText chatInfo={chatInfo} />
    </StyledListItem>
  );
};

export default ChatListItem;
