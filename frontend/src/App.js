import React, { useState, useEffect } from 'react';
import {
  useQuery,
  useMutation,
  useApolloClient,
  useLazyQuery,
  useSubscription
} from '@apollo/react-hooks';
import { gql } from 'apollo-boost';

import Authors from './components/Authors';
import Books from './components/Books';
import NewBook from './components/NewBook';
import LoginForm from './components/LoginForm';
import Recommended from './components/Recommended';

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
        id
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
`;

const GENRE_BOOKS = gql`
  query fetchGenre($genre: String) {
    allBooks(genre: $genre) {
      title
      author {
        name
        born
        id
      }
      published
      id
    }
  }
`;

const BOOK_ADDED = gql`
  subscription {
    bookAdded {
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

const App = () => {
  const [page, setPage] = useState('authors');
  const [errorMessage, setErrorMessage] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const userToken = window.localStorage.getItem('books-user-token');
    console.log('userToken', userToken);
    if (userToken) {
      setToken(userToken);
    }
  }, []);

  const client = useApolloClient();

  const handleError = (error) => {
    console.log('error:', error);
    setErrorMessage(error.message);
    setTimeout(() => {
      setErrorMessage(null);
    }, 4000);
  };

  const authorsResult = useQuery(ALL_AUTHORS);
  const booksResult = useQuery(ALL_BOOKS);
  const userResult = useQuery(USER);

  const [booksByUsersGenre, { loading, data }] = useLazyQuery(
    GENRE_BOOKS
  );

  const [addBook] = useMutation(ADD_BOOK, {
    onError: handleError,
    refetchQueries: [{ query: ALL_AUTHORS }, { query: ALL_BOOKS }],
    fetchPolicy: 'no-cache'
  });

  console.log('addBook mut:', addBook);

  const [setBornMut] = useMutation(AUTHOR_BORN, {
    onError: handleError,
    refetchQueries: [{ query: ALL_AUTHORS }]
  });

  const [login] = useMutation(LOGIN, {
    onError: handleError
  });

  const updateCacheWith = (addedBook) => {
    const includedIn = (set, object) =>
      set.map((p) => p.id).includes(object.id);

    const dataInStore = client.readQuery({ query: ALL_BOOKS });
    if (!includedIn(dataInStore.allBooks, addedBook)) {
      client.writeQuery({
        query: ALL_BOOKS,
        data: { allBooks: dataInStore.allBooks.concat(addedBook) }
      });
    }
  };
  useSubscription(BOOK_ADDED, {
    onSubscriptionData: ({ subscriptionData }) => {
      const addedBook = subscriptionData.data.bookAdded;
      window.alert(`${addedBook.title} added`);
      updateCacheWith(addedBook);
    }
  });

  const logout = () => {
    setToken(null);
    localStorage.clear();
    client.resetStore();
  };

  const handleRecommendations = async () => {
    booksByUsersGenre({
      variables: { genre: userResult.data.me.favoriteGenre }
    });
    setPage('rec');
  };

  const loggedInDisplay = () => {
    return (
      <div>
        <div>
          <button onClick={() => setPage('authors')}>authors</button>
          <button onClick={() => setPage('books')}>books</button>
          <button onClick={() => setPage('add')}>add book</button>
          <button onClick={() => handleRecommendations()}>
            recommendations
          </button>
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

        <Recommended
          show={page === 'rec'}
          userResult={userResult}
          loading={loading}
          data={data}
        />
      </div>
    );
  };

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
    );
  };

  return <div>{token ? loggedInDisplay() : loggedOutDisplay()}</div>;
};

export default App;
