import React from 'react'

const Recommended = ({loading, data, show, userResult}) => {

  if (!show) {
    return null;
  }

  console.log('data in Recommended', data)
  if (!data || loading) {
    console.log('loading')
    return <div>loading...</div>
  }

  // const userFavGenre = userResult.data.me.favoriteGenre

  // const booksByGenre = booksResult.data.allBooks.filter(book => book.genres.find(e => e === userFavGenre) === userFavGenre)

  return (
    <div>
      <h2>Recommendations</h2>
      <p>Books in your favorite genre</p>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {data.allBooks.map(book => 
            <tr key={book.title}>
              <td>{book.title}</td>
              <td>{book.author.name}</td>
              <td>{book.published}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export default Recommended