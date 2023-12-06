import { TextField } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledTextField = styled(TextField, {
  shouldForwardProp: (prop) => prop !== 'objectColor',
})(({ objectColor }) => {
  return {
    color: 'blue',
    '& .MuiInputBase-root': {
      borderRadius: '20px',
    },

    '& .MuiOutlinedInput-root': {
      fieldset: {
        border: '2px solid ' + objectColor.main,
      },
      '&:hover fieldset': {
        border: '2px solid ' + objectColor.light,
      },
      '&.Mui-focused fieldset': {
        border: '2px solid white',
      },
    },
  };
});

export default StyledTextField;
