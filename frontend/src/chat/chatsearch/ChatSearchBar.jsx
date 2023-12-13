import { useContext, useState } from 'react';
import DBHelper from '../../DBHelper';
import StyledTextField from '../../styled-components/StyledTextField';
import ChatSearchResultList from './ChatSearchResultList';
import UserContext from '../../UserContext';

const ChatSearchBar = ({ handleSelect }) => {
  const [searchValue, setSearchValue] = useState('');
  const [suggestedUsers, setSuggestedUsers] = useState(null);
  const userContext = useContext(UserContext);

  const handleInput = async (event) => {
    event.preventDefault();
    setSearchValue(event.target.value);

    if (event.target.value && event.target.value.length > 0) {
      const response = await DBHelper.makeHTTPRequest(
        'search/' + event.target.value,
        'GET'
      );
      if (response.successful) {
        setSuggestedUsers(
          response.data.filter((u) => u.id !== userContext.user.id)
        );
      }
    } else {
      setSuggestedUsers(null);
    }
  };
  return (
    <>
      <StyledTextField
        objectColor={{ main: '#FFF' }}
        sx={{ width: '100%' }}
        placeholder="search for users..."
        onChange={handleInput}
        value={searchValue}
      />
      <ChatSearchResultList
        suggestedUsers={suggestedUsers}
        setSuggestedUsers={setSuggestedUsers}
        handleSelect={handleSelect}
        setSearchValue={setSearchValue}
      />
    </>
  );
};

export default ChatSearchBar;
