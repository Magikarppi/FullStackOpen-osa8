import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useApolloClient, useLazyQuery } from '@apollo/react-hooks';
import { gql } from 'apollo-boost';

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



const Books = ({booksResult, show}) => {
  const [genreFilter, setGenreFilter] = useState('')
  const [booksToShow, setBooksToShow] = useState([])
  
  const [booksByGenre, { called: booksByGenreCalled ,loading: booksByGenreLoading, data: booksByGenreData }] = useLazyQuery(GENRE_BOOKS,)

  const [fetchedBooks, { called: fetchedBooksCalled, loading: fetchedBooksLoading, data: fetchedBooksData }] = useLazyQuery(ALL_BOOKS,)

  useEffect(() => {
    console.log('BooksResult', booksResult)
    if (!booksResult.loading) {
      setBooksToShow([...booksResult.data.allBooks])

    }
  }, [booksResult.loading])

  useEffect(() => {
    console.log('BooksResult', booksResult)
    if (!fetchedBooksLoading && fetchedBooksData !== undefined) {
      setBooksToShow([...fetchedBooksData.allBooks])

    }
  }, [fetchedBooksLoading, fetchedBooksData])

  console.log('FetchedBooksDAta', fetchedBooksData)
  console.log('booksToShow', booksToShow)
  console.log('booksByGenreData in Books', booksByGenreData)
  
  if (!show) {
    return null
  }

  if (booksResult.loading ) {
    console.log('loading')
    return <div>loading...</div>
  }

  console.log('booksresult:', booksResult)

  if (!booksResult.data) {
    return null
  }

  // setBooksToShow([...booksResult.data.allBooks])
  // let books = [...booksResult.data.allBooks]


  const filterByGenre = (genre) => {
    console.log('genre in filterBygenre', genre)
    setGenreFilter(genre)

    booksByGenre( {
      variables: { genre: genre},
      fetchPolicy: "no-cache",
      pollInterval: 500
    })
    console.log('BooksByGenreCalled', booksByGenreCalled)
  }

  console.log('BooksByGenreCalled', booksByGenreCalled)

  const displayGenres = () => {
    let genres = []

    booksToShow.map(book => {
      book.genres.map(genre => {
        return genres.find(e => e === genre) === genre ? null : genres.push(genre)
      })
      return booksToShow
    })
    console.log('genres', genres)
    return (
      <div>
        {genres.map(genre => (
          <button onClick={() => filterByGenre(genre)} key={genre}>{genre}</button>
        ))}
      </div>
    )
  }

  const getAllBooks = () => {
    console.log('Getallbooks Runs')
    setGenreFilter('')
     fetchedBooks({
      fetchPolicy: "no-cache",
     })

    // console.log('fetcheedbooks.data')
    // books = fetchedBooks.data.allBooks
    // console.log('getAllBooks returns books::', books)
  }

  console.log('fetchedBooksCalled', fetchedBooksCalled)


  if (booksByGenreLoading || fetchedBooksLoading) {
    console.log('booksbyGenreloading', booksByGenreLoading)
    return (
      <div>loading...</div>
    )
  }

  if (genreFilter !== '') {
    return (
      <div>
    <h2>Books</h2>

    <table>
      <tbody>
        <tr>
          <th></th>
          <th>
            author
          </th>
          <th>
            published
          </th>
        </tr>
        {booksByGenreData.allBooks.map(book =>
          <tr key={book.title}>
            <td>{book.title}</td>
            <td>{book.author.name}</td>
            <td>{book.published}</td>
          </tr>
        )}
      </tbody>
    </table>
    {displayGenres()}
    <button onClick={() => getAllBooks()}>all</button>
  </div>
)
  }

  if (fetchedBooksData !== undefined) {
    console.log('fetchedbooks.loading', fetchedBooks.loading)
    return (
      <div>
        <h2>Books</h2>
  
        <table>
          <tbody>
            <tr>
              <th></th>
              <th>
                author
              </th>
              <th>
                published
              </th>
            </tr>
            {booksToShow.map(book =>
              <tr key={book.title}>
                <td>{book.title}</td>
                <td>{book.author.name}</td>
                <td>{book.published}</td>
              </tr>
            )}
          </tbody>
        </table>
        {displayGenres()}
      </div>
    )
    }

  if (genreFilter === '') {
  return (
    <div>
      <h2>Books</h2>

      <table>
        <tbody>
          <tr>
            <th></th>
            <th>
              author
            </th>
            <th>
              published
            </th>
          </tr>
          {booksToShow.map(book =>
            <tr key={book.title}>
              <td>{book.title}</td>
              <td>{book.author.name}</td>
              <td>{book.published}</td>
            </tr>
          )}
        </tbody>
      </table>
      {displayGenres()}
    </div>
  )
  }

  // return (
  //       <div>
  //     <h2>Books</h2>

  //     <table>
  //       <tbody>
  //         <tr>
  //           <th></th>
  //           <th>
  //             author
  //           </th>
  //           <th>
  //             published
  //           </th>
  //         </tr>
  //         {booksByGenreData.allBooks.map(book =>
  //           <tr key={book.title}>
  //             <td>{book.title}</td>
  //             <td>{book.author.name}</td>
  //             <td>{book.published}</td>
  //           </tr>
  //         )}
  //       </tbody>
  //     </table>
  //     {displayGenres()}
  //     <button onClick={() => getAllBooks()}>all</button>
  //   </div>
  // )

}

// const Books = ({booksResult, show}) => {
//   const [genreFilter, setGenreFilter] = useState('')

//   if (!show) {
//     return null
//   }

//   if (booksResult.loading) {
//     console.log('loading')
//     return <div>loading...</div>
//   }

//   console.log('booksresult:', booksResult)

//   if (!booksResult.data) {
//     return null
//   }

//   const books = [...booksResult.data.allBooks]

//   console.log('books[0].author.name', books[0].author.name)

//   const filterByGenre = (genre) => {
//     console.log('genre in filterBygenre', genre)
//     setGenreFilter(genre)
//   }

//   const displayGenres = () => {
//     let genres = []

//     books.map(book => {
//       book.genres.map(genre => {
//         return genres.find(e => e === genre) === genre ? null : genres.push(genre)
//       })
//       return books
//     })
//     console.log('genres', genres)
//     return (
//       <div>
//         {genres.map(genre => (
//           <button onClick={() => filterByGenre(genre)} key={genre}>{genre}</button>
//         ))}
//       </div>
//     )
//   }

//   const resetFilter = () => {
//     setGenreFilter('')
//   }

//   if (genreFilter === '') {
//   return (
//     <div>
//       <h2>Books</h2>

//       <table>
//         <tbody>
//           <tr>
//             <th></th>
//             <th>
//               author
//             </th>
//             <th>
//               published
//             </th>
//           </tr>
//           {books.map(book =>
//             <tr key={book.title}>
//               <td>{book.title}</td>
//               <td>{book.author.name}</td>
//               <td>{book.published}</td>
//             </tr>
//           )}
//         </tbody>
//       </table>
//       {displayGenres()}
//     </div>
//   )
//   }

//   return (
//         <div>
//       <h2>Books</h2>

//       <table>
//         <tbody>
//           <tr>
//             <th></th>
//             <th>
//               author
//             </th>
//             <th>
//               published
//             </th>
//           </tr>
//           {books.filter(book => book.genres.find(e => e === genreFilter) === genreFilter).map(book =>
//             <tr key={book.title}>
//               <td>{book.title}</td>
//               <td>{book.author.name}</td>
//               <td>{book.published}</td>
//             </tr>
//           )}
//         </tbody>
//       </table>
//       {displayGenres()}
//       <button onClick={() => resetFilter()}>all</button>
//     </div>
//   )

// }

export default Books