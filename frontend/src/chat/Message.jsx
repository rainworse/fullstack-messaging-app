import { Box, Typography } from '@mui/material';
import StyledDeleteForeverIcon from '../styled-components/StyledDeleteForeverIcon';

const Message = ({
  message,
  id,
  deleteMessageHandler,
  color,
  sentByThisUser,
}) => {
  return (
    <Box
      sx={{
        maxWidth: '60%',
        alignSelf: sentByThisUser ? 'flex-end' : 'flex-start',
        marginBottom: '3px',
      }}
    >
      {sentByThisUser ? (
        <Box
          sx={{ display: 'flex', alignItems: 'center', maxWidth: '100%' }}
          className="this-user-message-wrapper"
        >
          <StyledDeleteForeverIcon
            sx={{ fontSize: '27px', marginRight: '5px' }}
            className="delete-message-icon"
            onClick={() => {
              deleteMessageHandler(id);
            }}
          />
          <Box
            sx={{
              borderColor: color.main,
              background: 'white',
              color: 'black',
              boxSizing: 'border-box',
            }}
            className="this-user-message message"
          >
            <Typography
              sx={{
                width: '100%',
                display: 'inline-block',
                overflowWrap: 'break-word',
              }}
            >
              {message}
            </Typography>
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            borderColor: color.main,
          }}
          className="message"
        >
          <Typography
            sx={{
              width: '100%',
              display: 'inline-block',
              overflowWrap: 'break-word',
            }}
          >
            {message}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default Message;
