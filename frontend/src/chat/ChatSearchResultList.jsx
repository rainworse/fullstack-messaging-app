import { Box, ListItemAvatar, ListItemText, useTheme } from '@mui/material';
import StyledListItem from '../styled-components/StyledListItem';
import StyledAvatar from '../styled-components/StyledAvatar';
import StyleHelper from '../styles/StyleHelper';
import DBHelper from '../DBHelper';

const SearchResultList = ({
  suggestedUsers,
  setSuggestedUsers,
  handleSelect,
  setSearchValue,
}) => {
  const theme = useTheme();

  const handleSearchResultClick = async (event, user) => {
    event.preventDefault();
    const result = await DBHelper.makeHTTPRequest(
      'chat/user/' + user.id,
      'GET'
    );
    let chatID = null;
    if (result.successful) {
      chatID = result.data._id;
    }

    handleSelect(chatID, user);
    setSuggestedUsers(null);
    setSearchValue('');
  };

  return suggestedUsers === null ? null : (
    <Box sx={{ position: 'relative' }}>
      <Box
        sx={{
          width: '100%',
          position: 'absolute',
          background: 'black',
          zIndex: '10',
          borderRadius: '15px',
        }}
      >
        {suggestedUsers.map((u, i) => {
          return (
            <StyledListItem
              key={u.id}
              objectColor={StyleHelper.getBorderColor(theme, i)}
              sx={{ color: 'white', borderTop: 'none' }}
              onClick={(e) => handleSearchResultClick(e, u)}
            >
              <ListItemAvatar>
                <StyledAvatar
                  src={'data:image/jpg;base64,' + u.profileImage}
                  alt={u.username}
                  size="25px"
                />
              </ListItemAvatar>
              <ListItemText primary={u.username} />
            </StyledListItem>
          );
        })}
      </Box>
    </Box>
  );
};

export default SearchResultList;
