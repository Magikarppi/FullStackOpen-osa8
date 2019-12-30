const { ApolloServer, UserInputError, AuthenticationError, gql, PubSub } = require('apollo-server');
const mongoose = require('mongoose');
// const uuidv1 = require('uuid/v1');
require('dotenv').config();
const jwt = require('jsonwebtoken')
const DataLoader = require('dataloader')


const pubsub = new PubSub()

const JWT_SECRET = 'secret'

const Book = require('./models/Book');
const Author = require('./models/Author');
const User = require('./models/User')

mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

console.log('MONGODB_URI', process.env.MONGODB_URI);

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('connected to MongoDB');
  })
  .catch((error) => {
    console.log('error connection to MongoDB:', error.message);
  });

const typeDefs = gql`
  type Book {
    title: String!
    published: Int!
    author: Author!
    genres: [String!]!
    id: ID!
  }

  type Author {
    name: String
    id: ID!
    born: Int
    bookCount: Int
  }

  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }

  type Token {
    value: String!
  }

  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Book]
    allAuthors: [Author!]!
    me: User
  }

  type Mutation {
    addBook(
      title: String!
      author: String!
      published: Int!
      genres: [String!]!
    ): Book
    editAuthor(
      name: String!
      id: ID
      born: Int
      bookCount: Int
      setBornTo: Int
    ): Author
    createUser(
      username: String!
      favoriteGenre: String!
    ): User
    login(
      username: String!
      password: String!
    ): Token
  }

  type Subscription {
    bookAdded: Book!
  }

`;

const bookLoader = new DataLoader(async bookIds => {
  const allBooks = await Book.find({ author: { $in: bookIds } })
  let authorBooks = []
  allBooks.map(book => {
    if (!authorBooks[book.author]) {
      authorBooks[book.author] = []
    }
    authorBooks[book.author] = authorBooks[book.author].concat(book)
  })
  console.log(authorBooks)
  const books = bookIds.map(author => authorBooks[author])
  return books
})

const resolvers = {
  Query: {
    me: async (root, args, context) => {
      return context.currentUser
    },
    bookCount: async (root) => {
      console.log('book.collectoin', await Book.collection.countDocuments());
      const books = await Book.find({ author: root.name }).populate("author");
      return books.length;
    },
    authorCount: () => Author.collection.countDocuments(),
    allBooks: async (root, args) => {
      console.log('args in allbooks', args);
      if (!Object.keys(args).length) {
        const books = await Book.find({}).populate("author genre");
        return books;
      }

      if (args.author && args.genre) {
        const authorsBooks = await Book.find({ author: args.author }).populate("author genre");
        // const authorsBooks = books.filter(
        //   (book) => book.author === args.author
        // );
        const authorsBooksByGenre = authorsBooks.filter((book) =>
          book.genres.find((genre) => genre === args.genre)
        );
        return authorsBooksByGenre;
      }

      if (args.author) {
        return Book.find({ author: args.author }).populate("author genre");
      }

      if (args.genre) {      
        const books = await Book.find({}).populate("author genre");
        const filteredBooks = books.filter((book) =>
        book.genres.find((genre) => genre === args.genre)
      );
        return filteredBooks
      }
    },
    allAuthors: async () => {
      const authors = await Author.find({})
      return authors
    }
  },
  Author: {
    bookCount: async (root, args, context) => {
      const books = await context.bookLoader.load(root._id)
      return books.length
    }
  },
  Mutation: {
    addBook: async (root, args, context) => {
      console.log('args in addbook', args)
      const author = await Author.findOne({ name: args.author });
      const currentUser = context.currentUser

      if (!currentUser) {
        throw new AuthenticationError("not authenticated")
      }

      if (!author) {
        const newAuthor = new Author({
          name: args.author,
          born: null
        });

        try {
          await newAuthor.save();
        } catch (error) {
          throw new UserInputError(error.message, {
            invalidArgs: args
          });
        }
        // const book = new Book({ ...args, id: uuidv1(), author: newAuthor });
        const book = new Book({ ...args, author: newAuthor });
        try {
          await book.save();
        } catch (error) {
          throw new UserInputError(error.message, {
            invalidArgs: args
          });
        }
        pubsub.publish('BOOK_ADDED', { bookAdded: book })

        return book;
      }

      const book = new Book({ ...args, author: author });
      // const book = new Book({ ...args, id: uuidv1(), author: author });
      try {
        await book.save();
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args
        });
      }
      pubsub.publish('BOOK_ADDED', { bookAdded: book })

      return book;
    },
    editAuthor: async (root, args, context) => {

      const authorForEdit = await Author.findOne({ name: args.name });

      const currentUser = context.currentUser

      if (!currentUser) {
        throw new AuthenticationError("not authenticated")
      }

      if (authorForEdit) {
        authorForEdit.born = args.setBornTo;
        try {
          await authorForEdit.save();
        } catch (error) {
          throw new UserInputError(error.message, {
            invalidArgs: args
          });
        }
        return authorForEdit;
      }
      return null;
    },
    createUser: async (root, args) => {
      console.log('args in createuser', args)
      const user = new User({ username: args.username, favoriteGenre: args.favoriteGenre })

      console.log('user in createUser', user)
      return user.save()
      .catch(error => {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        })
      })
    },
    login: async (root, args) => {
      console.log('login runs with args', args)
      const user = await User.findOne({ username: args.username })
  
      if ( !user || args.password !== JWT_SECRET ) {
        throw new UserInputError("wrong credentials")
      }
  
      const userForToken = {
        username: user.username,
        id: user._id,
      }
  
      return { value: jwt.sign(userForToken, JWT_SECRET) }
    },
  },
  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator(['BOOK_ADDED'])
    }
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const auth = req ? req.headers.authorization : null
    if (auth && auth.toLowerCase().startsWith('bearer ')) {
      const decodedToken = jwt.verify(
        auth.substring(7), JWT_SECRET
      )
      const currentUser = await User.findById(decodedToken.id)
      return { currentUser, bookLoader }
    }
  }
});

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
