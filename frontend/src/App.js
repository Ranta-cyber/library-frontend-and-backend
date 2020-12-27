
import React, { useState, useEffect } from 'react'
import Authors from './components/Authors'
import Books from './components/Books'
import NewBook from './components/NewBook'
import Recomended from './components/Recomended'
import { useQuery, useApolloClient, useMutation, useSubscription } from '@apollo/client'
import { ALL_AUTHORS } from './queries'
import { ALL_BOOKS } from './queries'
import { CURRENT_USER } from './queries'
import { FIND_BOOKS_BY_GENRE } from './queries'
import { LOGIN } from './queries'
import { BOOK_ADDED } from './queries'

const App = () => {
  const [errorMessage, setErrorMessage] = useState(null)
  const [token, setToken] = useState(null)
  const [page, setPage] = useState('books')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const client = useApolloClient()
  let genre = {}

  const result = useQuery(ALL_AUTHORS, {
    pollInterval: 2000
  })
  const resultBooks = useQuery(ALL_BOOKS)

  const userResult = useQuery(CURRENT_USER)

  console.log('userResult', userResult)

  if (userResult.data && userResult.data.me) {
    genre = userResult.data.me.favoriteGenre
  }

  const resultGenre = useQuery(FIND_BOOKS_BY_GENRE, { variables: { genreToSearch: genre } })

  //subscription
  const updateCacheWith = (addedBook) => {
    const includedIn = (set, object) =>
      set.map(p => p.id).includes(object.id)

    const dataInStore = client.readQuery({ query: ALL_BOOKS })
    if (!includedIn(dataInStore.allBooks, addedBook)) {
      client.writeQuery({
        query: ALL_BOOKS,
        data: { allBooks: dataInStore.allBooks.concat(addedBook) }
      })
    }
  }
  useSubscription(BOOK_ADDED, {
    onSubscriptionData: ({ subscriptionData }) => {
      const addedBook = subscriptionData.data.bookAdded
      console.log('subscriptiondata', subscriptionData)
      window.alert(`added book '${addedBook.title}'`)
      updateCacheWith(addedBook)
    }
  })

  //console.log('recomendedgenre:', genre)

  //console.log('result genre', resultGenre)

  const LoginForm = ({ setErrorMessage, setToken }) => {

    const [login, result] = useMutation(LOGIN, {
      onError: (error) => {
        setErrorMessage(error.graphQLErrors[0].message)
      }
    })

    useEffect(() => {
      if (result.data) {
        const token = result.data.login.value
        setToken(token)
        localStorage.setItem('library-user-token', token)
      }
    }, [result.data]) // eslint-disable-line

    const submit = async (event) => {
      event.preventDefault()

      login({ variables: { username, password } })


    }

    return (
      <div>
        <h2>log in</h2>
        <form onSubmit={submit}>
          <div>
            username <input
              value={username}
              onChange={({ target }) => setUsername(target.value)}
            />
          </div>
          <div>
            password <input
              type='password'
              value={password}
              onChange={({ target }) => setPassword(target.value)}
            />
          </div>
          <button type='submit'>login</button>
        </form>
      </div>
    )
  }

  const logout = () => {
    setToken(null)
    /* localStorage.clear()
    client.resetStore() */
    setPage('books')
  }

  if (result.loading) {
    return <div>loading...</div>
  }

  if (resultBooks.loading) {
    return <div>loading...</div>
  }



  return (
    <div>
      <div>
        <button onClick={() => setPage('login')}>log in</button>
        <button onClick={() => setPage('books')}>books</button>
        <button onClick={() => setPage('authors')}>authors</button>

        {token ?
          <button disabled={false} onClick={() => setPage('add')}>add book</button>
          : <button disabled={true} onClick={() => setPage('add')}>add book</button>
        }
        <button onClick={() => setPage('recomended')}>recomended</button>
        <button onClick={() => logout()}>log out</button>
      </div>

      <Books books={resultBooks.data.allBooks}
        show={page === 'books'}
      />

      <LoginForm
        show={page === 'login'}
        setErrorMessage={setErrorMessage}
        setToken={setToken}
      // setError={notify}
      />

      <Authors authors={result.data.allAuthors}
        show={page === 'authors'}
      />

      <NewBook
        show={page === 'add'}
      />

      <Recomended
        show={page === 'recomended'} books2={resultGenre}
      />

    </div>
  )
}

export default App