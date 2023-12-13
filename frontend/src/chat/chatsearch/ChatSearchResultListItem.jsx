import { ListItemAvatar, ListItemText, useTheme } from '@mui/material';
import StyledListItem from '../../styled-components/StyledListItem';
import StyledAvatar from '../../styled-components/StyledAvatar';
import StyleHelper from '../../styles/StyleHelper';

const ChatSearchResultListItem = ({
  user,
  indexInList,
  handleSearchResultClick,
}) => {
  const theme = useTheme();

  return (
    <StyledListItem
      key={user.id}
      objectColor={StyleHelper.getBorderColor(theme, indexInList)}
      sx={{ color: 'white', borderTop: 'none' }}
      onClick={(e) => handleSearchResultClick(e, user)}
    >
      <ListItemAvatar>
        <StyledAvatar
          src={'data:image/jpg;base64,' + user.profileImage}
          alt={user.username}
          size="25px"
        />
      </ListItemAvatar>
      <ListItemText primary={user.username} />
    </StyledListItem>
  );
};

export default ChatSearchResultListItem;
