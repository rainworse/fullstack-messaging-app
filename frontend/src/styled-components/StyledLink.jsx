import { Link } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledLink = styled(Link)(() => {
  return {
    textDecoration: 'none',
    fontFamily: 'Roboto, sans-serif',
  };
});

export default StyledLink;
