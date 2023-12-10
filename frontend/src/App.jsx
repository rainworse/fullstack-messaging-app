import { useEffect, useState } from 'react';
import { createBrowserRouter, json, RouterProvider } from 'react-router-dom';
import ErrorPage from './ErrorPage';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Container } from '@mui/material';

import UserContext from './UserContext';
import Content from './Content';
import Login from './Login';
import DBHelper from './DBHelper';
import Register from './Register';

const theme = createTheme({
  palette: {
    primary: {
      main: '#FF3CE2',
      light: '#ff85ea',
      dark: '#8f00b9',
      contrastText: '#fff',
    },

    secondary: {
      main: '#3c80ff',
      light: '#66b1ff',
      dark: '#3c38b7',
      contrastText: '#fff',
    },

    third: {
      main: '#3cff59',
      light: '#77ff7e',
      dark: '#009900',
      contrastText: '#fff',
    },

    fourth: {
      main: '#ffbb3c',
      light: '#ffd04c',
      dark: '#f87e30',
      contrastText: '#fff',
    },

    mode: 'dark',
  },

  components: {
    MuiTextField: {
      root: { borderRadius: '20px' },
    },
  },
});

const router = createBrowserRouter([
  {
    path: '/',
    element: <Content />,
    errorElement: <ErrorPage />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
]);

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const getUserFromLocalStorage = async () => {
      let user = JSON.parse(localStorage.getItem('currentUser'));
      if (user) {
        DBHelper.setToken(user.token);
        const response = await DBHelper.makeHTTPRequest('verifyToken', 'GET');
        if (!response.successful) {
          user = null;
        } else {
          const userData = await getUserData(user.id);
          user.userData = userData;
        }
      } else {
        user = { id: '', token: '', userData: '' };
      }
      setCurrentUser(user);
    };

    getUserFromLocalStorage();
  }, []);

  const userIsValid = (user) => {
    return (
      user &&
      user.id &&
      user.token &&
      user.id.length > 0 &&
      user.token.length > 0
    );
  };

  const getUserData = async (id) => {
    const response = await DBHelper.makeHTTPRequest('user/' + id, 'GET');

    if (response.successful) return response.data;
    return null;
  };

  const setUser = async (id, token) => {
    if (id !== null && token !== null) {
      const userData = await getUserData(id);
      setCurrentUser({ id, token, userData });
      localStorage.setItem('currentUser', JSON.stringify({ id, token }));
    } else {
      setCurrentUser({});
      localStorage.removeItem('currentUser');
    }
    DBHelper.setToken(token);
  };

  return (
    <div id="app-root">
      <ThemeProvider theme={theme}>
        <UserContext.Provider
          value={{ user: currentUser, setUser, userIsValid }}
        >
          <Container id="root-container">
            <RouterProvider router={router} />
          </Container>
        </UserContext.Provider>
      </ThemeProvider>
    </div>
  );
}

export default App;
