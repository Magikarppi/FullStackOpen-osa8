import React, { useState } from 'react';

const Authors = ({ authorsResult, show, setBornMut }) => {
  const [name, setName] = useState('');
  const [born, setBorn] = useState('');

  if (!show) {
    return null;
  }

  if (authorsResult.loading) {
    return <div>loading...</div>;
  }

  if (!authorsResult.data) {
    return null
  }

  const authors = [...authorsResult.data.allAuthors];

  const submit = async (event) => {
    event.preventDefault();

    const bornToNum = parseInt(born);
    await setBornMut({
      variables: { name, born: bornToNum }
    });

    setName('');
    setBorn('');
  };

  const displayAuthors = () => {
    if (authorsResult.loading) {
      return (
        <option disabled>Loading authors...</option>
      )
    }
    return authors.map(author => {
      return (
      <option key={author.id} value={author.name}>{author.name}</option>
      )
    })
  }

  return (
    <div>
      <h2>Authors</h2>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>born</th>
            <th>books</th>
          </tr>
          {authors.map((a) => (
            <tr key={a.name}>
              <td>{a.name}</td>
              <td>{a.born}</td>
              <td>{a.bookCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>Set birthyear</h2>
      <div>
        <form onSubmit={submit}>
          <div>
            name
            <select required={true} onChange={({ target }) => setName(target.value)}>
              <option>Select author</option>
              {displayAuthors()}
            </select>
          </div>
          <div>
            born
            <input
              value={born}
              onChange={({ target }) => setBorn(target.value)}
            />
          </div>
          <button type="submit">set</button>
        </form>
      </div>
    </div>
  );
};

export default Authors;
