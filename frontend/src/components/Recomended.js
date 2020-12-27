import React from 'react'

const Recomended = (props) => {

  if (!props.show) {
    return null
  }

  if (!props.books2.data.allBooks) { return null }

  console.log('props:', props.books2.data.allBooks)

  const taulukko = props.books2.data.allBooks

  return (
    <div>
      <h2>books recomended based on genres</h2>

      <table>
        <tbody>
          <tr>
            <th>books</th>
            <th>author</th>
            <th>published</th>
          </tr>
          {taulukko.map(a =>
            <tr key={a.title}>
              <td>{a.title}</td>
              <td>{a.author.name}</td>
              <td>{a.published}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export default Recomended