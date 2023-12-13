import { ListItemText } from '@mui/material';

const ChatListItemText = ({ chatInfo }) => {
  return (
    <ListItemText
      primary={chatInfo.chatName}
      secondary={
        chatInfo.id === 'newchat' ? (
          ''
        ) : (
          <span className="chat-list-item-wrapper">
            <span className="chat-list-item-secondary-from">
              {chatInfo.lastMessageUser && chatInfo.lastMessageUser.username
                ? chatInfo.lastMessageUser.username + ': '
                : ''}
            </span>
            {chatInfo.lastMessage && chatInfo.lastMessage.text
              ? chatInfo.lastMessage.text
              : ''}
          </span>
        )
      }
      sx={{ color: 'white' }}
    />
  );
};

export default ChatListItemText;
