import { useContext, useState } from 'react';
import { Navigate, Link as RouterLink } from 'react-router-dom';

import UserContext from './UserContext';

import StyledTextField from './styled-components/StyledTextField';
import { Box, FormControl, Typography, useTheme } from '@mui/material';
import { Button } from '@mui/material';
import DBHelper from './DBHelper';
import StyledLink from './styled-components/StyledLink';

const Login = () => {
  const user = useContext(UserContext);
  const theme = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);

  if (user.user) {
    return <Navigate to="/" />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationerrs = [];
    if (username.length < 3) {
      validationerrs.push('Username must be at least 3 characters long.');
    }
    if (password.length < 3) {
      validationerrs.push('Password must be at least 3 characters long.');
    }

    if (validationerrs.length === 0) {
      const response = await DBHelper.makeHTTPRequest('login', 'POST', {
        username,
        password,
      });

      if (!response.successful) {
        validationerrs.push(response.data.message);
      } else {
        user.setUser(response.data.id, response.data.token);
      }
    }

    setValidationErrors(validationerrs);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <StyledLink
        component={RouterLink}
        to={'/register'}
        sx={{
          alignSelf: 'end',
          fontSize: '15px',
          marginTop: '20px',
          fontWeight: '500',
        }}
      >
        REGISTER
      </StyledLink>

      <form method="POST" onSubmit={handleSubmit}>
        <FormControl
          sx={{
            marginTop: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyItems: 'center',
          }}
        >
          <Box sx={{ height: '4rem' }}>
            {validationErrors.length === 0 ? (
              ''
            ) : (
              <Box display={'flex'}>
                <Typography sx={{ color: 'red', marginRight: '10px' }}>
                  *
                </Typography>
                <Box>
                  {validationErrors.map((e, i) => {
                    return (
                      <Typography sx={{ color: 'red' }} key={i}>
                        {e}
                      </Typography>
                    );
                  })}
                </Box>
              </Box>
            )}
          </Box>

          <StyledTextField
            id="outlined-basic"
            label=""
            placeholder="username"
            variant="outlined"
            objectColor={theme.palette.primary}
            sx={{ marginBottom: '10px' }}
            onChange={(e) => setUsername(e.target.value)}
          />

          <StyledTextField
            type="password"
            id="outlined-basic"
            label=""
            placeholder="password"
            variant="outlined"
            objectColor={theme.palette.secondary}
            sx={{ marginBottom: '10px' }}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button type="submit">Login</Button>
        </FormControl>
      </form>
    </Box>
  );
};

export default Login;
