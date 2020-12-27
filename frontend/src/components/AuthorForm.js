import React, { useState } from 'react'
import { useMutation } from '@apollo/client'

import { EDIT_AUTHOR } from './../queries'

const AuthorForm = (props) => {
  const [name, setName] = useState('')
  const [setBornTo, setBorn] = useState('')

  const [changeBorn] = useMutation(EDIT_AUTHOR)

  const authors = props.authors

  const submit = async (event) => {
    event.preventDefault()

    changeBorn({ variables: { name, setBornTo } })

    setName('')
    setBorn('')
  }
  return (
    <div>
      <h2>update born date</h2>

      <form onSubmit={submit}>
        <div>
          {/* name <input
            value={name}
            onChange={({ target }) => setName(target.value)}
          /> */}
          <select value={name} onChange={({ target }) => setName(target.value)}>
            {authors.map(a =>
              <option key={a.id} value={a.name}>{a.name}</option>)
            }
          </select>
        </div>
        <div>
          born <input
            value={setBornTo}
            onChange={({ target }) => setBorn(parseInt(target.value))}
          />
        </div>
        <button type='submit'>update author</button>
      </form>
    </div>
  )
}

export default AuthorForm

