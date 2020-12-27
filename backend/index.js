const { ApolloServer, AuthenticationError, UserInputError, gql } = require('apollo-server')
const mongoose = require('mongoose')
const Book = require('./models/bookSchema')
const Author = require('./models/authorSchema')
const User = require('./models/userSchema')
const { UniqueDirectiveNamesRule } = require('graphql')
const { v1: uuid } = require('uuid')

//subscriptions
const { PubSub } = require('apollo-server')
const pubsub = new PubSub()

const jwt = require('jsonwebtoken')

const JWT_SECRET = 'NEED_HERE_A_SECRET_KEY'

const MONGODB_URI = 'mongodb+srv://meridata:Salsa100@cluster0.cuzh1.mongodb.net/library?retryWrites=true&w=majority'
console.log('connecting to', MONGODB_URI)
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true })
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connection to MongoDB:', error.message)
  })

const typeDefs = gql`
type Book {
  title: String!
  published: Int!
  author: Author!
  genres: [String!]!
  id: ID!
  
}
type Author {
    name: String!
    born: Int
    id: ID!
    authorBooksCount: Int
}

type User {
  username: String!
  favoriteGenre: String!
  id: ID!
}

type Token {
  value: String!
}

type Subscription {
  bookAdded: Book!
}

    type Query {
      me: User
      authorCount: Int!
      bookCount: Int!
      allBooks(author: String, genre: String): [Book]
      allAuthors: [Author!]!
      authorBooksCount(name: String!): Int
    }

    type Mutation {
      createUser(
        username: String!
        favoriteGenre: String!
      ): User

      login(
        username: String!
        password: String!
      ): Token

      addBook(
        title: String!
        author: String!
        published: Int
        genres: [String]
      ) :Book
    
      addAuthor(
        name: String!
        born: Int!
      ) :Author

      editAuthor(
        name: String!
        setBornTo: Int
      ): Author
    }
`

const resolvers = {
  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator(['BOOK_ADDED'])
    },
  },
  Mutation: {
    createUser: (root, args) => {
      const user = new User({ username: args.username })

      return user.save()
        .catch(error => {
          throw new UserInputError(error.message, {
            invalidArgs: args,
          })
        })
    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username })

      if (!user || args.password !== 'secret') {
        throw new UserInputError("wrong credentials")
      }

      const userForToken = {
        username: user.username,
        id: user._id,
      }

      return { value: jwt.sign(userForToken, JWT_SECRET) }
    },
    editAuthor: async (root, args) => {
      console.log('args:', args)
      if (!args.setBornTo) return null

      let person = await Author.findOne({ name: args.name })
      if (person) {
        person.born = args.setBornTo
        try {
          await person.save()
        } catch (error) {
          throw new UserInputError(error.message, {
            invalidArgs: args,
          })
        }
        return person
      }
    },
    addBook: async (root, args, { currentUser }) => {
      console.log('addbook args:', args)
      console.log('addbooks currentUser:', currentUser)

      if (!currentUser) {
        throw new AuthenticationError("not authenticated")
      }
      const findAuthor = await Author.findOne({ name: args.author })
      if (findAuthor) {
        authorId = findAuthor._id

        const book = new Book({ ...args, author: authorId })


        console.log('book:', book)
        try {
          await book.save()
        } catch (error) {
          if (error.message.includes('title') && error.message.includes('is shorter')) {
            throw new UserInputError('title is too short', {
              invalidArgs: args
            })
          }

          throw new UserInputError(error.message, {
            invalidArgs: args,
          })
        }

        //subscription
        pubsub.publish('BOOK_ADDED', { bookAdded: book })

        return book
      }
    },

    /* const book = { ...args, id: uuid() }
    books = books.concat(book)
    const person = authors.find(p => p.name === book.author)
    if (!person) {
      console.log('person ei löytynyt', args)
      const author = { name: args.author, id: uuid() }
      authors = authors.concat(author)
    }
    return book */

    addAuthor: async (root, args, { currentUser }) => {

      if (!currentUser) {
        throw new AuthenticationError("not authenticated")
      }

      const author = new Author({ ...args })
      try {
        await author.save()
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        })
      }
      return author
    },

    /*  Author: {
       authorBooksCount: (args) => {
         console.log('author args:', args)
         return books.filter(p => p.author === args.name).length
       }
     },*/
  },
  Query: {
    me: (root, args, context) => {
      return context.currentUser
    },
    bookCount: () => Book.collection.countDocuments(),
    authorCount: () => Author.collection.countDocuments(),
    allAuthors: () => Author.find({}),
    allBooks: async (root, args) => {
      console.log('allBooks args', args)

      if (!args.genre) return Book.find({}).populate('author')

      /* if (args.author && args.genre) {
        paluu = books.filter(p => p.author === args.author && 
          p.genres.find(d => p = args.genre))
        return paluu
      } */
      if (args.genre) {

        const findGenres = await Book.find({ genres: { $in: [args.genre] } }).populate('author')
        return findGenres
      }
    }
  }

}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const auth = req ? req.headers.authorization : null
    if (auth && auth.toLowerCase().startsWith('bearer ')) {
      const decodedToken = jwt.verify(
        auth.substring(7), JWT_SECRET
      )
      const currentUser = await User
        .findById(decodedToken.id).populate('friends')
      return { currentUser }
    }
  },
  tracing: true
})

server.listen().then(({ url, subscriptionsUrl }) => {
  console.log(`Server ready at ${url}`)
  console.log(`Subscriptions ready at ${subscriptionsUrl}`)
})