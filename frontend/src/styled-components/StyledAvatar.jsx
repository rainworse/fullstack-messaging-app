import { Avatar } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledAvatar = styled(Avatar, {
  shouldForwardProp: (prop) => prop !== 'size',
})(({ size }) => {
  return {
    width: size,
    height: size,
  };
});

export default StyledAvatar;
