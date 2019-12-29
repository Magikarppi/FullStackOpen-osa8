import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useApolloClient, useLazyQuery } from '@apollo/react-hooks';
import { gql } from 'apollo-boost';

import Authors from './components/Authors';
import Books from './components/Books';
import NewBook from './components/NewBook';
import LoginForm from './components/LoginForm';
import Recommended from './components/Recommended'

const ALL_AUTHORS = gql`
  {
    allAuthors {
      name
      born
      bookCount
      id
    }
  }
`;

const ALL_BOOKS = gql`
  {
    allBooks {
      title
      published
      author {
        name
        born
      }
      id
      genres
      published
    }
  }
`;

const ADD_BOOK = gql`
  mutation addBook(
    $title: String!
    $published: Int!
    $author: String!
    $genres: [String!]!
  ) {
    addBook(
      title: $title
      published: $published
      author: $author
      genres: $genres
    ) {
      title
      published
      author {
        name
        born
        id
      }
      id
      genres
    }
  }
`;

const AUTHOR_BORN = gql`
  mutation setBorn($name: String!, $born: Int!) {
    editAuthor(name: $name, setBornTo: $born) {
      name
      born
      bookCount
      id
    }
  }
`;

const LOGIN = gql`
  mutation login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      value
    }
  }
`;

const USER = gql`
  {
    me {
      username
      favoriteGenre
    }
  }
`

const GENRE_BOOKS = gql`
  query fetchGenre ($genre: String) { 
    allBooks(
    genre: $genre
  ) {
    title
    author {
      name
      born
    }
    published
    id
  }
}
`

const App = ( {client} ) => {
  const [page, setPage] = useState('authors');
  const [errorMessage, setErrorMessage] = useState(null);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [booksToShow, setBooksToShow] = useState(null);

  useEffect(() => {
    const userToken = window.localStorage.getItem('phonenumbers-user-token');
    console.log('userToken', userToken)
    if (userToken) {
      // const user = JSON.parse(loggedUserJSON);
      setToken(userToken);
    }
  }, []);

  // const client = useApolloClient()

  const handleError = (error) => {
    console.log('error:', error);
    setErrorMessage(error.message);
    setTimeout(() => {
      setErrorMessage(null);
    }, 4000);
  };

  const authorsResult = useQuery(ALL_AUTHORS);
  const booksResult = useQuery(ALL_BOOKS, );
  const userResult = useQuery(USER);

  // const booksByUsersGenre = useQuery(GENRE_BOOKS, {
  //     variables: { genre: userResult.data.me.favoriteGenre}
  //   })

    const [booksByUsersGenre, { called, loading, data }] = useLazyQuery(GENRE_BOOKS,)

    console.log('booksbyusersgenre called', called === true)
    console.log('booksByUsersGenre', booksByUsersGenre)

    // useEffect(() => {
    //   booksByUsersGenre( {variables: { genre: userResult.data.me.favoriteGenre}})
    //   // booksByUsersGenre( {variables: { genre: "horror"}})

    // }, [userResult.loading, booksByUsersGenre])


    console.log('data', data)
    // if (data && data.allBooks) {
    //   setBooksToShow(data.allBooks);
    // }
  


  console.log('authorsResult', authorsResult);
  console.log('booksresult', booksResult);

  const [addBook] = useMutation(ADD_BOOK, {
    onError: handleError,
    refetchQueries: [{ query: ALL_AUTHORS }, { query: ALL_BOOKS }],
    fetchPolicy: "no-cache"
  });

  console.log('addBook mut:', addBook);

  const [setBornMut] = useMutation(AUTHOR_BORN, {
    onError: handleError,
    refetchQueries: [{ query: ALL_AUTHORS }]
  });

  const [login] = useMutation(LOGIN, {
    onError: handleError
  });

  const logout = () => {
    console.log('log out runs')
    setToken(null);
    localStorage.clear();
    client.resetStore();
  };

  // if (!token) {
  //   return (
  //     <div>
  //       {errorMessage}
  //       <h2>Login</h2>
  //       <LoginForm login={login} setToken={(token) => setToken(token)} />
  //     </div>
  //   );
  // }

  const handleRecommendations = async () => {
    console.log('userResult', userResult)
    booksByUsersGenre( {variables: { genre: userResult.data.me.favoriteGenre}})
    console.log('lazyQuery has run in handleRecommendations')
    console.log('booksbyUsersGenre.data', booksByUsersGenre.data)
    setPage('rec')
  }

  // const handleGenreFilter = (genre) => {
  //   console.log('genre in handleGenre', genre)
    
  // }

  const loggedInDisplay = () => {
    return (
      <div>
        <div>
        <button onClick={() => setPage('authors')}>authors</button>
          <button onClick={() => setPage('books')}>books</button>
          <button onClick={() => setPage('add')}>add book</button>
          <button onClick={() => handleRecommendations()}>recommendations</button>
          <button onClick={() => logout()}>log out</button>
        </div>
              {errorMessage && <div style={{ color: 'red' }}>{errorMessage}</div>}
  
              <Authors
                show={page === 'authors'}
                authorsResult={authorsResult}
                setBornMut={setBornMut}
              />
        
              <Books show={page === 'books'} booksResult={booksResult} />
        
              <NewBook show={page === 'add'} addBook={addBook} />

              <Recommended show={page === 'rec'} userResult={userResult} loading={loading} data={data} />
      </div>
    )
  }

  const loggedOutDisplay = () => {
    return (
      <div>
      <div>
        {errorMessage}
        <h2>Login</h2>
        <LoginForm login={login} setToken={(token) => setToken(token)} />
      </div>
        <div>
        <button onClick={() => setPage('authors')}>authors</button>
            <button onClick={() => setPage('books')}>books</button>
        </div>
                      {errorMessage && <div style={{ color: 'red' }}>{errorMessage}</div>}
    
                      <Authors
                        show={page === 'authors'}
                        authorsResult={authorsResult}
                        setBornMut={setBornMut}
                      />
                
                      <Books show={page === 'books'} booksResult={booksResult} />
      </div>
    )
  }

  return (
    <div>
      {token ? loggedInDisplay() : loggedOutDisplay()}
    </div>
  )
//   return (
//     <div>
//       <div>
//         <button onClick={() => setPage('authors')}>authors</button>
//         <button onClick={() => setPage('books')}>books</button>
//         <button onClick={() => setPage('add')}>add book</button>
//         {token ? <button onClick={() => logout()}>log out</button> : null}
//       </div>

//       {errorMessage && <div style={{ color: 'red' }}>{errorMessage}</div>}

//       <Authors
//         show={page === 'authors'}
//         authorsResult={authorsResult}
//         setBornMut={setBornMut}
//       />

//       <Books show={page === 'books'} booksResult={booksResult} />

//       <NewBook show={page === 'add'} addBook={addBook} />
//     </div>
//   );
};

export default App;
