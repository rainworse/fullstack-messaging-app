import { Button, FormControl } from '@mui/material';
import StyledTextField from '../styled-components/StyledTextField';
import { useState } from 'react';

const MessageInput = ({ sendMessage }) => {
  const [messageText, setMessageText] = useState('');

  const sendCurrentMessage = (event) => {
    event.preventDefault();
    sendMessage(messageText);
    setMessageText('');
  };

  return (
    <form
      method="POST"
      onSubmit={sendCurrentMessage}
      className="chat-send-message"
    >
      <FormControl
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: '10px',
        }}
      >
        <StyledTextField
          type="text"
          id="outlined-basic"
          label=""
          placeholder="text"
          variant="outlined"
          objectColor={{ main: 'white' }}
          onChange={(e) => setMessageText(e.target.value)}
          sx={{ width: '100%' }}
          value={messageText}
          multiline
        />
        <Button type="submit" sx={{ marginLeft: '-80px', height: '40px' }}>
          Send
        </Button>
      </FormControl>
    </form>
  );
};

export default MessageInput;
