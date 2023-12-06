import { Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledTypography = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'textColor',
})(({ textColor }) => {
  return {
    color: textColor.main,
  };
});

export default StyledTypography;
