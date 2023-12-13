import ChatSearchResultListItem from './ChatSearchResultListItem';

const ChatSearchResults = ({ suggestedUsers, handleSearchResultClick }) => {
  return suggestedUsers.map((u, i) => {
    return (
      <ChatSearchResultListItem
        user={u}
        indexInList={i}
        handleSearchResultClick={handleSearchResultClick}
        key={u.id}
      />
    );
  });
};

export default ChatSearchResults;
