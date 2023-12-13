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
            .map((m) => {
              m.lastMessage.text = m.lastMessage.text.replaceAll('&#x27;', "'");
              m.lastMessage.text = m.lastMessage.text.replaceAll('&quot;', '"');
              return m;
            })
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
    if (clickedChat) {
      const clickedElement = clickedChat.firstChild;
      if (clickedElement && id !== selectedChat) {
        if (selectedListItem !== null && selectedListItem.newChat) {
          removeNewChat(id, setUserChats);
        }
        setSelectedChat(id);
        if (id.newChat) clickedElement.newChat = true;
        selectedListItem = clickedElement;
      }
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

  const handleWSMessage = async (receivedData, setUserChats) => {
    if (receivedData.type === 'message') {
      setUserChats((prevUserChats) => {
        let chatToUpdate = prevUserChats.find(
          (c) => c.id === receivedData.chatID
        );
        chatToUpdate.lastMessage = receivedData.message;
        chatToUpdate.lastMessage.dateSent = Date.now();
        chatToUpdate.lastMessageUser = {
          id: receivedData.message.from,
          username: receivedData.fromUsername,
        };
        chatToUpdate.lastMessage.text =
          chatToUpdate.lastMessage.text.replaceAll('&#x27;', "'");
        chatToUpdate.lastMessage.text =
          chatToUpdate.lastMessage.text.replaceAll('&quot;', '"');

        return prevUserChats
          .map((c) => {
            if (c.id === chatToUpdate.id) return chatToUpdate;
            return c;
          })
          .sort((o1, o2) => {
            return (
              new Date(o2.lastMessage.dateSent) -
              new Date(o1.lastMessage.dateSent)
            );
          });
      });
    } else if (receivedData.type === 'new_chat_message') {
      const response = await DBHelper.makeHTTPRequest(
        'chatdata/' + receivedData.chatID,
        'GET'
      );
      if (response.successful) {
        setUserChats((prevUserChats) => {
          return [response.data, ...prevUserChats];
        });
      }
    } else if (receivedData.type === 'delete_message') {
      if (receivedData.isLastMessage) {
        const response = await DBHelper.makeHTTPRequest(
          `chat/${receivedData.chatID}/lastmessage`,
          'GET'
        );
        if (response.successful) {
          setUserChats((prevUserChats) => {
            return prevUserChats.map((c) => {
              if (c.id === receivedData.chatID) {
                const newLastMessage = response.data;
                if (!newLastMessage.message) {
                  newLastMessage.message = null;
                  newLastMessage.lastMessageUser = {
                    _id: null,
                    username: null,
                  };
                }
                c.lastMessage.text = newLastMessage.message;
                c.lastMessage.text = c.lastMessage.text.replaceAll(
                  '&#x27;',
                  "'"
                );
                c.lastMessage.text = c.lastMessage.text.replaceAll(
                  '&quot;',
                  '"'
                );

                c.lastMessageUser.id = newLastMessage.lastMessageUser._id;
                c.lastMessageUser.username =
                  newLastMessage.lastMessageUser.username;
                return c;
              }
              return c;
            });
          });
        }
      }
    }
  };

  return { initChatList, chatClicked, searchResultSelected, handleWSMessage };
})();

export default ChatListController;
