import React from 'react'
import AuthorForm from './AuthorForm'

const Authors = (props) => {

  if (!props.show) {
    return null
  }
  const authors = props.authors

  return (
    <div>
      <h2>authors</h2>
      <table>
        <tbody>
          <tr>
            <th>author</th>
            <th>
              born
            </th>
            <th>
              books
            </th>
          </tr>
          {authors.map(a =>
            <tr key={a.name}>
              <td>{a.name}</td>
              <td>{a.born}</td>
              <td>{a.authorBooksCount}</td>
            </tr>
          )}
        </tbody>
      </table>
      <div>
        <AuthorForm authors={authors}/>
      </div>
    </div>

  )
}

export default Authors
