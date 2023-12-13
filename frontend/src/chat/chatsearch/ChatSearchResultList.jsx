import { Box } from '@mui/material';
import DBHelper from '../../DBHelper';
import ChatSearchResults from './ChatSearchResults';

const SearchResultList = ({
  suggestedUsers,
  setSuggestedUsers,
  handleSelect,
  setSearchValue,
}) => {
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
        <ChatSearchResults
          suggestedUsers={suggestedUsers}
          handleSearchResultClick={handleSearchResultClick}
        />
      </Box>
    </Box>
  );
};

export default SearchResultList;
