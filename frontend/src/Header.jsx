import { Link as RouterLink } from 'react-router-dom';
import Resizer from 'react-image-file-resizer';
import StyledTypography from './styled-components/StyledTypography';
import StyledLink from './styled-components/StyledLink';
import { Box, useTheme } from '@mui/material';

import UserContext from './UserContext';
import { useContext, useEffect, useRef, useState } from 'react';
import StyledAvatar from './styled-components/StyledAvatar';

import DBHelper from './DBHelper';

const Header = () => {
  const theme = useTheme();
  const userContext = useContext(UserContext);

  const [username, setUsername] = useState(null);
  const [userImage, setUserImage] = useState('');

  const fileChooser = useRef(null);

  useEffect(() => {
    if (
      userContext.userIsValid(userContext.user) &&
      userContext.user.userData
    ) {
      setUsername(userContext.user.userData.username);
      setUserImage(
        'data:image/jpg;base64,' + userContext.user.userData.profileImage
      );
    }

    if (fileChooser.current) {
      fileChooser.current.addEventListener('cancel', imageChooserCancelled);
      fileChooser.current.addEventListener('change', imageChosen);
    }
  }, []);

  const logout = () => {
    userContext.setUser(null, null);
  };

  const openImageChooser = (event) => {
    event.preventDefault();
    fileChooser.current.click();
  };

  const imageChooserCancelled = () => {
    console.log('Cancelled.');
  };

  const imageChosen = () => {
    if (fileChooser.current.files.length == 1) {
      const sendImage = async (uri) => {
        const response = await DBHelper.makeHTTPRequest(
          `user/${userContext.user.id}/image/set`,
          'POST',
          { image: uri }
        );
        if (response.successful) {
          userContext.setUserImage(uri);
          setUserImage(uri);
        }
      };

      Resizer.imageFileResizer(
        fileChooser.current.files[0],
        250,
        250,
        'JPEG',
        50,
        0,
        sendImage,
        'base64'
      );
    }
  };

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
        <div>
          <StyledAvatar
            alt={username}
            src={userImage}
            size="45px"
            sx={{
              marginRight: '10px',
              '&:hover': { filter: 'brightness(200%)', cursor: 'pointer' },
            }}
            onClick={openImageChooser}
          />
        </div>
        <input
          type="file"
          id="file"
          accept="image/png, image/jpeg"
          ref={fileChooser}
          style={{ display: 'none' }}
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
