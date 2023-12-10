import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { styled } from '@mui/material/styles';

const StyledDeleteForeverIcon = styled(DeleteForeverIcon)(() => {
  return {
    display: 'none',
    borderRadius: '5px',
    padding: '2px',
    '&:hover': {
      background: '#313131',
    },
  };
});

export default StyledDeleteForeverIcon;
