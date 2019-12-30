import React, { useState, useEffect } from 'react';
import { useLazyQuery } from '@apollo/react-hooks';
import { gql } from 'apollo-boost';

const GENRE_BOOKS = gql`
  query fetchGenre($genre: String) {
    allBooks(genre: $genre) {
      title
      author {
        name
        born
      }
      published
      id
      genres
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

const Books = ({ booksResult, show }) => {
  const [genreFilter, setGenreFilter] = useState('');
  const [booksToShow, setBooksToShow] = useState([]);

  const [
    booksByGenre,
    {
      called: booksByGenreCalled,
      loading: booksByGenreLoading,
      data: booksByGenreData
    }
  ] = useLazyQuery(GENRE_BOOKS);

  const [
    fetchedBooks,
    {
      called: fetchedBooksCalled,
      loading: fetchedBooksLoading,
      data: fetchedBooksData
    }
  ] = useLazyQuery(ALL_BOOKS);

  useEffect(() => {
    if (!booksResult.loading) {
      setBooksToShow([...booksResult.data.allBooks]);
    }
  }, [booksResult.loading]);

  useEffect(() => {
    if (!fetchedBooksLoading && fetchedBooksData !== undefined) {
      setBooksToShow([...fetchedBooksData.allBooks]);
    }
  }, [fetchedBooksLoading, fetchedBooksData, fetchedBooksCalled]);

  useEffect(() => {
    if (!booksByGenreLoading && booksByGenreData !== undefined) {
      setBooksToShow([...booksByGenreData.allBooks]);
    }
  }, [booksByGenreLoading, booksByGenreData, booksByGenreCalled]);

  if (!show) {
    return null;
  }

  if (booksResult.loading) {
    return <div>loading...</div>;
  }

  if (!booksResult.data) {
    return null;
  }

  const filterByGenre = (genre) => {
    setGenreFilter(genre);

    booksByGenre({
      variables: { genre: genre },
      fetchPolicy: 'no-cache',
      pollInterval: 500
    });
  };

  const displayGenres = () => {
    let genres = [];

    booksResult.data.allBooks.map((book) => {
      book.genres.map((genre) => {
        return genres.find((e) => e === genre) === genre
          ? null
          : genres.push(genre);
      });
      return booksToShow;
    });
    return (
      <div>
        {genres.map((genre) => (
          <button onClick={() => filterByGenre(genre)} key={genre}>
            {genre}
          </button>
        ))}
      </div>
    );
  };

  const getAllBooks = () => {
    setGenreFilter('');
    fetchedBooks({
      fetchPolicy: 'no-cache'
    });
  };

  if (booksByGenreLoading || fetchedBooksLoading) {
    return <div>loading...</div>;
  }

  if (genreFilter !== '') {
    return (
      <div>
        <h2>Books</h2>

        <table>
          <tbody>
            <tr>
              <th></th>
              <th>author</th>
              <th>published</th>
            </tr>
            {booksToShow.map((book) => (
              <tr key={book.title}>
                <td>{book.title}</td>
                <td>{book.author.name}</td>
                <td>{book.published}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {displayGenres()}
        <button onClick={() => getAllBooks()}>all</button>
      </div>
    );
  }

  if (fetchedBooksData !== undefined && fetchedBooksCalled) {
    return (
      <div>
        <h2>Books</h2>

        <table>
          <tbody>
            <tr>
              <th></th>
              <th>author</th>
              <th>published</th>
            </tr>
            {fetchedBooksData.allBooks.map((book) => (
              <tr key={book.title}>
                <td>{book.title}</td>
                <td>{book.author.name}</td>
                <td>{book.published}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {displayGenres()}
        <button onClick={() => getAllBooks()}>all</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Books</h2>

      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {booksToShow.map((book) => (
            <tr key={book.title}>
              <td>{book.title}</td>
              <td>{book.author.name}</td>
              <td>{book.published}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {displayGenres()}
      <button onClick={() => getAllBooks()}>all</button>
    </div>
  );
};

export default Books;
