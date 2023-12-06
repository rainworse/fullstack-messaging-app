import { Box, Typography } from '@mui/material';

const Message = ({ message, user, color, sentByThisUser }) => {
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
        >
          <Typography sx={{ width: '100%', overflowWrap: 'break-word' }}>
            {message}
          </Typography>
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
          <Typography sx={{ width: '100%', overflowWrap: 'break-word' }}>
            {message}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default Message;
