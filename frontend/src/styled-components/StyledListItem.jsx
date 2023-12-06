import { ListItem } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledListItem = styled(ListItem, {
  shouldForwardProp: (prop) => prop !== 'objectColor',
})(({ objectColor }) => {
  return {
    border: '2px solid ' + objectColor.main,
    userSelect: 'none',
    borderRadius: '15px',
    '&:hover': {
      border: '2px solid white',
      cursor: 'pointer',
    },

    '&.selected-chat-list-element': {
      border: '2px solid ' + objectColor.main,
      color: 'black',
      backgroundColor: 'white',
      span: {
        color: 'black',
      },
      p: {
        color: 'black',
      },
    },

    'p, span': {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },

    p: {
      fontSize: '14px',
    },
  };
});

export default StyledListItem;
