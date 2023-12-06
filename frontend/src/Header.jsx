import { Link as RouterLink } from 'react-router-dom';
import StyledTypography from './styled-components/StyledTypography';
import StyledLink from './styled-components/StyledLink';
import { Box, useTheme } from '@mui/material';

import UserContext from './UserContext';
import { useContext, useEffect, useState } from 'react';
import DBHelper from './DBHelper';
import StyledAvatar from './styled-components/StyledAvatar';

const Header = () => {
  const theme = useTheme();
  const userContext = useContext(UserContext);

  const [username, setUsername] = useState(null);
  const [userImage, setUserImage] = useState('');

  const logout = () => {
    userContext.setUser(null);
  };

  useEffect(() => {
    const getUserInfo = async () => {
      const response = await DBHelper.makeHTTPRequest(
        'user/' + userContext.user.id,
        'GET'
      );
      if (response.successful) {
        setUsername(response.data.username);
        setUserImage('data:image/jpg;base64,' + response.data.profileImage);
      } else {
        setUsername(null);
        setUserImage(null);
      }
    };

    getUserInfo();
  }, []);

  return (
    <Box
      className="header-container"
      sx={{
        display: 'flex',
        width: '100%',
        alignItems: 'center',
      }}
    >
      <Box sx={{ marginRight: 'auto', display: 'flex', alignItems: 'center' }}>
        <StyledAvatar
          alt={username}
          src={userImage}
          size="45px"
          sx={{ marginRight: '10px' }}
        />

        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {username === null ? (
            ''
          ) : (
            <StyledTypography
              textColor={theme.palette.secondary}
              sx={{ fontSize: '15px', fontWeight: '500' }}
            >
              {username}
            </StyledTypography>
          )}

          <StyledLink
            component={RouterLink}
            onClick={logout}
            sx={{
              marginLeft: 'auto',
              fontSize: '15px',
              fontWeight: '500',
            }}
          >
            LOGOUT
          </StyledLink>
        </Box>
      </Box>
    </Box>
  );
};

export default Header;
