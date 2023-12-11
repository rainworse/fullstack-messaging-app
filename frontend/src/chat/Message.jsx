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
          sx={{ display: 'flex', alignItems: 'center' }}
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
              border: '2px solid ' + color.main,
              borderRadius: '1rem',
              background: 'white',
              color: 'black',
              paddingTop: '5px',
              paddingBottom: '5px',
              paddingLeft: '10px',
              paddingRight: '10px',
            }}
            className="this-user-message"
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
            border: '2px solid ' + color.main,
            borderRadius: '1rem',
            paddingTop: '5px',
            paddingBottom: '5px',
            paddingLeft: '10px',
            paddingRight: '10px',
          }}
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
