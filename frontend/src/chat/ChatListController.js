import DBHelper from '../DBHelper';

const ChatListController = (() => {
  const initChatList = (userContext, setUserChats) => {
    const getUserChats = async () => {
      const response = await DBHelper.makeHTTPRequest(
        'user/' + userContext.user.id + '/chats',
        'GET'
      );
      if (response.successful) {
        setUserChats(
          response.data
            .filter((c) => c.lastMessage)
            .sort((o1, o2) => {
              return (
                new Date(o2.lastMessage.dateSent) -
                new Date(o1.lastMessage.dateSent)
              );
            })
        );
      }
    };

    if (userContext.userIsValid(userContext.user)) {
      getUserChats();
    }
  };

  let selectedListItem = null;
  const chatClicked = (
    id,
    chatRefs,
    selectedChat,
    setSelectedChat,
    setUserChats
  ) => {
    const clickedChat = id.newChat ? chatRefs.get('newchat') : chatRefs.get(id);
    const clickedElement = clickedChat.firstChild;
    if (clickedElement && id !== selectedChat) {
      if (selectedListItem !== null && selectedListItem.newChat) {
        removeNewChat(id, setUserChats);
      }
      setSelectedChat(id);
      if (id.newChat) clickedElement.newChat = true;
      selectedListItem = clickedElement;
    }
  };

  const removeNewChat = (id, setUserChats) => {
    if (!id.newChat && id !== 'newchat') {
      setUserChats((prevChats) => {
        return prevChats.filter((c) => c.id !== 'newchat');
      });
      selectedListItem = null;
    }
  };

  const searchResultSelected = (
    chatID,
    recipient,
    selectedChat,
    setSelectedChat,
    setUserChats,
    chatRefs
  ) => {
    if (chatID) {
      chatClicked(
        chatID,
        chatRefs.current,
        selectedChat,
        setSelectedChat,
        setUserChats
      );
    } else {
      const newChat = {
        id: 'newchat',
        recipientID: recipient.id,
        chatName: recipient.username,
        chatIcon: recipient.profileImage,
        lastMessageUser: { username: '' },
        lastMessage: { text: '' },
      };
      if (selectedListItem && selectedListItem.newChat) {
        setUserChats((prevChats) => {
          const chats = prevChats.map((c) => {
            if (c.id === 'newchat') return newChat;
            else return c;
          });
          return chats;
        });
      } else {
        setUserChats((prevChats) => {
          const chats = [newChat, ...prevChats];
          return chats;
        });
      }
    }
  };

  return { initChatList, chatClicked, searchResultSelected };
})();

export default ChatListController;
