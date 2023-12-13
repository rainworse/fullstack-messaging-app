import { ListItemAvatar } from '@mui/material';
import StyledAvatar from '../../styled-components/StyledAvatar';

const ChatListItemAvatar = ({ chatInfo }) => {
  return (
    <ListItemAvatar>
      <StyledAvatar
        src={'data:image/jpg;base64,' + chatInfo.chatIcon}
        alt={
          chatInfo.lastMessageUser && chatInfo.lastMessageUser.username
            ? chatInfo.lastMessageUser.username
            : ''
        }
      />
    </ListItemAvatar>
  );
};

export default ChatListItemAvatar;
