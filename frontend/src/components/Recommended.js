import React from 'react'

const Recommended = ({loading, data, show}) => {

  if (!show) {
    return null;
  }

  if (!data || loading) {
    return <div>loading...</div>
  }

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